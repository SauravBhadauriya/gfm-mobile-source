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
    console.log("[API] GetDetails with token:", token.substring(0, 20) + "...");

    // Determine backend URL based on environment
    let detailsEndpoint = "http://103.194.228.68:3552/v1/api/admin/getDetails";

    // Check if running on Vercel (production)
    if (process.env.VERCEL_ENV === "production") {
      // For production, try to use environment variable or public URL
      detailsEndpoint =
        process.env.BACKEND_URL || "http://103.194.228.68:3552/v1/api/admin/getDetails";
      console.log("[API] Production mode - using:", detailsEndpoint);
    } else {
      console.log("[API] Development mode - using local backend");
    }

    console.log("[API] Proxying to backend:", detailsEndpoint);

    const response = await fetch(detailsEndpoint, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
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
