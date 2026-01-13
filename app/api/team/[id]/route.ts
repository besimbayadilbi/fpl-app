import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const teamId = params.id;

  try {
    // First, get manager info
    const managerResponse = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/`,
      {
        headers: {
          "User-Agent": "FPL-Assistant/1.0",
        },
      }
    );

    if (!managerResponse.ok) {
      if (managerResponse.status === 404) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }
      throw new Error(`FPL API responded with status: ${managerResponse.status}`);
    }

    const managerData = await managerResponse.json();
    const currentEvent = managerData.current_event;

    // Then get team picks for current gameweek
    const picksResponse = await fetch(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`,
      {
        headers: {
          "User-Agent": "FPL-Assistant/1.0",
        },
      }
    );

    if (!picksResponse.ok) {
      throw new Error(`Failed to fetch team picks: ${picksResponse.status}`);
    }

    const picksData = await picksResponse.json();

    // Return combined data
    return NextResponse.json({
      manager: managerData,
      picks: picksData,
      currentEvent,
    });
  } catch (error) {
    console.error("Error fetching team data:", error);
    return NextResponse.json(
      { error: "Failed to fetch team data" },
      { status: 500 }
    );
  }
}
