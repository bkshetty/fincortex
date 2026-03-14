import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.taxRecommendation.update({
      where: { id },
      data: { status: 'dismissed' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TAX_DISMISS]", error);
    return NextResponse.json({ message: "Failed to dismiss recommendation" }, { status: 500 });
  }
}
