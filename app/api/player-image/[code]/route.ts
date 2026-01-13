import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  try {
    const imageUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://fantasy.premierleague.com/",
      },
    });

    if (!response.ok) {
      // Return a placeholder image response
      return new NextResponse(null, { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error fetching player image:", error);
    return new NextResponse(null, { status: 500 });
  }
}
