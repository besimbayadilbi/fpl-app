import Groq from "groq-sdk";
import type { Player, Team, Fixture } from "@/types/fpl";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const FPL_SYSTEM_PROMPT = `You are an expert Fantasy Premier League (FPL) analyst and strategist.

CRITICAL INSTRUCTIONS:
- You MUST ONLY use the player names, team names, fixtures, and data provided to you in the user's message
- DO NOT make up or invent any player names, team names, fixtures, or statistics
- DO NOT reference players, teams, or fixtures that are not explicitly provided in the data
- If you don't have specific data about something, say "Data not available" rather than making something up
- All player names, team names, and fixture information must come EXACTLY from the provided data
- Use ONLY the statistics, form, and fixture difficulty ratings provided in the data

When providing advice:
- Reference ONLY the players and teams provided in the data
- Use ONLY the fixture information provided (team names, FDR ratings, home/away status)
- Base recommendations on the actual statistics provided (form, points per game, ownership, etc.)
- Consider ownership percentages for differential impact
- Factor in injury status and availability from the provided data
- Provide actionable, clear recommendations based on the real data provided
- Use data-driven reasoning from the actual statistics given
- Be concise but thorough

If the data provided doesn't include certain information, acknowledge this rather than inventing it.`;

export interface TransferStrategyInput {
  currentTeam: {
    players: Player[];
    budget: number;
    freeTransfers: number;
  };
  upcomingFixtures: Fixture[];
  horizon: number;
  riskAppetite: "low" | "medium" | "high";
  allowHits: boolean;
  teams: Team[];
}

export interface CaptainAnalysisInput {
  players: Player[];
  upcomingFixtures: Fixture[];
  teams: Team[];
  gameweek: number;
}

