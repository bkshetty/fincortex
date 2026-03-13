import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173", // Vite default
    "http://localhost:8081", // Expo web
    // Add your partner's deployed frontend URL here when ready
    // e.g. "https://partner-frontend.vercel.app"
];

export function corsHeaders(requestOrigin?: string | null) {
    const origin =
        requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
            ? requestOrigin
            : ALLOWED_ORIGINS[0];

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
    };
}

export function withCors(response: NextResponse, requestOrigin?: string | null) {
    const headers = corsHeaders(requestOrigin);
    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

/** Handle OPTIONS preflight requests */
export function handlePreflight(request: Request) {
    const origin = request.headers.get("origin");
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin)
    });
}
