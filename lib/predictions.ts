import type {
  Player,
  Fixture,
  Team,
  PlayerPrediction,
  PlayerHistory,
  GameWeek,
} from "@/types/fpl";

/**
 * FPL Points Prediction Algorithm
 *
 * Prediction Formula:
 * - Form (40%): Average points from last 5 games
 * - Fixture Difficulty (30%): Opponent strength (easier = higher score)
 * - Home/Away (10%): Historical home/away performance
 * - Minutes Certainty (20%): Rotation risk and injury status
 */

interface PredictionFactors {
  form: number;
  fixtureDifficulty: number;
  homeAway: number;
  minutesCertainty: number;
}

const WEIGHTS = {
  form: 0.4,
  fixtureDifficulty: 0.3,
  homeAway: 0.1,
  minutesCertainty: 0.2,
};

/**
 * Calculate form score (0-10)
 * Based on recent performance
 */
function calculateFormScore(player: Player, history?: PlayerHistory[]): number {
  // Use form from API (string representing average points per game)
  const formValue = parseFloat(player.form) || 0;

  // If we have detailed history, calculate from last 5 games
  if (history && history.length > 0) {
    const last5Games = history.slice(-5);
    const avgPoints = last5Games.reduce((sum, h) => sum + h.total_points, 0) / last5Games.length;
    return Math.min(avgPoints, 10); // Cap at 10
  }

  // Otherwise use form value (scaled to 0-10)
  return Math.min(formValue * 2, 10);
}

/**
 * Calculate fixture difficulty score (0-10)
 * Lower opponent strength = higher score for attacker
 */
function calculateFixtureDifficultyScore(
  player: Player,
  fixture: Fixture | null,
  teams: Team[]
): number {
  if (!fixture) return 5; // Neutral if no fixture

  const playerTeam = teams.find(t => t.id === player.team);
  if (!playerTeam) return 5;

  const isHome = fixture.team_h === player.team;
  const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

  // For attackers (MID, FWD), easier fixture = higher score
  // For defenders (GK, DEF), easier fixture = higher score (clean sheet potential)
  // Invert difficulty: 1 (hardest) -> 10, 5 (easiest) -> 2
  const baseScore = 11 - (difficulty * 2);

  return Math.max(0, Math.min(baseScore, 10));
}

/**
 * Calculate home/away score (0-10)
 */
function calculateHomeAwayScore(
  player: Player,
  fixture: Fixture | null,
  teams: Team[]
): number {
  if (!fixture) return 5; // Neutral if no fixture

  const isHome = fixture.team_h === player.team;
  const playerTeam = teams.find(t => t.id === player.team);

  if (!playerTeam) return 5;

  // Home advantage: typically worth 0.5-1 point boost
  // For attackers, use attack strength
  // For defenders, use defence strength
  if (player.element_type === 1 || player.element_type === 2) {
    // GK or DEF - defensive stats matter more
    const strength = isHome
      ? playerTeam.strength_defence_home
      : playerTeam.strength_defence_away;
    return (strength / 140) * 10; // Normalize to 0-10 (strength typically 800-1400)
  } else {
    // MID or FWD - attacking stats matter more
    const strength = isHome
      ? playerTeam.strength_attack_home
      : playerTeam.strength_attack_away;
    return (strength / 140) * 10;
  }
}

/**
 * Calculate minutes certainty score (0-10)
 * Higher = more likely to play full 90 minutes
 */
function calculateMinutesCertaintyScore(player: Player): number {
  let score = 5; // Start neutral

  // Check injury/suspension status
  if (player.status !== "a") {
    // Not available
    if (player.status === "i" || player.status === "s") {
      return 0; // Injured or suspended
    }
    score -= 3; // Doubtful or unavailable
  }

  // Check chance of playing
  if (player.chance_of_playing_this_round !== null) {
    if (player.chance_of_playing_this_round === 0) return 0;
    if (player.chance_of_playing_this_round < 50) score -= 2;
    if (player.chance_of_playing_this_round < 75) score -= 1;
  }

  // Check minutes played (regular starters score higher)
  const totalMinutes = player.minutes;
  const possibleMinutes = 90 * 20; // Assume ~20 games played
  const minutesRatio = totalMinutes / possibleMinutes;

  if (minutesRatio > 0.8) score += 3; // Regular starter
  else if (minutesRatio > 0.6) score += 1;
  else if (minutesRatio < 0.3) score -= 2; // Rotation risk

  return Math.max(0, Math.min(score, 10));
}

/**
 * Calculate confidence level based on prediction factors
 */
function calculateConfidence(factors: PredictionFactors): "HIGH" | "MEDIUM" | "LOW" {
  const { minutesCertainty, form, fixtureDifficulty } = factors;

  // High confidence: regular starter + good form + favorable fixture
  if (minutesCertainty >= 7 && form >= 5 && fixtureDifficulty >= 6) {
    return "HIGH";
  }

  // Low confidence: rotation risk OR poor form OR difficult fixture
  if (minutesCertainty < 4 || form < 3 || fixtureDifficulty < 3) {
    return "LOW";
  }

  return "MEDIUM";
}

/**
 * Predict points for a player in next gameweek
 */
