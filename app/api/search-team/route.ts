import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const leagueId = searchParams.get("league") || "314"; // Default: Overall league

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: "Search query must be at least 3 characters" },
      { status: 400 }
    );
  }

  try {
    // Search in the specified league
    const results = [];
    let page = 1;
    const maxPages = 10;

    while (page <= maxPages && results.length < 10) {
      const response = await fetch(
        `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
        {
          headers: {
            "User-Agent": "FPL-Assistant/1.0",
          },
        }
      );

      if (!response.ok) {
        break;
      }

      const data = await response.json();
      const standings = data.standings?.results || [];

      // Search for matching teams
      const searchLower = query.toLowerCase();
      const matches = standings.filter(
        (entry: any) =>
          entry.entry_name?.toLowerCase().includes(searchLower) ||
          entry.player_name?.toLowerCase().includes(searchLower)
      );

      results.push(
        ...matches.map((entry: any) => ({
          teamId: entry.entry,
          teamName: entry.entry_name,
          managerName: entry.player_name,
          rank: entry.rank,
          totalPoints: entry.total,
        }))
      );

      if (!data.standings?.has_next) {
        break;
      }

      page++;
    }

    return NextResponse.json({
      results: results.slice(0, 10),
      searchedPages: page,
    });
  } catch (error) {
    console.error("Error searching teams:", error);
    return NextResponse.json(
      { error: "Failed to search teams" },
      { status: 500 }
    );
  }
}
