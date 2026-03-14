import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Fetch all tax recommendations flagged by businesses for CA review
 */
export async function GET() {
  try {
    const flags = await prisma.taxRecommendation.findMany({
      where: { status: 'flagged_to_ca' },
      include: { 
        rule: true,
        business: {
            select: {
                id: true,
                name: true,
                entity_type: true
            }
        }
      },
      orderBy: { flagged_at: 'desc' }
    });
    
    return NextResponse.json({ flags });
  } catch (error: any) {
    console.error("[CA_FLAGS_GET]", error);
    return NextResponse.json({ message: "Failed to fetch flags" }, { status: 500 });
  }
}
