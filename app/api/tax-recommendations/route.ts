import { NextResponse } from "next/server";
import { runInvoiceTaxAnalysis } from "@/services/taxRecommendationService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Return cached/last analysis results
    const result = await runInvoiceTaxAnalysis();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API_TAX_GET]", error);
    return NextResponse.json({ message: "Failed to fetch recommendations" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runInvoiceTaxAnalysis();
    return NextResponse.json({ 
      success: true, 
      ...result
    });
  } catch (error: any) {
    console.error("[API_TAX_RUN]", error);
    return NextResponse.json({ success: false, message: error.message || "Analysis failed" }, { status: 500 });
  }
}
