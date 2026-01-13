import { NextResponse } from "next/server";
import {
  generateTeamAnalysis,
  generateCaptainAnalysis,
  generateLineupSuggestion,
  getPlayersToWatch,
} from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, players, teams, budget, teamValue, fixtures, gameweek, allPlayers } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Analysis type is required" },
        { status: 400 }
      );
    }

    let result: string;

    switch (type) {
      case "team":
        if (!players || !teams) {
          return NextResponse.json(
            { error: "Players and teams data required for team analysis" },
            { status: 400 }
          );
        }
        result = await generateTeamAnalysis({
          players,
          budget: budget || 0,
          teamValue: teamValue || 0,
          teams,
          upcomingFixtures: fixtures || [],
        });
        break;

      case "captain":
        if (!players || !teams) {
          return NextResponse.json(
            { error: "Players and teams data required for captain analysis" },
            { status: 400 }
          );
        }
        result = await generateCaptainAnalysis({
          players,
          upcomingFixtures: fixtures || [],
          teams,
          gameweek: gameweek || 1,
        });
        break;

      case "lineup":
        if (!players || !teams) {
          return NextResponse.json(
            { error: "Players and teams data required for lineup suggestion" },
            { status: 400 }
          );
        }
        result = await generateLineupSuggestion(
          players,
          teams,
          fixtures || [],
          gameweek || 1
        );
        break;

      case "watchlist":
        if (!allPlayers || !teams) {
          return NextResponse.json(
            { error: "All players and teams data required for watchlist" },
            { status: 400 }
          );
        }
        result = await getPlayersToWatch(allPlayers, teams, fixtures || []);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid analysis type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in AI analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis. Please try again." },
      { status: 500 }
    );
  }
}
