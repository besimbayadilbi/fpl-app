// Core FPL Data Types
export interface FPLBootstrapData {
  events: GameWeek[];
  teams: Team[];
  elements: Player[];
  element_types: Position[];
  element_stats: ElementStat[];
}

export interface GameWeek {
  id: number;
  name: string;
  deadline_time: string;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  release_time: string | null;
  average_entry_score: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  cup_leagues_created: boolean;
  h2h_ko_matches_created: boolean;
  chip_plays: ChipPlay[];
  most_selected: number | null;
  most_transferred_in: number | null;
  top_element: number | null;
  top_element_info: TopElementInfo | null;
  transfers_made: number;
  most_captained: number | null;
  most_vice_captained: number | null;
}

export interface ChipPlay {
  chip_name: string;
  num_played: number;
}

export interface TopElementInfo {
  id: number;
  points: number;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  code: number;
  draw: number;
  form: string | null;
  loss: number;
  played: number;
  points: number;
  position: number;
  strength: number;
  team_division: string | null;
  unavailable: boolean;
  win: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  pulse_id: number;
}

export interface Player {
  id: number;
  code: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_code: number;
  status: "a" | "d" | "i" | "s" | "u"; // available, doubtful, injured, suspended, unavailable
  now_cost: number; // Price in tenths (45 = £4.5m)
  cost_change_event: number;
  cost_change_event_fall: number;
  cost_change_start: number;
  cost_change_start_fall: number;

  // Stats
  total_points: number;
  event_points: number;
  points_per_game: string;
  ep_this: string | null;
  ep_next: string | null;
  form: string;
  form_rank: number | null;
  form_rank_type: number | null;
  selected_by_percent: string;
  transfers_in: number;
  transfers_in_event: number;
  transfers_out: number;
  transfers_out_event: number;

  // Availability
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
  minutes: number;

  // Performance
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  influence_rank: number;
  influence_rank_type: number;
  creativity_rank: number;
  creativity_rank_type: number;
  threat_rank: number;
  threat_rank_type: number;
  ict_index_rank: number;
  ict_index_rank_type: number;

  // Additional info
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  in_dreamteam: boolean;
  dreamteam_count: number;
  value_form: string;
  value_season: string;
  special: boolean;

  // News
  news: string;
  news_added: string | null;

  // Corners and cards
  corners_and_indirect_freekicks_order: number | null;
  corners_and_indirect_freekicks_text: string;
  direct_freekicks_order: number | null;
  direct_freekicks_text: string;
  penalties_order: number | null;
  penalties_text: string;

  // Display
  photo: string;
  squad_number: number | null;
}

export interface Position {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_play: number;
  squad_max_play: number;
  ui_shirt_specific: boolean;
  sub_positions_locked: number[];
  element_count: number;
}

export interface ElementStat {
  label: string;
  name: string;
}

// Fixture Types
export interface Fixture {
  id: number;
  code: number;
  event: number | null;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string | null;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean | null;
  team_a: number;
  team_a_score: number | null;
  team_h: number;
  team_h_score: number | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
  pulse_id: number;
  stats: FixtureStats[];
}

export interface FixtureStats {
  identifier: string;
  a: StatValue[];
  h: StatValue[];
}

export interface StatValue {
  value: number;
  element: number;
}

// Player Detail Types
export interface PlayerDetail {
  fixtures: PlayerFixture[];
  history: PlayerHistory[];
  history_past: PlayerHistorySeason[];
}

export interface PlayerFixture {
  id: number;
  code: number;
  team_h: number;
  team_h_score: number | null;
  team_a: number;
  team_a_score: number | null;
  event: number | null;
  finished: boolean;
  minutes: number;
  provisional_start_time: boolean;
  kickoff_time: string | null;
  event_name: string;
  is_home: boolean;
  difficulty: number;
}

export interface PlayerHistory {
  element: number;
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  kickoff_time: string;
  team_h_score: number;
  team_a_score: number;
  round: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  value: number;
  transfers_balance: number;
  selected: number;
  transfers_in: number;
  transfers_out: number;
}

export interface PlayerHistorySeason {
  season_name: string;
  element_code: number;
  start_cost: number;
  end_cost: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
}

// User Team Types
export interface UserTeam {
  teamId: number | null;
  teamName: string;
  managerName: string;
  players: Player[];
  formation: Formation;
  budget: number; // Money in bank (in tenths, 5 = £0.5m)
  teamValue: number; // Total team value (in tenths, 1000 = £100.0m)
  captain: number | null; // player id
  viceCaptain: number | null; // player id
}

export interface TeamPick {
  element: number; // player id
  position: number; // 1-15
  multiplier: number; // 2 for captain, 1 for regular, 0 for bench
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface EntryHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  rank_sort: number | null;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface FPLTeamData {
  active_chip: string | null;
  automatic_subs: AutomaticSub[];
  entry_history: EntryHistory;
  picks: TeamPick[];
}

export interface AutomaticSub {
  entry: number;
  element_in: number;
  element_out: number;
  event: number;
}

export interface ManagerInfo {
  id: number;
  joined_time: string;
  started_event: number;
  favourite_team: number | null;
  player_first_name: string;
  player_last_name: string;
  player_region_id: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  name: string;
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
}

// League Types
export interface LeagueStandings {
  league: LeagueInfo;
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueEntry[];
  };
}

export interface LeagueInfo {
  id: number;
  name: string;
  created: string;
  closed: boolean;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  start_event: number;
  code_privacy: string;
  has_cup: boolean;
  cup_league: number | null;
  rank: number | null;
}

export interface LeagueEntry {
  id: number; // Team ID
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string; // Team name
}

// Formation Types
export type Formation = "3-4-3" | "3-5-2" | "4-3-3" | "4-4-2" | "4-5-1" | "5-3-2" | "5-4-1";

export interface FormationStructure {
  gk: number;
  def: number;
  mid: number;
  fwd: number;
}

// Prediction Types
export interface PlayerPrediction {
  playerId: number;
  predictedPoints: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasoning: {
    form: number;
    fixtureDifficulty: number;
    homeAway: "home" | "away";
    minutesCertainty: number;
  };
}

export interface TransferSuggestion {
  playerOut: Player;
  playerIn: Player;
  expectedPointsGain: number;
  costDifference: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

export interface CaptainSuggestion {
  player: Player;
  predictedPoints: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  differentialScore: number; // Lower ownership = higher differential
}

// Search Types
export interface TeamSearchResult {
  teamId: number;
  teamName: string;
  managerName: string;
  overallRank: number;
  totalPoints: number;
}

// Utility Types
// Transfer Plan Types
export interface Transfer {
  playerOutId: number;
  playerInId: number;
  gameweek: number;
}

export interface TransferPlan {
  strategy: string;
  transfers: Transfer[];
}

// Utility Types
export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface PositionRequirements {
  GK: { min: number; max: number };
  DEF: { min: number; max: number };
  MID: { min: number; max: number };
  FWD: { min: number; max: number };
}

// Constants
export const POSITION_REQUIREMENTS: PositionRequirements = {
  GK: { min: 2, max: 2 },
  DEF: { min: 5, max: 5 },
  MID: { min: 5, max: 5 },
  FWD: { min: 3, max: 3 },
};

export const SQUAD_SIZE = 15;
export const STARTING_BUDGET = 1000; // £100.0m in tenths
export const MAX_PLAYERS_PER_TEAM = 3;
