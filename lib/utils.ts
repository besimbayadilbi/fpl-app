import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Player, Team, Formation, FormationStructure } from "@/types/fpl";

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price from tenths to display string
 * 45 -> £4.5m
 */
export function formatPrice(price: number): string {
  return `£${(price / 10).toFixed(1)}m`;
}

/**
 * Format large numbers with abbreviations
 * 1234567 -> 1.23M
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get player position name from element_type
 */
export function getPositionName(elementType: number): string {
  const positions: Record<number, string> = {
    1: "GK",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };
  return positions[elementType] || "UNKNOWN";
}

/**
 * Get player position full name
 */
export function getPositionFullName(elementType: number): string {
  const positions: Record<number, string> = {
    1: "Goalkeeper",
    2: "Defender",
    3: "Midfielder",
    4: "Forward",
  };
  return positions[elementType] || "Unknown";
}

/**
 * Get position color for UI
 */
export function getPositionColor(elementType: number): string {
  const colors: Record<number, string> = {
    1: "bg-fpl-gk text-gray-900", // Yellow for GK
    2: "bg-fpl-def text-white", // Blue for DEF
    3: "bg-fpl-mid text-white", // Green for MID
    4: "bg-fpl-fwd text-white", // Red for FWD
  };
  return colors[elementType] || "bg-gray-500 text-white";
}

/**
 * Get fixture difficulty color
 */
export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 2) return "bg-green-500 text-white";
  if (difficulty === 3) return "bg-yellow-500 text-gray-900";
  return "bg-red-500 text-white";
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(
  confidence: "HIGH" | "MEDIUM" | "LOW"
): string {
  const colors = {
    HIGH: "bg-green-500 text-white",
    MEDIUM: "bg-yellow-500 text-gray-900",
    LOW: "bg-red-500 text-white",
  };
  return colors[confidence];
}

/**
 * Get player status badge
 */
export function getStatusBadge(status: string): {
  text: string;
  color: string;
} {
  const statuses: Record<
    string,
    { text: string; color: string }
  > = {
    a: { text: "Available", color: "bg-green-500 text-white" },
    d: { text: "Doubtful", color: "bg-yellow-500 text-gray-900" },
    i: { text: "Injured", color: "bg-red-500 text-white" },
    s: { text: "Suspended", color: "bg-red-500 text-white" },
    u: { text: "Unavailable", color: "bg-gray-500 text-white" },
  };
  return (
    statuses[status] || { text: "Unknown", color: "bg-gray-500 text-white" }
  );
}

/**
 * Get team shirt image URL
 */
export function getTeamShirtUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/t${teamCode}.png`;
}

/**
 * Get player photo URL
 */
export function getPlayerPhotoUrl(playerCode: number): string {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${playerCode}.png`;
}

/**
 * Parse formation string to structure
 */
export function parseFormation(formation: Formation): FormationStructure {
  const [def, mid, fwd] = formation.split("-").map(Number);
  return {
    gk: 1,
    def,
    mid,
    fwd,
  };
}

/**
 * Get valid formations
 */
export function getValidFormations(): Formation[] {
  return ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"];
}

/**
 * Validate formation against squad
 */
export function isValidFormation(
  formation: Formation,
  players: Player[]
): boolean {
  const structure = parseFormation(formation);

  const positionCounts = {
    gk: players.filter((p) => p.element_type === 1).length,
    def: players.filter((p) => p.element_type === 2).length,
    mid: players.filter((p) => p.element_type === 3).length,
    fwd: players.filter((p) => p.element_type === 4).length,
  };

  return (
    positionCounts.gk >= structure.gk &&
    positionCounts.def >= structure.def &&
    positionCounts.mid >= structure.mid &&
    positionCounts.fwd >= structure.fwd
  );
}

/**
 * Sort players by position
 */
export function sortPlayersByPosition(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    // Sort by position, then by total points
    if (a.element_type !== b.element_type) {
      return a.element_type - b.element_type;
    }
    return b.total_points - a.total_points;
  });
}

/**
 * Group players by position
 */
export function groupPlayersByPosition(players: Player[]): {
  GK: Player[];
  DEF: Player[];
  MID: Player[];
  FWD: Player[];
} {
  return {
    GK: players.filter((p) => p.element_type === 1),
    DEF: players.filter((p) => p.element_type === 2),
    MID: players.filter((p) => p.element_type === 3),
    FWD: players.filter((p) => p.element_type === 4),
  };
}

/**
 * Calculate team budget remaining
 */
export function calculateRemainingBudget(
  players: Player[],
  totalBudget: number = 1000
): number {
  const spent = players.reduce((sum, player) => sum + player.now_cost, 0);
  return totalBudget - spent;
}

/**
 * Check if team is complete (15 players)
 */
export function isTeamComplete(players: Player[]): boolean {
  if (players.length !== 15) return false;

  const counts = {
    gk: players.filter((p) => p.element_type === 1).length,
    def: players.filter((p) => p.element_type === 2).length,
    mid: players.filter((p) => p.element_type === 3).length,
    fwd: players.filter((p) => p.element_type === 4).length,
  };

  return (
    counts.gk === 2 && counts.def === 5 && counts.mid === 5 && counts.fwd === 3
  );
}

/**
 * Get team by name from teams array
 */
export function getTeamByName(teams: Team[], name: string): Team | undefined {
  return teams.find(
    (t) =>
      t.name.toLowerCase() === name.toLowerCase() ||
      t.short_name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate points per million
 */
export function calculateValueMetric(player: Player): number {
  return (player.total_points / player.now_cost) * 10;
}

/**
 * Calculate form momentum
 * Positive = improving form, Negative = declining form
 */
export function calculateFormMomentum(player: Player): number {
  const form = parseFloat(player.form) || 0;
  const ppg = parseFloat(player.points_per_game) || 0;

  // If recent form is better than season average, positive momentum
  return form - ppg;
}

/**
 * Get price change indicator
 */
export function getPriceChangeIndicator(player: Player): {
  text: string;
  color: string;
  icon: string;
} {
  const change = player.cost_change_event;

  if (change > 0) {
    return { text: `+${formatPrice(change)}`, color: "text-green-500", icon: "↑" };
  } else if (change < 0) {
    return { text: formatPrice(change), color: "text-red-500", icon: "↓" };
  }

  return { text: "No change", color: "text-gray-500", icon: "→" };
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate average from array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get upcoming fixtures difficulty color
 */
export function getFixtureRunColor(avgDifficulty: number): string {
  if (avgDifficulty <= 2.5) return "text-green-500";
  if (avgDifficulty <= 3.5) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Calculate ICT index (Influence, Creativity, Threat)
 */
export function calculateICTScore(player: Player): number {
  return parseFloat(player.ict_index) || 0;
}

/**
 * Get player's next 5 fixtures difficulty
 */
export function calculateFixtureRun(
  fixtures: { difficulty: number }[]
): number {
  if (fixtures.length === 0) return 3; // Neutral
  const difficulties = fixtures.slice(0, 5).map((f) => f.difficulty);
  return average(difficulties);
}
