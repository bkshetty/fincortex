import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Mark a tax recommendation as successfully applied/processed by the CA
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.taxRecommendation.update({
      where: { id },
      data: { status: 'applied' }
    });
    
    return NextResponse.json({ success: true, message: "Strategy marked as applied" });
  } catch (error: any) {
    console.error("[CA_FLAG_APPLY]", error);
    return NextResponse.json({ message: "Failed to update strategy status" }, { status: 500 });
  }
}