export function predictPlayerPoints(
  player: Player,
  nextFixture: Fixture | null,
  teams: Team[],
  history?: PlayerHistory[]
): PlayerPrediction {
  // Calculate all factors
  const formScore = calculateFormScore(player, history);
  const fixtureScore = calculateFixtureDifficultyScore(player, nextFixture, teams);
  const homeAwayScore = calculateHomeAwayScore(player, nextFixture, teams);
  const minutesScore = calculateMinutesCertaintyScore(player);

  const factors: PredictionFactors = {
    form: formScore,
    fixtureDifficulty: fixtureScore,
    homeAway: homeAwayScore,
    minutesCertainty: minutesScore,
  };

  // Calculate weighted score
  const weightedScore =
    formScore * WEIGHTS.form +
    fixtureScore * WEIGHTS.fixtureDifficulty +
    homeAwayScore * WEIGHTS.homeAway +
    minutesScore * WEIGHTS.minutesCertainty;

  // Convert to predicted points (scale 0-10 score to realistic points range)
  // Average player scores 2-6 points, top performers 8-15+
  const predictedPoints = Math.round(weightedScore * 1.5);

  const confidence = calculateConfidence(factors);

  return {
    playerId: player.id,
    predictedPoints,
    confidence,
    reasoning: {
      form: formScore,
      fixtureDifficulty: fixtureScore,
      homeAway: nextFixture ? (nextFixture.team_h === player.team ? "home" : "away") : "home",
      minutesCertainty: minutesScore,
    },
  };
}

/**
 * Predict points for multiple gameweeks
 */
export function predictMultipleGameweeks(
  player: Player,
  fixtures: Fixture[],
  teams: Team[],
  numGameweeks: number = 3,
  history?: PlayerHistory[]
): { gameweek: number; prediction: PlayerPrediction }[] {
  return fixtures
    .slice(0, numGameweeks)
    .map((fixture) => ({
      gameweek: fixture.event || 0,
      prediction: predictPlayerPoints(player, fixture, teams, history),
    }));
}

/**
 * Get top captain picks for next gameweek
 */
export function getTopCaptainPicks(
  players: Player[],
  nextFixture: (playerId: number) => Fixture | null,
  teams: Team[],
  limit: number = 10
): PlayerPrediction[] {
  const predictions = players
    .map((player) => {
      const fixture = nextFixture(player.id);
      return predictPlayerPoints(player, fixture, teams);
    })
    .sort((a, b) => b.predictedPoints - a.predictedPoints);

  return predictions.slice(0, limit);
}

/**
 * Calculate differential score
 * Lower ownership = higher differential score
 */
export function calculateDifferentialScore(player: Player): number {
  const ownership = parseFloat(player.selected_by_percent);

  // Invert ownership to differential score (0-100)
  // 1% ownership = 99 differential
  // 50% ownership = 50 differential
  // 100% ownership = 0 differential
  return Math.max(0, 100 - ownership);
}

/**
 * Find differential captain options
 * Good points prediction + low ownership
 */
export function getDifferentialCaptains(
  players: Player[],
  nextFixture: (playerId: number) => Fixture | null,
  teams: Team[],
  maxOwnership: number = 10,
  limit: number = 10
): Array<PlayerPrediction & { ownership: number; differentialScore: number }> {
  const predictions = players
    .filter((player) => parseFloat(player.selected_by_percent) <= maxOwnership)
    .map((player) => {
      const fixture = nextFixture(player.id);
      const prediction = predictPlayerPoints(player, fixture, teams);
      const ownership = parseFloat(player.selected_by_percent);
      const differentialScore = calculateDifferentialScore(player);

      return {
        ...prediction,
        ownership,
        differentialScore,
      };
    })
    .sort((a, b) => {
      // Sort by combination of predicted points and differential score
      const scoreA = a.predictedPoints * 0.7 + a.differentialScore * 0.3;
      const scoreB = b.predictedPoints * 0.7 + b.differentialScore * 0.3;
      return scoreB - scoreA;
    });

  return predictions.slice(0, limit);
}

/**
 * Calculate total predicted points for a team
 */
export function calculateTeamPredictedPoints(
  players: Player[],
  nextFixture: (playerId: number) => Fixture | null,
  teams: Team[],
  captain: number | null
): number {
  let totalPoints = 0;

  players.forEach((player) => {
    const fixture = nextFixture(player.id);
    const prediction = predictPlayerPoints(player, fixture, teams);

    // Captain gets double points
    const multiplier = player.id === captain ? 2 : 1;
    totalPoints += prediction.predictedPoints * multiplier;
  });

  return Math.round(totalPoints);
}

/**
 * Get fixture difficulty rating with color
 */
export function getFixtureDifficultyRating(difficulty: number): {
  rating: string;
  color: string;
  description: string;
} {
  if (difficulty === 1) {
    return {
      rating: "Very Easy",
      color: "green",
      description: "Excellent fixture for points",
    };
  } else if (difficulty === 2) {
    return {
      rating: "Easy",
      color: "green",
      description: "Good fixture for points",
    };
  } else if (difficulty === 3) {
    return {
      rating: "Moderate",
      color: "yellow",
      description: "Average fixture",
    };
  } else if (difficulty === 4) {
    return {
      rating: "Hard",
      color: "red",
      description: "Tough fixture",
    };
  } else {
    return {
      rating: "Very Hard",
      color: "red",
      description: "Very difficult fixture",
    };
  }
}
