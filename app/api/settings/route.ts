import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper to extract user email from Supabase auth token
async function getUserEmail(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email) return null;
  return user.email;
}

/**
 * GET /api/settings — Load user preferences
 */
export async function GET(request: Request) {
  try {
    const email = await getUserEmail(request);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { user_email: email },
    });

    if (!prefs) {
      // Return defaults if no saved preferences
      return NextResponse.json({
        notifications_enabled: true,
        tax_frequency: "monthly",
        period_start_date: new Date().toISOString(),
        last_reminder_sent: null,
      });
    }

    return NextResponse.json({
      notifications_enabled: prefs.notifications_enabled,
      tax_frequency: prefs.tax_frequency,
      period_start_date: prefs.period_start_date.toISOString(),
      last_reminder_sent: prefs.last_reminder_sent?.toISOString() || null,
    });
  } catch (error: any) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
  }
}

/**
 * POST /api/settings — Save user preferences
 */
export async function POST(request: Request) {
  try {
    const email = await getUserEmail(request);
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notifications_enabled, tax_frequency, period_start_date } = body;

    const prefs = await prisma.userPreference.upsert({
      where: { user_email: email },
      update: {
        notifications_enabled: notifications_enabled ?? true,
        tax_frequency: tax_frequency || "monthly",
        period_start_date: period_start_date ? new Date(period_start_date) : new Date(),
      },
      create: {
        user_email: email,
        notifications_enabled: notifications_enabled ?? true,
        tax_frequency: tax_frequency || "monthly",
        period_start_date: period_start_date ? new Date(period_start_date) : new Date(),
      },
    });

    console.log(`[Settings] Saved preferences for ${email}: freq=${prefs.tax_frequency}`);

    return NextResponse.json({
      success: true,
      notifications_enabled: prefs.notifications_enabled,
      tax_frequency: prefs.tax_frequency,
      period_start_date: prefs.period_start_date.toISOString(),
    });
  } catch (error: any) {
    console.error("[SETTINGS_POST]", error);
    return NextResponse.json({ message: "Failed to save settings" }, { status: 500 });
  }
}
