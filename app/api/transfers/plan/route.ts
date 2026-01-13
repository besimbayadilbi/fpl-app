import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TransferPlanRequest {
  teamId: number;
  horizon?: number;
  freeTransfers?: number;
  riskAppetite?: number;
  allowHits?: boolean;
  teamPlayerIds?: number[];
  budget?: number;
}

export async function POST(request: Request) {
  try {
    const body: TransferPlanRequest = await request.json();
    const {
      teamId,
      horizon = 3,
      freeTransfers = 1,
      riskAppetite = 50,
      allowHits = false,
      teamPlayerIds = [],
      budget = 0
    } = body;

    // Fetch bootstrap data for all players and fixtures
    const bootstrapRes = await fetch(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
      {
        headers: { "User-Agent": "FPL-Assistant/1.0" },
      }
    );

    if (!bootstrapRes.ok) {
      throw new Error("Failed to fetch FPL data");
    }

    const bootstrapData = await bootstrapRes.json();
    const allPlayers = bootstrapData.elements;
    const teams = bootstrapData.teams;
    const currentEvent = bootstrapData.events.find((e: any) => e.is_current)?.id || 1;

    // Fetch fixtures
    const fixturesRes = await fetch(
      "https://fantasy.premierleague.com/api/fixtures/",
      {
        headers: { "User-Agent": "FPL-Assistant/1.0" },
      }
    );

    const fixtures = fixturesRes.ok ? await fixturesRes.json() : [];

    // Get upcoming fixtures for the horizon
    const upcomingFixtures = fixtures.filter(
      (f: any) => f.event && f.event >= currentEvent && f.event < currentEvent + horizon
    );

    // Calculate team fixture difficulty
    const teamFixtureDifficulty: Record<number, number> = {};
    teams.forEach((team: any) => {
      const teamFixtures = upcomingFixtures.filter(
        (f: any) => f.team_h === team.id || f.team_a === team.id
      );

      const avgDifficulty = teamFixtures.length > 0
        ? teamFixtures.reduce((sum: number, f: any) => {
            const isHome = f.team_h === team.id;
            return sum + (isHome ? f.team_h_difficulty : f.team_a_difficulty);
          }, 0) / teamFixtures.length
        : 3;

      teamFixtureDifficulty[team.id] = avgDifficulty;
    });

    // Find teams with easiest fixtures (lowest difficulty)
    const sortedTeamsByFixtures = Object.entries(teamFixtureDifficulty)
      .sort(([, a], [, b]) => (a as number) - (b as number));

    const teamsWithEasyFixtures = sortedTeamsByFixtures
      .slice(0, 6)
      .map(([teamId]) => parseInt(teamId));

    const teamsWithHardFixtures = sortedTeamsByFixtures
      .slice(-4)
      .map(([teamId]) => parseInt(teamId));

    // Score players based on form, fixtures, and value
    const scoredPlayers = allPlayers
      .filter((p: any) => (p.status === 'a' || p.status === 'd') && p.minutes > 0)
      .map((player: any) => {
        const form = parseFloat(player.form) || 0;
        const ppg = parseFloat(player.points_per_game) || 0;
        const fixtureDiff = teamFixtureDifficulty[player.team] || 3;
        const fixtureScore = (5 - fixtureDiff) * 20; // 0-80 based on fixtures

        // Differential bonus for lower ownership (if risk appetite is high)
        const ownership = parseFloat(player.selected_by_percent) || 0;
        const differentialBonus = riskAppetite > 50
          ? Math.max(0, (100 - ownership) / 5)
          : 0;

        // Minutes certainty
        const minutesCertainty = player.minutes > 500 ? 90 : player.minutes > 200 ? 60 : 30;

        const totalScore = (form * 10) + (ppg * 5) + fixtureScore + differentialBonus + (minutesCertainty * 0.3);

        return {
          ...player,
          score: totalScore,
          fixtureDifficulty: fixtureDiff,
          minutesCertainty,
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Get top picks by position from teams with easy fixtures
    const suggestedPlayersByPosition = {
      GK: scoredPlayers
        .filter((p: any) => p.element_type === 1 && teamsWithEasyFixtures.includes(p.team))
        .slice(0, 3),
      DEF: scoredPlayers
        .filter((p: any) => p.element_type === 2 && teamsWithEasyFixtures.includes(p.team))
        .slice(0, 5),
      MID: scoredPlayers
        .filter((p: any) => p.element_type === 3 && teamsWithEasyFixtures.includes(p.team))
        .slice(0, 5),
      FWD: scoredPlayers
        .filter((p: any) => p.element_type === 4 && teamsWithEasyFixtures.includes(p.team))
        .slice(0, 4),
    };

    // Generate concrete transfer suggestions
    const topSuggestions = [
      ...suggestedPlayersByPosition.MID.slice(0, 2),
      ...suggestedPlayersByPosition.FWD.slice(0, 2),
      ...suggestedPlayersByPosition.DEF.slice(0, 2),
    ].slice(0, freeTransfers + (allowHits ? 2 : 0));

    const transfers = topSuggestions.map((player: any, index: number) => ({
      playerOutId: teamPlayerIds[index % teamPlayerIds.length] || 0,
      playerInId: player.id,
      gameweek: index < freeTransfers ? currentEvent : currentEvent + 1,
    }));

    // Generate team priority names
    const easyTeamNames = teamsWithEasyFixtures
      .map(id => teams.find((t: any) => t.id === id))
      .filter(Boolean)
      .slice(0, 4)
      .map((t: any) => t.short_name);

    const hardTeamNames = teamsWithHardFixtures
      .map(id => teams.find((t: any) => t.id === id))
      .filter(Boolean)
      .map((t: any) => t.short_name);

    // Generate strategy text based on analysis
    const strategyParts: string[] = [];

    // Transfer timing advice
    if (freeTransfers === 1 && !allowHits) {
      strategyParts.push(`For the next ${horizon} gameweeks, consider banking your free transfer this week to have 2 FTs next gameweek.`);
      strategyParts.push(`This allows you to make a double move at GW${currentEvent + 1} targeting the fixture swing.`);
    } else if (freeTransfers >= 2) {
      strategyParts.push(`With ${freeTransfers} free transfers, make your moves NOW before GW${currentEvent} deadline.`);
      strategyParts.push(`Target players from ${easyTeamNames.slice(0, 2).join(" and ")} who have favorable fixtures through GW${currentEvent + horizon - 1}.`);
    } else if (allowHits) {
      strategyParts.push(`Taking a -4 hit can be worth it if the expected points gain exceeds 4 over your horizon.`);
      strategyParts.push(`Consider a double transfer now: 1 free + 1 hit to capitalize on ${easyTeamNames[0]}'s excellent run.`);
    }

    // Fixture-based priorities
    strategyParts.push(`\n\n📈 PRIORITY TEAMS: ${easyTeamNames.join(", ")} have the easiest fixtures through GW${currentEvent + horizon - 1}.`);
    strategyParts.push(`📉 AVOID: ${hardTeamNames.join(", ")} face tough opposition in this period.`);

    // Position-specific advice
    const topMid = suggestedPlayersByPosition.MID[0];
    const topFwd = suggestedPlayersByPosition.FWD[0];
    if (topMid) {
      strategyParts.push(`\n\n🎯 KEY TARGET: ${topMid.web_name} (${teams.find((t: any) => t.id === topMid.team)?.short_name}) - Form: ${topMid.form}, Fixture difficulty: ${topMid.fixtureDifficulty.toFixed(1)}`);
    }
    if (topFwd && topFwd.id !== topMid?.id) {
      strategyParts.push(`🎯 FORWARD PICK: ${topFwd.web_name} (${teams.find((t: any) => t.id === topFwd.team)?.short_name}) - Form: ${topFwd.form}`);
    }

    // Risk appetite advice
    if (riskAppetite > 70) {
      const differential = scoredPlayers.find((p: any) =>
        parseFloat(p.selected_by_percent) < 10 && p.score > 50
      );
      if (differential) {
        strategyParts.push(`\n\n💎 DIFFERENTIAL: ${differential.web_name} (${parseFloat(differential.selected_by_percent).toFixed(1)}% owned) could be a rank-climbing pick.`);
      }
    }

    return NextResponse.json({
      strategy: strategyParts.join(" "),
      transfers,
      priorityTeams: easyTeamNames,
      avoidTeams: hardTeamNames,
      currentGameweek: currentEvent,
      horizonEnd: currentEvent + horizon - 1,
      topPicks: {
        midfielders: suggestedPlayersByPosition.MID.slice(0, 3).map((p: any) => ({
          id: p.id,
          name: p.web_name,
          team: teams.find((t: any) => t.id === p.team)?.short_name,
          form: p.form,
          price: p.now_cost / 10,
        })),
        forwards: suggestedPlayersByPosition.FWD.slice(0, 3).map((p: any) => ({
          id: p.id,
          name: p.web_name,
          team: teams.find((t: any) => t.id === p.team)?.short_name,
          form: p.form,
          price: p.now_cost / 10,
        })),
        defenders: suggestedPlayersByPosition.DEF.slice(0, 3).map((p: any) => ({
          id: p.id,
          name: p.web_name,
          team: teams.find((t: any) => t.id === p.team)?.short_name,
          form: p.form,
          price: p.now_cost / 10,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating transfer plan:", error);
    return NextResponse.json(
      { error: "Failed to generate transfer plan" },
      { status: 500 }
    );
  }
}
