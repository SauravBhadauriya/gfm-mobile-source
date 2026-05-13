import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    console.log("[API] Login attempt:", { email, role });

    // Determine backend URL based on environment
    let loginEndpoint = "http://103.194.228.68:3552/v1/api/admin/login";

    // Check if running on Vercel (production)
    if (process.env.VERCEL_ENV === "production") {
      // For production, try to use environment variable or public URL
      loginEndpoint = process.env.BACKEND_URL || "http://103.194.228.68:3552/v1/api/admin/login";
      console.log("[API] Production mode - using:", loginEndpoint);
    } else {
      console.log("[API] Development mode - using local backend");
    }

    console.log("[API] Proxying to backend:", loginEndpoint);

    const response = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role,
      }),
    });

    const data = await response.json();

    console.log("[API] Backend response status:", response.status);
    console.log("[API] Backend response:", data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      {
        code: 0,
        message: "Internal server error",
        data: null,
      },
      { status: 500 }
    );
  }
}
