import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    console.log("[API] Login attempt:", { email, role });

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://103.194.228.68:3552/v1/api/";
    const loginEndpoint = `${backendUrl}admin/login`;

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
