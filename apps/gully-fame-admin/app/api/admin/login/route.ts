import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    console.log("[Mock API] Login attempt:", { email, role });

    // Mock credentials
    const validCredentials = {
      admin: {
        email: "admin@gullyfame.com",
        password: "admin123",
      },
      sponsor: {
        email: "sponsor@gullyfame.com",
        password: "sponsor123",
      },
    };

    const roleKey = (role || "ADMIN").toLowerCase() as "admin" | "sponsor";
    const creds = validCredentials[roleKey];

    if (!creds || creds.email !== email || creds.password !== password) {
      return NextResponse.json(
        {
          code: 0,
          message: "Invalid email or password",
          data: null,
        },
        { status: 401 }
      );
    }

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        code: 1,
        message: "Login successful",
        data: {
          token,
          admin: {
            id: `${roleKey}_123`,
            _id: `${roleKey}_123`,
            email,
            name: roleKey === "admin" ? "Admin User" : "Sponsor User",
            role: roleKey,
            sponsorCode: roleKey === "sponsor" ? "SPONSOR_001" : undefined,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Mock API] Error:", error);
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
