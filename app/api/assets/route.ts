import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runRecommendationEngine } from "@/services/taxRecommendationService";

export async function POST(request: Request) {
  try {
    const { business_id, name, category, value, purchased_at } = await request.json();
    
    if (!business_id) return NextResponse.json({ message: "business_id required" }, { status: 400 });

    const asset = await prisma.asset.create({
      data: {
        business_id,
        name,
        category,
        value,
        purchased_at: purchased_at ? new Date(purchased_at) : new Date()
      }
    });

    // Auto-trigger analysis for Section 32 Depreciation matching
    runRecommendationEngine(business_id).catch(err => 
      console.error(`[AutoTrigger] Failed for business ${business_id}:`, err)
    );

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error("[ASSET_POST]", error);
    return NextResponse.json({ message: "Failed to save asset" }, { status: 500 });
  }
}
