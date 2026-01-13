import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Player,
  Formation,
  UserTeam,
  TeamSearchResult,
} from "@/types/fpl";
import { fplApi } from "@/lib/fpl-api";

interface TeamState extends UserTeam {
  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: number) => void;
  setCaptain: (playerId: number) => void;
  setViceCaptain: (playerId: number) => void;
  setFormation: (formation: Formation) => void;
  updateBudget: (amount: number) => void;

  // Team management
  loadTeamById: (teamId: number, gameweek?: number) => Promise<void>;
  searchTeamsInLeague: (
    leagueId: number,
    searchTerm: string
  ) => Promise<TeamSearchResult[]>;
  clearTeam: () => void;
  resetError: () => void;

  // Validation
  canAddPlayer: (player: Player) => {
    valid: boolean;
    reason?: string;
  };
  getPositionCount: (elementType: number) => number;
  getTeamPlayerCount: (teamId: number) => number;
  getRemainingBudget: () => number;
}

const initialState: Omit<
  TeamState,
  | "addPlayer"
  | "removePlayer"
  | "setCaptain"
  | "setViceCaptain"
  | "setFormation"
  | "updateBudget"
  | "loadTeamById"
  | "searchTeamsInLeague"
  | "clearTeam"
  | "resetError"
  | "canAddPlayer"
  | "getPositionCount"
  | "getTeamPlayerCount"
  | "getRemainingBudget"
