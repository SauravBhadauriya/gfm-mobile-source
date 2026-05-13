import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          code: 0,
          message: "Unauthorized",
          data: null,
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log("[Mock API] GetDetails with token:", token.substring(0, 20) + "...");

    // Determine role from token (mock logic)
    const isAdmin = token.includes("admin") || Math.random() > 0.5;
    const roleKey = isAdmin ? "admin" : "sponsor";

    return NextResponse.json(
      {
        code: 1,
        message: "Admin details fetched successfully",
        data: {
          id: `${roleKey}_123`,
          _id: `${roleKey}_123`,
          email: roleKey === "admin" ? "admin@gullyfame.com" : "sponsor@gullyfame.com",
          name: roleKey === "admin" ? "Admin User" : "Sponsor User",
          role: roleKey,
          sponsorCode: roleKey === "sponsor" ? "SPONSOR_001" : undefined,
          createdAt: new Date().toISOString(),
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
