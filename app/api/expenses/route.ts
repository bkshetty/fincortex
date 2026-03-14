import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runRecommendationEngine } from "@/services/taxRecommendationService";

export async function POST(request: Request) {
  try {
    const { business_id, category, amount, date } = await request.json();
    
    if (!business_id) return NextResponse.json({ message: "business_id required" }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        business_id,
        category,
        amount,
        date: date ? new Date(date) : new Date()
      }
    });

    // Auto-trigger analysis in background
    runRecommendationEngine(business_id).catch(err => 
      console.error(`[AutoTrigger] Failed for business ${business_id}:`, err)
    );

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error("[EXPENSE_POST]", error);
    return NextResponse.json({ message: "Failed to save expense" }, { status: 500 });
  }
}
