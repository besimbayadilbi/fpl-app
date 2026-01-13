import type {
  FPLBootstrapData,
  Fixture,
  PlayerDetail,
  FPLTeamData,
  ManagerInfo,
  GameWeek,
  Player,
  Team,
} from "@/types/fpl";

/**
 * FPL API Client
 * Uses local API routes to avoid CORS issues with FPL API
 */
class FPLApiClient {
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generic cached request handler
   */
  private async cachedRequest<T>(
    key: string,
    request: () => Promise<T>,
    cacheDuration: number = this.CACHE_DURATION
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data as T;
    }

    const data = await request();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Fetch bootstrap-static data (all players, teams, gameweeks)
   * Uses local API route to avoid CORS
   */
  async getBootstrapData(): Promise<FPLBootstrapData> {
    return this.cachedRequest("bootstrap", async () => {
      const response = await fetch("/api/bootstrap");
      if (!response.ok) {
        throw new Error("Failed to fetch bootstrap data");
      }
      return response.json();
    });
  }

  /**
   * Get all players
   */
  async getAllPlayers(): Promise<Player[]> {
    const data = await this.getBootstrapData();
    return data.elements;
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    const data = await this.getBootstrapData();
    return data.teams;
  }

  /**
   * Get all gameweeks
   */
  async getAllGameWeeks(): Promise<GameWeek[]> {
    const data = await this.getBootstrapData();
    return data.events;
  }

  /**
   * Get current gameweek
   */
  async getCurrentGameWeek(): Promise<GameWeek | undefined> {
    const gameweeks = await this.getAllGameWeeks();
    return gameweeks.find((gw) => gw.is_current);
  }

  /**
   * Get next gameweek
   */
  async getNextGameWeek(): Promise<GameWeek | undefined> {
    const gameweeks = await this.getAllGameWeeks();
    return gameweeks.find((gw) => gw.is_next);
  }

  /**
   * Get player by ID
   */
  async getPlayer(playerId: number): Promise<Player | undefined> {
    const players = await this.getAllPlayers();
    return players.find((p) => p.id === playerId);
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: number): Promise<Team | undefined> {
    const teams = await this.getAllTeams();
    return teams.find((t) => t.id === teamId);
  }

  /**
   * Fetch all fixtures
   */
  async getFixtures(): Promise<Fixture[]> {
    return this.cachedRequest("fixtures", async () => {
      const response = await fetch("/api/fixtures");
      if (!response.ok) {
        throw new Error("Failed to fetch fixtures");
      }
      return response.json();
    });
  }

  /**
   * Get fixtures for a specific gameweek
   */
  async getFixturesForGameWeek(gameweek: number): Promise<Fixture[]> {
    const fixtures = await this.getFixtures();
    return fixtures.filter((f) => f.event === gameweek);
  }

  /**
   * Get fixtures for a specific team
   */
  async getFixturesForTeam(teamId: number): Promise<Fixture[]> {
    const fixtures = await this.getFixtures();
    return fixtures.filter((f) => f.team_h === teamId || f.team_a === teamId);
  }

  /**
   * Fetch manager's team data (uses local API route)
   * Returns manager info and current picks
   */
  async getManagerTeamData(managerId: number): Promise<{
    manager: ManagerInfo;
    picks: FPLTeamData;
    currentEvent: number;
  }> {
    const response = await fetch(`/api/team/${managerId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch team data");
    }
    return response.json();
  }

  /**
   * Utility: Get player position name
   */
  getPositionName(elementType: number): string {
    const positions: Record<number, string> = {
      1: "GK",
      2: "DEF",
      3: "MID",
      4: "FWD",
    };
    return positions[elementType] || "UNKNOWN";
  }

  /**
   * Utility: Convert price from tenths to decimal
   */
  formatPrice(price: number): string {
    return `£${(price / 10).toFixed(1)}m`;
  }

  /**
   * Utility: Get fixture difficulty color
   */
  getDifficultyColor(difficulty: number): string {
    if (difficulty <= 2) return "green";
    if (difficulty === 3) return "yellow";
    return "red";
  }
}

// Export singleton instance
export const fplApi = new FPLApiClient();

// Export class for testing or custom instances
export default FPLApiClient;
