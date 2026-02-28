export type MatchStatus = 'setup' | 'ongoing' | 'completed' | 'abandoned';

export type TossDecision = 'bat' | 'bowl';

export interface Player {
    id: string;
    name: string;
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
}

export type ExtraType = 'wide' | 'noBall' | 'bye' | 'legBye' | null;
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'runOut' | 'stumped' | 'hitWicket' | 'retiredHurt' | null;
export type ShotRegion = 'Third Man' | 'Point' | 'Cover' | 'Mid Off' | 'Mid On' | 'Mid Wicket' | 'Square Leg' | 'Fine Leg' | null;

export interface Ball {
    id: string;
    inning: 1 | 2;
    over: number;         // Over index (0-based)
    ballNumber: number;   // Valid deliveries in over (1 to 6)
    batsmanId: string;
    bowlerId: string;
    runs: number;         // Runs scored off the bat
    extraType: ExtraType;
    extraRuns: number;    // Runs from extras
    isWicket: boolean;
    wicketType: WicketType;
    wicketBatsmanId: string | null; // Who got out
    fielderId?: string;
    shotRegion?: ShotRegion;
    timestamp: number;
    isLegalDelivery: boolean;
}

export interface Inning {
    teamId: string;
    battingTeamId: string;
    bowlingTeamId: string;
    score: number;
    wickets: number;
    oversCompleted: number; // Display format, e.g., 5.4 = 5 overs and 4 balls
    totalBalls: number;     // Total legal deliveries
    balls: Ball[];
    strikerId?: string;
    nonStrikerId?: string;
    bowlerId?: string;
}

export interface Match {
    id: string;
    name: string;
    date: number;
    teamA: Team;
    teamB: Team;
    overs: number;
    tossWinnerId: string | null;
    tossDecision: TossDecision | null;
    status: MatchStatus;
    innings: Inning[];
    currentInning: 1 | 2;
}

export interface MatchState {
    match: Match | null;
    strikerId: string | null;
    nonStrikerId: string | null;
    currentBowlerId: string | null;
}
