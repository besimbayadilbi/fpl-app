import { NextResponse } from "next/server";
import { generateTransferStrategy, TransferStrategyInput } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      players,
      budget,
      freeTransfers,
      horizon,
      riskAppetite,
      allowHits,
      teams,
      fixtures,
    } = body;

    if (!players || !teams) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const input: TransferStrategyInput = {
      currentTeam: {
        players,
        budget: budget || 0,
        freeTransfers: freeTransfers || 1,
      },
      upcomingFixtures: fixtures || [],
      horizon: horizon || 3,
      riskAppetite: riskAppetite || "medium",
      allowHits: allowHits || false,
      teams,
    };

    const strategy = await generateTransferStrategy(input);

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Error generating AI strategy:", error);
    return NextResponse.json(
      { error: "Failed to generate strategy. Please try again." },
      { status: 500 }
    );
  }
}
