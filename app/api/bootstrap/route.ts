import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      {
        headers: {
          "User-Agent": "FPL-Assistant/1.0",
        },
        cache: "no-store", // Skip cache for large response
      }
    );

    if (!response.ok) {
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching bootstrap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch FPL data" },
      { status: 500 }
    );
  }
}
