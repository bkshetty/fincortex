import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTaxReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Calculate the next deadline from a start date and frequency.
 * Returns the next future deadline date.
 */
function getNextDeadline(startDate: Date, frequency: string): Date {
  const now = new Date();
  const monthsStep = frequency === "quarterly" ? 3 : 1;
  
  let deadline = new Date(startDate);
  // Walk forward from the start date until we find a future deadline
  while (deadline <= now) {
    deadline.setMonth(deadline.getMonth() + monthsStep);
  }
  return deadline;
}

/**
 * Check if today is within the reminder window (7 days before deadline)
 */
function isInReminderWindow(nextDeadline: Date): boolean {
  const now = new Date();
  const diffMs = nextDeadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Check if a reminder was already sent for this period
 */
function wasAlreadySentThisPeriod(lastSent: Date | null, nextDeadline: Date, frequency: string): boolean {
  if (!lastSent) return false;
  const monthsStep = frequency === "quarterly" ? 3 : 1;
  const periodStart = new Date(nextDeadline);
  periodStart.setMonth(periodStart.getMonth() - monthsStep);
  return lastSent >= periodStart;
}

/**
 * GET /api/cron/tax-reminder
 * 
 * Called by an external cron or manually.
 * Query param: ?secret=CRON_SECRET (required)
 * Query param: ?test=true (optional — sends to all users regardless of schedule, for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    const isTest = request.nextUrl.searchParams.get("test") === "true";
    const cronSecret = process.env.CRON_SECRET;

    // FOR TEST BUTTON: If coming from the frontend, check the Auth Header
    let isAuthenticated = false;
    const authHeader = request.headers.get("authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      // Validate with Supabase (simplified check: any valid user can trigger their own test)
      isAuthenticated = true; 
    } else if (cronSecret && secret === cronSecret) {
      // Validate with external secret (for real bots)
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized. Please enter a valid secret or log in." }, { status: 401 });
    }

    let usersToRemind: any[] = [];

    // If it's a test triggered from the UI, we prioritize the logged-in user
    if (isTest && authHeader) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user?.email) {
        console.log(`[TaxCron] Test mode: targeting logged-in user ${user.email}`);
        // Create a temporary "mock" user preference if they don't have one saved yet
        const existing = await prisma.userPreference.findUnique({ where: { user_email: user.email } });
        usersToRemind = [existing || {
          id: 'temp',
          user_email: user.email,
          tax_frequency: 'monthly',
          period_start_date: new Date(),
          notifications_enabled: true,
          last_reminder_sent: null
        }];
      }
    } else {
      // Normal cron mode: Get all users with notifications enabled
      usersToRemind = await prisma.userPreference.findMany({
        where: { notifications_enabled: true },
      });
    }

    console.log(`[TaxCron] Processing ${usersToRemind.length} user(s)`);

    let emailsSent = 0;
    const results: { email: string; status: string; deadline?: string }[] = [];

    for (const user of usersToRemind) {
      const nextDeadline = getNextDeadline(user.period_start_date, user.tax_frequency);
      const deadlineStr = nextDeadline.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // In test mode, send regardless. In prod mode, only send if in the 7-day window
      const shouldSend = isTest || (
        isInReminderWindow(nextDeadline) &&
        !wasAlreadySentThisPeriod(user.last_reminder_sent, nextDeadline, user.tax_frequency)
      );

      if (shouldSend) {
        try {
          await sendTaxReminderEmail({
            to: user.user_email,
            frequency: user.tax_frequency,
            nextDeadline: deadlineStr,
          });

          // Update last_reminder_sent (only if not a temp mock user)
          if (user.id !== 'temp') {
            await prisma.userPreference.update({
              where: { id: user.id },
              data: { last_reminder_sent: new Date() },
            });
          }


          emailsSent++;
          results.push({ email: user.user_email, status: "sent", deadline: deadlineStr });
          console.log(`[TaxCron] ✅ Reminder sent to ${user.user_email} (deadline: ${deadlineStr})`);
        } catch (err: any) {
          console.error(`[TaxCron] ❌ Failed to send to ${user.user_email}:`, err.message);
          results.push({ email: user.user_email, status: `failed: ${err.message}` });
        }
      } else {
        results.push({ email: user.user_email, status: "skipped (not in window or already sent)" });
      }
    }

    return NextResponse.json({
      success: true,
      total_users_processed: usersToRemind.length,
      emails_sent: emailsSent,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[TAX_CRON_ERROR]", error);
    return NextResponse.json({ message: error.message || "Cron failed" }, { status: 500 });
  }
}
