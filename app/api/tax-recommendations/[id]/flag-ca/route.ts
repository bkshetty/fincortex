import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // Update recommendation status
    const rec = await prisma.taxRecommendation.update({
      where: { id },
      data: { 
        status: 'flagged_to_ca',
        flagged_at: new Date()
      },
      include: { rule: true }
    });

    // Create notification for CA
    await prisma.cANotification.create({
      data: {
        business_id: rec.business_id,
        recommendation_id: rec.id,
        message: `Tax saving opportunity flagged: ${rec.rule.section_name}. Estimated saving ₹${rec.estimated_saving_inr.toLocaleString('en-IN')}. Please review.`,
        is_read: false
      }
    });

    return NextResponse.json({ success: true, message: "Flagged to your CA" });
  } catch (error) {
    console.error("[TAX_FLAG_CA]", error);
    return NextResponse.json({ message: "Failed to flag to CA" }, { status: 500 });
  }
}
