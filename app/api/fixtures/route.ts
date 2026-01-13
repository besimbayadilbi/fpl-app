import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://fantasy.premierleague.com/api/fixtures/",
      {
        headers: {
          "User-Agent": "FPL-Assistant/1.0",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixtures" },
      { status: 500 }
    );
  }
}
