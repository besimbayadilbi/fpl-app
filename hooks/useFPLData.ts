import { useQuery } from "@tanstack/react-query";
import { fplApi } from "@/lib/fpl-api";
import type {
  FPLBootstrapData,
  Player,
  Team,
  GameWeek,
  Fixture,
  PlayerDetail,
} from "@/types/fpl";

/**
 * Hook to fetch bootstrap data (all players, teams, gameweeks)
 */
export function useFPLBootstrap() {
  return useQuery<FPLBootstrapData>({
    queryKey: ["fpl", "bootstrap"],
    queryFn: () => fplApi.getBootstrapData(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all players
 */
export function useAllPlayers() {
  return useQuery<Player[]>({
    queryKey: ["fpl", "players"],
    queryFn: () => fplApi.getAllPlayers(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all teams
 */
export function useAllTeams() {
  return useQuery<Team[]>({
    queryKey: ["fpl", "teams"],
    queryFn: () => fplApi.getAllTeams(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all gameweeks
 */
export function useAllGameWeeks() {
  return useQuery<GameWeek[]>({
    queryKey: ["fpl", "gameweeks"],
    queryFn: () => fplApi.getAllGameWeeks(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch current gameweek
 */
export function useCurrentGameWeek() {
  return useQuery<GameWeek | undefined>({
    queryKey: ["fpl", "current-gameweek"],
    queryFn: () => fplApi.getCurrentGameWeek(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch next gameweek
 */
export function useNextGameWeek() {
  return useQuery<GameWeek | undefined>({
    queryKey: ["fpl", "next-gameweek"],
    queryFn: () => fplApi.getNextGameWeek(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all fixtures
 */
export function useFixtures() {
  return useQuery<Fixture[]>({
    queryKey: ["fpl", "fixtures"],
    queryFn: () => fplApi.getFixtures(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch fixtures for a specific gameweek
 */
export function useFixturesForGameWeek(gameweek: number | null) {
  return useQuery<Fixture[]>({
    queryKey: ["fpl", "fixtures", "gameweek", gameweek],
    queryFn: () => fplApi.getFixturesForGameWeek(gameweek!),
    enabled: gameweek !== null,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch fixtures for a specific team
 */
export function useFixturesForTeam(teamId: number | null) {
  return useQuery<Fixture[]>({
    queryKey: ["fpl", "fixtures", "team", teamId],
    queryFn: () => fplApi.getFixturesForTeam(teamId!),
    enabled: teamId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch player detail
 */
export function usePlayerDetail(playerId: number | null) {
  return useQuery<PlayerDetail>({
    queryKey: ["fpl", "player", playerId],
    queryFn: () => fplApi.getPlayerDetail(playerId!),
    enabled: playerId !== null,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to fetch specific player by ID
 */
export function usePlayer(playerId: number | null) {
  return useQuery<Player | undefined>({
    queryKey: ["fpl", "player-basic", playerId],
    queryFn: () => fplApi.getPlayer(playerId!),
    enabled: playerId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch specific team by ID
 */
export function useTeam(teamId: number | null) {
  return useQuery<Team | undefined>({
    queryKey: ["fpl", "team", teamId],
    queryFn: () => fplApi.getTeam(teamId!),
    enabled: teamId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Combined hook for common data needs
 * Returns players, teams, current gameweek, and fixtures
 */
export function useFPLCore() {
  const { data: players, isLoading: playersLoading } = useAllPlayers();
  const { data: teams, isLoading: teamsLoading } = useAllTeams();
  const { data: currentGW, isLoading: gwLoading } = useCurrentGameWeek();
  const { data: fixtures, isLoading: fixturesLoading } = useFixtures();

  return {
    players: players || [],
    teams: teams || [],
    currentGameWeek: currentGW,
    fixtures: fixtures || [],
    isLoading: playersLoading || teamsLoading || gwLoading || fixturesLoading,
  };
}
