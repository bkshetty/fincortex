import { NextResponse } from "next/server";
import { handlePreflight, withCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
    return handlePreflight(request);
}

export async function POST(req: Request) {
    const origin = req.headers.get("origin");
    try {
        const { invoiceId, email } = await req.json();

        if (!invoiceId || !email) {
            return withCors(NextResponse.json({ success: false, message: "Invoice ID and email content are required" }, { status: 400 }), origin);
        }

        // SIMULATION: In a real app, you would use SendGrid/Nodemailer here
        console.log(`[AGENTIC ACTION] Sending resolution email for Invoice ${invoiceId}`);
        console.log(`[EMAIL SUBJECT] ${email.subject}`);
        console.log(`[EMAIL BODY]\n${email.body}`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return withCors(NextResponse.json({
            success: true,
            message: "Resolution email sent to vendor successfully!"
        }), origin);
    } catch (error) {
        return withCors(
            NextResponse.json(
                { success: false, message: error instanceof Error ? error.message : "Failed to send email" },
                { status: 500 }
            ),
            origin
        );
    }
}