export interface TeamAnalysisInput {
  players: Player[];
  budget: number;
  teamValue: number;
  teams: Team[];
  upcomingFixtures: Fixture[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Generate transfer strategy
export async function generateTransferStrategy(
  input: TransferStrategyInput
): Promise<string> {
  try {
    const { currentTeam, upcomingFixtures, horizon, riskAppetite, allowHits, teams } = input;

    // Build team summary with more details
    const teamSummary = currentTeam.players.map(p => {
      const team = teams.find(t => t.id === p.team);
      const position = ["", "GK", "DEF", "MID", "FWD"][p.element_type];
      const status = p.status === "a" ? "Available" : p.status === "d" ? "Doubtful" : p.status === "i" ? "Injured" : p.status === "s" ? "Suspended" : "Unavailable";
      return `${p.web_name} (${team?.short_name || "Unknown"}, ${position}) - £${(p.now_cost / 10).toFixed(1)}m | Form: ${p.form} | PPG: ${p.points_per_game} | Total: ${p.total_points}pts | Owned: ${p.selected_by_percent}% | Goals: ${p.goals_scored} | Assists: ${p.assists} | Status: ${status}`;
    }).join("\n");

    // Build fixture summary
    const fixturesByTeam: Record<number, string[]> = {};
    upcomingFixtures.slice(0, horizon * 10).forEach(f => {
      if (!fixturesByTeam[f.team_h]) fixturesByTeam[f.team_h] = [];
      if (!fixturesByTeam[f.team_a]) fixturesByTeam[f.team_a] = [];

      const homeTeam = teams.find(t => t.id === f.team_h)?.short_name || "Unknown";
      const awayTeam = teams.find(t => t.id === f.team_a)?.short_name || "Unknown";

      fixturesByTeam[f.team_h].push(`GW${f.event || "TBD"}: vs ${awayTeam} (H) - FDR: ${f.team_h_difficulty}`);
      fixturesByTeam[f.team_a].push(`GW${f.event || "TBD"}: vs ${homeTeam} (A) - FDR: ${f.team_a_difficulty}`);
    });

    const fixturesSummary = Object.entries(fixturesByTeam)
      .map(([teamId, fixtures]) => {
        const team = teams.find(t => t.id === parseInt(teamId));
        return `${team?.short_name || "Unknown"} fixtures:\n${fixtures.join("\n")}`;
      })
      .join("\n\n");

    const prompt = `Analyze this FPL team and provide a detailed transfer strategy for the next ${horizon} gameweeks using ONLY the data provided below. DO NOT reference any players, teams, or fixtures not listed here.

CURRENT TEAM (use ONLY these players):
${teamSummary}

UPCOMING FIXTURES (use ONLY these fixtures):
${fixturesSummary || "No fixture data available"}

BUDGET IN BANK: £${(currentTeam.budget / 10).toFixed(1)}m
FREE TRANSFERS: ${currentTeam.freeTransfers}
RISK APPETITE: ${riskAppetite}
WILLING TO TAKE HITS: ${allowHits ? "Yes" : "No"}

IMPORTANT: Only reference players and teams listed above. Do not make up player names, team names, or fixtures. If suggesting transfers, only suggest players/teams from the data if available, otherwise provide general strategic advice.

Based on this information:
1. Identify the weakest players who should be transferred out (from the current team data)
2. Recommend specific replacements with reasoning (only if replacement data is available, otherwise provide general guidance)
3. Suggest optimal timing for transfers (which gameweek based on fixture data)
4. Provide a priority order for transfers
5. Mention any differentials worth considering (based on ownership data)
6. Note any players to monitor for price rises/falls (based on actual price change data if available)

Be specific and actionable. Format your response clearly with sections. If you don't have data about something, say so rather than making it up.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FPL_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || "Unable to generate strategy. Please try again.";
  } catch (error) {
    console.error("Error generating transfer strategy:", error);
    throw new Error("Failed to generate transfer strategy. Please check your API key and try again.");
  }
}

// Generate captain analysis
export async function generateCaptainAnalysis(
  input: CaptainAnalysisInput
): Promise<string> {
  try {
    const { players, upcomingFixtures, teams, gameweek } = input;

    const playerSummary = players.map(p => {
      const team = teams.find(t => t.id === p.team);
      const nextFixture = upcomingFixtures.find(f =>
        (f.team_h === p.team || f.team_a === p.team) && f.event === gameweek
      );

      let fixtureInfo = "No fixture data";
      if (nextFixture) {
        const isHome = nextFixture.team_h === p.team;
        const opponent = teams.find(t => t.id === (isHome ? nextFixture.team_a : nextFixture.team_h));
        const fdr = isHome ? nextFixture.team_h_difficulty : nextFixture.team_a_difficulty;
        fixtureInfo = `${isHome ? "H" : "A"} vs ${opponent?.short_name || "Unknown"} (FDR: ${fdr})`;
      }

      const status = p.status === "a" ? "Available" : p.status === "d" ? "Doubtful" : p.status === "i" ? "Injured" : p.status === "s" ? "Suspended" : "Unavailable";
      return `${p.web_name} (${team?.short_name || "Unknown"}) - Form: ${p.form} | PPG: ${p.points_per_game} | Total: ${p.total_points}pts | Owned: ${p.selected_by_percent}% | Goals: ${p.goals_scored} | Assists: ${p.assists} | Status: ${status} | GW${gameweek}: ${fixtureInfo}`;
    }).join("\n");

    const prompt = `Analyze these players for GW${gameweek} captain selection using ONLY the data provided below. DO NOT reference any players, teams, or fixtures not listed here.

PLAYERS IN MY TEAM (use ONLY these players):
${playerSummary}

IMPORTANT: Only reference players and teams listed above. Do not make up player names, team names, or fixtures.

Provide:
1. TOP 3 captain picks with detailed reasoning (based on actual form, fixtures, and stats provided)
2. Best differential captain (low ownership, high upside from the data)
3. Safe captain pick (consistent, high floor based on actual stats)
4. Risk/reward analysis for each option (consider status field for injury/availability)
5. Your #1 recommendation with confidence level

Base all recommendations on the actual statistics, form, fixture difficulty, and ownership data provided. If data is missing, acknowledge it rather than inventing it.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FPL_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "Unable to generate captain analysis.";
  } catch (error) {
    console.error("Error generating captain analysis:", error);
    throw new Error("Failed to generate captain analysis.");
  }
}

// Generate team analysis
export async function generateTeamAnalysis(
  input: TeamAnalysisInput
): Promise<string> {
  try {
    const { players, budget, teamValue, teams, upcomingFixtures } = input;

    const teamSummary = players.map(p => {
      const team = teams.find(t => t.id === p.team);
      const position = ["", "GK", "DEF", "MID", "FWD"][p.element_type];
      const status = p.status === "a" ? "Available" : p.status === "d" ? "Doubtful" : p.status === "i" ? "Injured" : p.status === "s" ? "Suspended" : "Unavailable";
      return `${p.web_name} (${team?.short_name || "Unknown"}, ${position}) - £${(p.now_cost / 10).toFixed(1)}m | Form: ${p.form} | PPG: ${p.points_per_game} | Total: ${p.total_points}pts | Owned: ${p.selected_by_percent}% | Status: ${status} | Goals: ${p.goals_scored} | Assists: ${p.assists}`;
    }).join("\n");

    // Build upcoming fixtures summary
    const fixturesSummary = upcomingFixtures.slice(0, 10).map(f => {
      const homeTeam = teams.find(t => t.id === f.team_h);
      const awayTeam = teams.find(t => t.id === f.team_a);
      return `GW${f.event || "TBD"}: ${homeTeam?.short_name || "?"} vs ${awayTeam?.short_name || "?"} (H FDR: ${f.team_h_difficulty}, A FDR: ${f.team_a_difficulty})`;
    }).join("\n");

    const prompt = `Analyze this FPL team using ONLY the data provided below. DO NOT reference any players, teams, or fixtures not listed here.

SQUAD (15 players - use ONLY these names):
${teamSummary}

TEAM VALUE: £${(teamValue / 10).toFixed(1)}m
MONEY IN BANK: £${(budget / 10).toFixed(1)}m

UPCOMING FIXTURES (use ONLY these fixtures):
${fixturesSummary || "No upcoming fixtures data available"}

IMPORTANT: Only reference players and teams listed above. Do not make up player names, team names, or fixtures.

Provide a detailed analysis including:
1. STRENGTHS: What's working well in this team? (based on the actual stats provided)
2. WEAKNESSES: Areas that need improvement (based on the actual stats provided)
3. SUGGESTED IMPROVEMENTS: Specific changes to consider (only suggest players/teams from the data if available)
4. RISK ASSESSMENT: Injury concerns, rotation risks (based on status field in the data)
5. BUDGET OPTIMIZATION: Are funds being used efficiently?
6. OVERALL RATING: Rate this team out of 10 with justification

Be honest and constructive in your analysis. If you don't have data about something, say so rather than making it up.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FPL_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    return completion.choices[0]?.message?.content || "Unable to generate team analysis.";
  } catch (error) {
    console.error("Error generating team analysis:", error);
    throw new Error("Failed to generate team analysis.");
  }
}

// Generate lineup suggestion
export async function generateLineupSuggestion(
  players: Player[],
  teams: Team[],
  upcomingFixtures: Fixture[],
  gameweek: number
): Promise<string> {
  try {
    const playerSummary = players.map(p => {
      const team = teams.find(t => t.id === p.team);
      const position = ["", "GK", "DEF", "MID", "FWD"][p.element_type];
      const nextFixture = upcomingFixtures.find(f =>
        (f.team_h === p.team || f.team_a === p.team) && f.event === gameweek
      );

      let fixtureInfo = "No fixture data";
      if (nextFixture) {
        const isHome = nextFixture.team_h === p.team;
        const opponent = teams.find(t => t.id === (isHome ? nextFixture.team_a : nextFixture.team_h));
        const fdr = isHome ? nextFixture.team_h_difficulty : nextFixture.team_a_difficulty;
        fixtureInfo = `${isHome ? "H" : "A"} vs ${opponent?.short_name || "Unknown"} (FDR: ${fdr})`;
      }

      const status = p.status === "a" ? "Available" : p.status === "d" ? "Doubtful" : p.status === "i" ? "Injured" : p.status === "s" ? "Suspended" : "Unavailable";
      return `${p.web_name} (${position}, ${team?.short_name || "Unknown"}) - Form: ${p.form} | PPG: ${p.points_per_game} | Total: ${p.total_points}pts | ${fixtureInfo} | Status: ${status}`;
    }).join("\n");

    const prompt = `Select the optimal starting 11 from these 15 players for GW${gameweek} using ONLY the data provided below. DO NOT reference any players, teams, or fixtures not listed here.

SQUAD (use ONLY these players):
${playerSummary}

IMPORTANT: Only reference players and teams listed above. Do not make up player names, team names, or fixtures.

Requirements:
- Must pick exactly 11 starters from the squad above
- Formation must be valid (1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD)
- 4 players on bench in priority order
- Select captain and vice-captain from the squad
- Consider player status (injured/suspended players should not start if possible)

Provide:
1. STARTING XI with formation (use exact player names from the data)
2. CAPTAIN pick with reasoning (based on form, fixture, and stats provided)
3. VICE-CAPTAIN pick (based on form, fixture, and stats provided)
4. BENCH ORDER (1st to 4th sub - use exact player names)
5. Key considerations for this lineup (based on the actual data provided)`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FPL_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "Unable to generate lineup suggestion.";
  } catch (error) {
    console.error("Error generating lineup suggestion:", error);
    throw new Error("Failed to generate lineup suggestion.");
  }
}

// Chat with FPL assistant
export async function chatWithAssistant(
  messages: ChatMessage[],
  teamContext?: {
    players: Player[];
    teams: Team[];
    budget: number;
    gameweek: number;
  }
): Promise<string> {
  try {
    let systemMessage = FPL_SYSTEM_PROMPT;

    if (teamContext) {
      const teamSummary = teamContext.players.map(p => {
        const team = teamContext.teams.find(t => t.id === p.team);
        const position = ["", "GK", "DEF", "MID", "FWD"][p.element_type];
        return `${p.web_name} (${team?.short_name || "Unknown"}, ${position}) - Form: ${p.form}, PPG: ${p.points_per_game}, Total: ${p.total_points}pts`;
      }).join("\n");

      systemMessage += `\n\nUSER'S CURRENT TEAM (use ONLY these players when referencing their team):
${teamSummary}
BUDGET: £${(teamContext.budget / 10).toFixed(1)}m
CURRENT GAMEWEEK: ${teamContext.gameweek}

IMPORTANT: When answering questions, only reference players and teams from the data provided. Do not make up player names, team names, or statistics.`;
    }

    const apiMessages = [
      { role: "system" as const, content: systemMessage },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error in chat:", error);
    throw new Error("Failed to get response from assistant.");
  }
}

// Get players to watch
export async function getPlayersToWatch(
  allPlayers: Player[],
  teams: Team[],
  upcomingFixtures: Fixture[]
): Promise<string> {
  try {
    // Get top form players
    const topFormPlayers = [...allPlayers]
      .filter(p => p.status === 'a' && parseFloat(p.form) > 4)
      .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
      .slice(0, 20);

    const playerSummary = topFormPlayers.map(p => {
      const team = teams.find(t => t.id === p.team);
      const position = ["", "GK", "DEF", "MID", "FWD"][p.element_type];
      const status = p.status === "a" ? "Available" : p.status === "d" ? "Doubtful" : p.status === "i" ? "Injured" : p.status === "s" ? "Suspended" : "Unavailable";
      return `${p.web_name} (${team?.short_name || "Unknown"}, ${position}) - Form: ${p.form} | PPG: ${p.points_per_game} | Total: ${p.total_points}pts | Price: £${(p.now_cost / 10).toFixed(1)}m | Owned: ${p.selected_by_percent}% | Goals: ${p.goals_scored} | Assists: ${p.assists} | Status: ${status}`;
    }).join("\n");

    // Get upcoming fixtures for these players
    const fixturesSummary = topFormPlayers.slice(0, 10).map(p => {
      const team = teams.find(t => t.id === p.team);
      const playerFixtures = upcomingFixtures
        .filter(f => (f.team_h === p.team || f.team_a === p.team) && f.event)
        .slice(0, 3)
        .map(f => {
          const isHome = f.team_h === p.team;
          const opponent = teams.find(t => t.id === (isHome ? f.team_a : f.team_h));
          const fdr = isHome ? f.team_h_difficulty : f.team_a_difficulty;
          return `GW${f.event}: ${isHome ? "H" : "A"} vs ${opponent?.short_name || "Unknown"} (FDR: ${fdr})`;
        })
        .join(", ");
      return `${p.web_name}: ${playerFixtures || "No fixture data"}`;
    }).join("\n");

    const prompt = `From these in-form players, identify 5 "Players to Watch" for FPL managers using ONLY the data provided below. DO NOT reference any players, teams, or fixtures not listed here.

TOP FORM PLAYERS (use ONLY these players):
${playerSummary}

UPCOMING FIXTURES (use ONLY these fixtures):
${fixturesSummary || "No fixture data available"}

IMPORTANT: Only reference players and teams listed above. Do not make up player names, team names, or fixtures.

For each of the 5 selected players, provide:
1. Player name and team (from the data above)
2. Why they're worth watching (based on actual form, stats, and price provided)
3. Upcoming fixtures outlook (based on fixture data provided)
4. Buy recommendation (Buy Now / Wait / Monitor) with reasoning based on the actual data

Focus on a mix of premium and budget options. Base all recommendations on the actual statistics, form, and fixture data provided.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FPL_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "Unable to generate players to watch.";
  } catch (error) {
    console.error("Error getting players to watch:", error);
    throw new Error("Failed to get players to watch.");
  }
}
