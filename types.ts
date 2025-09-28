// Fix: Removed self-import of 'Day', 'Matchup', and 'Round'. These types are defined within this file, so importing them is unnecessary and causes declaration conflicts.

export interface PlayerStats {
  name: string;
  totalPoints: number;
  totalWins: number;
}


export interface Matchup {
  players: [string, string];
  scores: [number | null, number | null];
}

export interface Round {
  round: number;
  matchups: Matchup[];
}

export interface Day {
  day: number;
  rounds: Round[];
  winner?: string | null;
  date?: string | null;
  substitutions?: { [originalPlayer: string]: string };
  isLocked?: boolean;
}

export type TournamentSchedule = Day[];

export interface SavedTournament {
  id: string;
  title: string;
  savedDate: string;
  stats: PlayerStats[];
}