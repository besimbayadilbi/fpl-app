import OpenAI from "openai";
import type { Player, Team, Fixture } from "@/types/fpl";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FPL_SYSTEM_PROMPT = `You are an expert Fantasy Premier League (FPL) analyst and strategist. You have deep knowledge of:
- Player performance metrics and form
- Fixture difficulty ratings (FDR)
- Transfer strategies and timing
- Captain selection optimization
- Chip usage strategy (Wildcard, Free Hit, Bench Boost, Triple Captain)
- Differential picks for rank climbing
- Price change predictions
- Team value optimization

When providing advice:
- Be specific with player names and teams
- Reference upcoming fixtures by gameweek
- Consider ownership percentages for differential impact
- Factor in injury news and rotation risks
- Provide actionable, clear recommendations
- Use data-driven reasoning
- Be concise but thorough

Current season: 2024/25 Premier League`;

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

    // Build team summary
    const teamSummary = currentTeam.players.map(p => {
      const team = teams.find(t => t.id === p.team);
      return `${p.web_name} (${team?.short_name || "?"}) - Form: ${p.form}, PPG: ${p.points_per_game}, Price: £${(p.now_cost / 10).toFixed(1)}m`;
    }).join("\n");

    // Build fixture summary
    const fixturesByTeam: Record<number, string[]> = {};
    upcomingFixtures.slice(0, horizon * 10).forEach(f => {
      if (!fixturesByTeam[f.team_h]) fixturesByTeam[f.team_h] = [];
      if (!fixturesByTeam[f.team_a]) fixturesByTeam[f.team_a] = [];

      const homeTeam = teams.find(t => t.id === f.team_h)?.short_name || "?";
      const awayTeam = teams.find(t => t.id === f.team_a)?.short_name || "?";

      fixturesByTeam[f.team_h].push(`vs ${awayTeam} (H) - FDR: ${f.team_h_difficulty}`);
      fixturesByTeam[f.team_a].push(`vs ${homeTeam} (A) - FDR: ${f.team_a_difficulty}`);
    });

    const prompt = `Analyze this FPL team and provide a detailed transfer strategy for the next ${horizon} gameweeks.

CURRENT TEAM:
${teamSummary}

BUDGET IN BANK: £${(currentTeam.budget / 10).toFixed(1)}m
FREE TRANSFERS: ${currentTeam.freeTransfers}
RISK APPETITE: ${riskAppetite}
WILLING TO TAKE HITS: ${allowHits ? "Yes" : "No"}

Based on this information:
1. Identify the weakest players who should be transferred out
2. Recommend specific replacements with reasoning
3. Suggest optimal timing for transfers (which gameweek)
4. Provide a priority order for transfers
5. Mention any differentials worth considering
6. Note any players to monitor for price rises/falls

Be specific and actionable. Format your response clearly with sections.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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

      let fixtureInfo = "No fixture";
      if (nextFixture) {
        const isHome = nextFixture.team_h === p.team;
        const opponent = teams.find(t => t.id === (isHome ? nextFixture.team_a : nextFixture.team_h));
        const fdr = isHome ? nextFixture.team_h_difficulty : nextFixture.team_a_difficulty;
        fixtureInfo = `${isHome ? "H" : "A"} vs ${opponent?.short_name} (FDR: ${fdr})`;
      }

      return `${p.web_name} (${team?.short_name}) - Form: ${p.form}, PPG: ${p.points_per_game}, Ownership: ${p.selected_by_percent}%, Fixture: ${fixtureInfo}`;
    }).join("\n");

    const prompt = `Analyze these players for GW${gameweek} captain selection.

PLAYERS IN MY TEAM:
${playerSummary}

Provide:
1. TOP 3 captain picks with detailed reasoning
2. Best differential captain (low ownership, high upside)
3. Safe captain pick (consistent, high floor)
4. Risk/reward analysis for each option
5. Your #1 recommendation with confidence level

Consider form, fixtures, ownership, and ceiling potential.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      return `${p.web_name} (${team?.short_name}) - £${(p.now_cost / 10).toFixed(1)}m, Form: ${p.form}, Total Pts: ${p.total_points}`;
    }).join("\n");

    const prompt = `Analyze this FPL team comprehensively.

SQUAD (15 players):
${teamSummary}

TEAM VALUE: £${(teamValue / 10).toFixed(1)}m
MONEY IN BANK: £${(budget / 10).toFixed(1)}m

Provide a detailed analysis including:
1. STRENGTHS: What's working well in this team?
2. WEAKNESSES: Areas that need improvement
3. SUGGESTED IMPROVEMENTS: Specific changes to consider
4. RISK ASSESSMENT: Injury concerns, rotation risks
5. BUDGET OPTIMIZATION: Are funds being used efficiently?
6. OVERALL RATING: Rate this team out of 10 with justification

Be honest and constructive in your analysis.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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

      let fixtureInfo = "Blank";
      if (nextFixture) {
        const isHome = nextFixture.team_h === p.team;
        const opponent = teams.find(t => t.id === (isHome ? nextFixture.team_a : nextFixture.team_h));
        fixtureInfo = `${isHome ? "H" : "A"} vs ${opponent?.short_name}`;
      }

      return `${p.web_name} (${position}, ${team?.short_name}) - Form: ${p.form}, ${fixtureInfo}, Status: ${p.status}`;
    }).join("\n");

    const prompt = `Select the optimal starting 11 from these 15 players for GW${gameweek}.

SQUAD:
${playerSummary}

Requirements:
- Must pick exactly 11 starters
- Formation must be valid (1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD)
- 4 players on bench in priority order
- Select captain and vice-captain

Provide:
1. STARTING XI with formation
2. CAPTAIN pick with reasoning
3. VICE-CAPTAIN pick
4. BENCH ORDER (1st to 4th sub)
5. Key considerations for this lineup`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
        return `${p.web_name} (${team?.short_name})`;
      }).join(", ");

      systemMessage += `\n\nUSER'S CURRENT TEAM: ${teamSummary}\nBUDGET: £${(teamContext.budget / 10).toFixed(1)}m\nCURRENT GAMEWEEK: ${teamContext.gameweek}`;
    }

    const apiMessages = [
      { role: "system" as const, content: systemMessage },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      return `${p.web_name} (${team?.short_name}) - Form: ${p.form}, PPG: ${p.points_per_game}, Price: £${(p.now_cost / 10).toFixed(1)}m, Ownership: ${p.selected_by_percent}%`;
    }).join("\n");

    const prompt = `From these in-form players, identify 5 "Players to Watch" for FPL managers.

TOP FORM PLAYERS:
${playerSummary}

For each player, provide:
1. Player name and team
2. Why they're worth watching
3. Upcoming fixtures outlook
4. Buy recommendation (Buy Now / Wait / Monitor)

Focus on a mix of premium and budget options.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
