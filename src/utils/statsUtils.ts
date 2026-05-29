import type { Match, Player } from '../types';

export interface PlayerStats {
    name: string;
    matchesPlayed: number;
    // Batting
    battingInnings: number;
    runsScored: number;
    ballsFaced: number;
    fours: number;
    sixes: number;
    highestScore: number;
    highestScoreNotOut: boolean;
    dismissals: number;
    battingAverage: number;
    battingStrikeRate: number;
    // Bowling
    bowlingInnings: number;
    ballsBowled: number;
    runsConceded: number;
    wickets: number;
    economyRate: number;
    bowlingAverage: number;
    bestWickets: number;
    bestRunsConceded: number;
    // Fielding
    catches: number;
    runOuts: number;
    stumpings: number;
}

export const calculatePlayerStats = (matches: Match[], playerName: string): PlayerStats => {
    const stats: PlayerStats = {
        name: playerName,
        matchesPlayed: 0,
        battingInnings: 0,
        runsScored: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        highestScore: 0,
        highestScoreNotOut: true,
        dismissals: 0,
        battingAverage: 0,
        battingStrikeRate: 0,
        bowlingInnings: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        economyRate: 0,
        bowlingAverage: 0,
        bestWickets: 0,
        bestRunsConceded: 0,
        catches: 0,
        runOuts: 0,
        stumpings: 0
    };

    const nameLower = playerName.toLowerCase().trim();
    if (!nameLower) return stats;

    // Filter matches where the player was in Team A or Team B roster
    const playerMatches = matches.filter(m => {
        const inTeamA = m.teamA.players.some(p => p.name.toLowerCase().trim() === nameLower);
        const inTeamB = m.teamB.players.some(p => p.name.toLowerCase().trim() === nameLower);
        return inTeamA || inTeamB;
    });

    stats.matchesPlayed = playerMatches.length;

    playerMatches.forEach(match => {
        // Find player's ID in this match
        const playerObj = match.teamA.players.find(p => p.name.toLowerCase().trim() === nameLower) ||
                          match.teamB.players.find(p => p.name.toLowerCase().trim() === nameLower);
        if (!playerObj) return;

        const playerId = playerObj.id;

        // Best bowling in a single inning tracker
        let matchWickets = 0;
        let matchRunsConceded = 0;
        let bowledInMatch = false;

        match.innings.forEach(inning => {
            if (!inning.teamId) return;

            // Batting: Check if the player batted in this inning
            const hasBallsFaced = inning.balls.some(b => b.batsmanId === playerId && b.extraType !== 'wide');
            const hasRunsScored = inning.balls.some(b => b.batsmanId === playerId && b.runs > 0);
            const gotOut = inning.balls.some(b => b.isWicket && b.wicketBatsmanId === playerId);
            const wasActiveBatter = inning.strikerId === playerId || inning.nonStrikerId === playerId || hasBallsFaced || hasRunsScored || gotOut;

            if (wasActiveBatter) {
                stats.battingInnings += 1;
                let runs = 0;
                let balls = 0;
                let fours = 0;
                let sixes = 0;
                let isOut = false;

                inning.balls.forEach(b => {
                    if (b.batsmanId === playerId) {
                        if (b.extraType !== 'wide') {
                            balls += 1;
                        }
                        if (b.extraType !== 'bye' && b.extraType !== 'legBye' && b.extraType !== 'wide') {
                            runs += b.runs;
                            if (b.runs === 4) fours += 1;
                            if (b.runs === 6) sixes += 1;
                        }
                    }
                    if (b.isWicket && b.wicketBatsmanId === playerId && b.wicketType !== 'retiredHurt') {
                        isOut = true;
                    }
                });

                stats.runsScored += runs;
                stats.ballsFaced += balls;
                stats.fours += fours;
                stats.sixes += sixes;
                if (isOut) {
                    stats.dismissals += 1;
                }

                if (runs > stats.highestScore) {
                    stats.highestScore = runs;
                    stats.highestScoreNotOut = !isOut;
                } else if (runs === stats.highestScore && !isOut) {
                    stats.highestScoreNotOut = true;
                }
            }

            // Bowling: Check if the player bowled in this inning
            const hasBowled = inning.balls.some(b => b.bowlerId === playerId);
            if (hasBowled) {
                bowledInMatch = true;
                stats.bowlingInnings += 1;
                let balls = 0;
                let runsConc = 0;
                let wckts = 0;

                inning.balls.forEach(b => {
                    if (b.bowlerId === playerId) {
                        if (b.isLegalDelivery) {
                            balls += 1;
                        }
                        if (b.extraType !== 'bye' && b.extraType !== 'legBye') {
                            runsConc += b.runs + b.extraRuns;
                        }
                        if (b.isWicket && b.wicketType !== 'runOut' && b.wicketType !== 'retiredHurt') {
                            wckts += 1;
                        }
                    }
                });

                stats.ballsBowled += balls;
                stats.runsConceded += runsConc;
                stats.wickets += wckts;

                matchWickets += wckts;
                matchRunsConceded += runsConc;
            }

            // Fielding: Check catches, stumpings, and runouts in this inning
            inning.balls.forEach(b => {
                if (b.isWicket && b.fielderId === playerId) {
                    if (b.wicketType === 'caught') stats.catches += 1;
                    if (b.wicketType === 'stumped') stats.stumpings += 1;
                    if (b.wicketType === 'runOut') stats.runOuts += 1;
                }
            });
        });

        if (bowledInMatch) {
            // Check best bowling
            if (matchWickets > stats.bestWickets) {
                stats.bestWickets = matchWickets;
                stats.bestRunsConceded = matchRunsConceded;
            } else if (matchWickets === stats.bestWickets) {
                if (stats.bestWickets === 0 || matchRunsConceded < stats.bestRunsConceded) {
                    stats.bestRunsConceded = matchRunsConceded;
                }
            }
        }
    });

    // Averages and rates calculations
    stats.battingAverage = stats.dismissals > 0 ? Number((stats.runsScored / stats.dismissals).toFixed(2)) : stats.runsScored;
    stats.battingStrikeRate = stats.ballsFaced > 0 ? Number((stats.runsScored / stats.ballsFaced * 100).toFixed(2)) : 0;
    
    const oversBowled = stats.ballsBowled / 6;
    stats.economyRate = oversBowled > 0 ? Number((stats.runsConceded / oversBowled).toFixed(2)) : 0;
    stats.bowlingAverage = stats.wickets > 0 ? Number((stats.runsConceded / stats.wickets).toFixed(2)) : 0;

    return stats;
};

export const getAllPlayerNames = (matches: Match[]): string[] => {
    const names = new Set<string>();
    matches.forEach(m => {
        m.teamA.players.forEach((p: Player) => {
            if (p.name && !p.name.startsWith('Player A') && !p.name.startsWith('Player B')) {
                names.add(p.name.trim());
            }
        });
        m.teamB.players.forEach((p: Player) => {
            if (p.name && !p.name.startsWith('Player A') && !p.name.startsWith('Player B')) {
                names.add(p.name.trim());
            }
        });
    });
    return Array.from(names).sort();
};