> = {
  teamId: null,
  teamName: "",
  managerName: "",
  players: [],
  formation: "3-4-3",
  budget: 1000, // £100m in tenths
  teamValue: 0,
  captain: null,
  viceCaptain: null,
  isLoading: false,
  error: null,
};

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Add a player to the team
       */
      addPlayer: (player: Player) => {
        const state = get();
        const validation = state.canAddPlayer(player);

        if (!validation.valid) {
          set({ error: validation.reason });
          return;
        }

        const newPlayers = [...state.players, player];
        const newTeamValue = newPlayers.reduce(
          (sum, p) => sum + p.now_cost,
          0
        );

        set({
          players: newPlayers,
          teamValue: newTeamValue,
          error: null,
        });
      },

      /**
       * Remove a player from the team
       */
      removePlayer: (playerId: number) => {
        const state = get();
        const newPlayers = state.players.filter((p) => p.id !== playerId);
        const newTeamValue = newPlayers.reduce(
          (sum, p) => sum + p.now_cost,
          0
        );

        set({
          players: newPlayers,
          teamValue: newTeamValue,
          captain: state.captain === playerId ? null : state.captain,
          viceCaptain:
            state.viceCaptain === playerId ? null : state.viceCaptain,
          error: null,
        });
      },

      /**
       * Set captain
       */
      setCaptain: (playerId: number) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);

        if (!player) {
          set({ error: "Player not in team" });
          return;
        }

        set({
          captain: playerId,
          // If new captain was vice-captain, clear vice-captain
          viceCaptain:
            state.viceCaptain === playerId ? null : state.viceCaptain,
          error: null,
        });
      },

      /**
       * Set vice-captain
       */
      setViceCaptain: (playerId: number) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);

        if (!player) {
          set({ error: "Player not in team" });
          return;
        }

        if (state.captain === playerId) {
          set({ error: "Captain cannot be vice-captain" });
          return;
        }

        set({
          viceCaptain: playerId,
          error: null,
        });
      },

      /**
       * Set formation
       */
      setFormation: (formation: Formation) => {
        set({ formation, error: null });
      },

      /**
       * Update budget
       */
      updateBudget: (amount: number) => {
        set({ budget: amount });
      },

      /**
       * Load team from FPL by team ID
       * Uses local API route to avoid CORS issues
       */
      loadTeamById: async (teamId: number) => {
        set({ isLoading: true, error: null });

        try {
          // Fetch team data via our API route and all players
          const [teamResponse, allPlayers] = await Promise.all([
            fplApi.getManagerTeamData(teamId),
            fplApi.getAllPlayers(),
          ]);

          const { manager, picks: teamData } = teamResponse;

          // Map player IDs to full player objects
          const teamPlayers = teamData.picks
            .map((pick) => {
              const player = allPlayers.find((p) => p.id === pick.element);
              return player;
            })
            .filter((p): p is Player => p !== undefined);

          // Find captain and vice-captain
          const captainPick = teamData.picks.find((p) => p.is_captain);
          const viceCaptainPick = teamData.picks.find((p) => p.is_vice_captain);

          // Calculate team value
          const teamValue = teamPlayers.reduce((sum, p) => sum + p.now_cost, 0);

          set({
            teamId,
            teamName: manager.name,
            managerName: `${manager.player_first_name} ${manager.player_last_name}`,
            players: teamPlayers,
            captain: captainPick?.element || null,
            viceCaptain: viceCaptainPick?.element || null,
            budget: teamData.entry_history.bank,
            teamValue,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("Error loading team:", error);
          set({
            isLoading: false,
            error: error.message || "Failed to load team. Please try again.",
          });
        }
      },

      /**
       * Search for teams in a league
       */
      searchTeamsInLeague: async (
        leagueId: number,
        searchTerm: string
      ): Promise<TeamSearchResult[]> => {
        set({ isLoading: true, error: null });

        try {
          const results = await fplApi.searchTeamsInLeague(leagueId, searchTerm);
          set({ isLoading: false, error: null });
          return results;
        } catch (error: any) {
          console.error("Error searching teams:", error);
          set({
            isLoading: false,
            error:
              error.response?.status === 404
                ? "League not found. Please check the League ID."
                : "Failed to search teams. Please try again.",
          });
          return [];
        }
      },

      /**
       * Clear team and reset to initial state
       */
      clearTeam: () => {
        set({
          ...initialState,
        });
      },

      /**
       * Reset error state
       */
      resetError: () => {
        set({ error: null });
      },

      /**
       * Check if a player can be added to the team
       */
      canAddPlayer: (player: Player) => {
        const state = get();

        // Check squad size
        if (state.players.length >= 15) {
          return { valid: false, reason: "Squad is full (15 players maximum)" };
        }

        // Check if player already in team
        if (state.players.some((p) => p.id === player.id)) {
          return { valid: false, reason: "Player already in team" };
        }

        // Check position limits
        const positionCount = state.getPositionCount(player.element_type);
        const positionLimits: Record<number, number> = {
          1: 2, // GK
          2: 5, // DEF
          3: 5, // MID
          4: 3, // FWD
        };

        if (positionCount >= positionLimits[player.element_type]) {
          const positionName = fplApi.getPositionName(player.element_type);
          return {
            valid: false,
            reason: `Maximum ${positionLimits[player.element_type]} ${positionName} allowed`,
          };
        }

        // Check team player limit (max 3 from same team)
        const teamPlayerCount = state.getTeamPlayerCount(player.team);
        if (teamPlayerCount >= 3) {
          return {
            valid: false,
            reason: "Maximum 3 players from same team allowed",
          };
        }

        // Check budget
        const remainingBudget = state.budget + state.teamValue;
        const newTeamValue = state.teamValue + player.now_cost;
        if (newTeamValue > remainingBudget) {
          return { valid: false, reason: "Insufficient budget" };
        }

        return { valid: true };
      },

      /**
       * Get count of players in a specific position
       */
      getPositionCount: (elementType: number) => {
        const state = get();
        return state.players.filter((p) => p.element_type === elementType)
          .length;
      },

      /**
       * Get count of players from a specific team
       */
      getTeamPlayerCount: (teamId: number) => {
        const state = get();
        return state.players.filter((p) => p.team === teamId).length;
      },

      /**
       * Get remaining budget
       */
      getRemainingBudget: () => {
        const state = get();
        return state.budget + (1000 - state.teamValue);
      },
    }),
    {
      name: "fpl-team-storage",
      // Only persist essential data
      partialize: (state) => ({
        teamId: state.teamId,
        teamName: state.teamName,
        managerName: state.managerName,
        players: state.players,
        formation: state.formation,
        budget: state.budget,
        teamValue: state.teamValue,
        captain: state.captain,
        viceCaptain: state.viceCaptain,
      }),
    }
  )
);
