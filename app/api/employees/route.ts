import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runRecommendationEngine } from "@/services/taxRecommendationService";

export async function POST(request: Request) {
  try {
    const { business_id, name, hired_at, salary } = await request.json();
    
    if (!business_id) return NextResponse.json({ message: "business_id required" }, { status: 400 });

    const employee = await prisma.employee.create({
      data: {
        business_id,
        name,
        salary,
        hired_at: hired_at ? new Date(hired_at) : new Date()
      }
    });

    // Auto-trigger analysis for 80JJAA matching
    runRecommendationEngine(business_id).catch(err => 
      console.error(`[AutoTrigger] Failed for business ${business_id}:`, err)
    );

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error("[EMPLOYEE_POST]", error);
    return NextResponse.json({ message: "Failed to save employee" }, { status: 500 });
  }
}
