import type { Match } from '../types';

export interface TeamStanding {
    teamId: string;
    teamName: string;
    played: number;
    won: number;
    lost: number;
    tied: number;
    points: number;
    runsScored: number;
    oversFaced: number;
    runsConceded: number;
    oversBowled: number;
    nrr: number;
}

const getOversValue = (balls: number): number => {
    return Math.floor(balls / 6) + (balls % 6) / 6;
};

export const calculateStandings = (matches: Match[]): TeamStanding[] => {
    const standingsMap = new Map<string, TeamStanding>();

    const getOrInitTeam = (teamId: string, teamName: string) => {
        if (!standingsMap.has(teamId)) {
            standingsMap.set(teamId, {
                teamId, teamName, played: 0, won: 0, lost: 0, tied: 0, points: 0,
                runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, nrr: 0
            });
        }
        return standingsMap.get(teamId)!;
    };

    const completedMatches = matches.filter(m => m.status === 'completed' && m.innings.length === 2);

    completedMatches.forEach(match => {
        const i1 = match.innings[0];
        const i2 = match.innings[1];

        const t1 = getOrInitTeam(i1.battingTeamId, match.teamA.id === i1.battingTeamId ? match.teamA.name : match.teamB.name);
        const t2 = getOrInitTeam(i2.battingTeamId, match.teamA.id === i2.battingTeamId ? match.teamA.name : match.teamB.name);

        t1.played += 1;
        t2.played += 1;

        // Determine Winner
        if (i1.score > i2.score) {
            t1.won += 1;
            t1.points += 2;
            t2.lost += 1;
        } else if (i2.score > i1.score) {
            t2.won += 1;
            t2.points += 2;
            t1.lost += 1;
        } else {
            t1.tied += 1;
            t1.points += 1;
            t2.tied += 1;
            t2.points += 1;
        }

        // NRR Accumulation
        // Note: For NRR, if a team is all out, their 'overs faced' is the full quota of match overs, not balls faced.
        const t1OversFaced = i1.wickets === 10 ? match.overs : getOversValue(i1.totalBalls);
        const t2OversFaced = i2.wickets === 10 ? match.overs : getOversValue(i2.totalBalls);

        t1.runsScored += i1.score;
        t1.oversFaced += t1OversFaced;
        t1.runsConceded += i2.score;
        t1.oversBowled += t2OversFaced; // The overs T2 faced is the overs T1 bowled

        t2.runsScored += i2.score;
        t2.oversFaced += t2OversFaced;
        t2.runsConceded += i1.score;
        t2.oversBowled += t1OversFaced;
    });

    // Calculate final NRR
    const standings = Array.from(standingsMap.values()).map(t => {
        const runRateFor = t.oversFaced > 0 ? (t.runsScored / t.oversFaced) : 0;
        const runRateAgainst = t.oversBowled > 0 ? (t.runsConceded / t.oversBowled) : 0;
        t.nrr = runRateFor - runRateAgainst;
        return t;
    });

    // Sort: Points (desc) -> NRR (desc)
    return standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.nrr - a.nrr;
    });
};
