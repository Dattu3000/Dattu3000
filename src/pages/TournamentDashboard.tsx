import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ArrowLeft, Trophy, Plus } from 'lucide-react';

interface TeamStats {
    id: string;
    name: string;
    color: string;
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

export default function TournamentDashboard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const tournament = useLiveQuery(() => db.tournaments.get(id!), [id]);
    const matches = useLiveQuery(() => db.matches.where('tournamentId').equals(id!).toArray(), [id]);

    if (tournament === undefined || matches === undefined) return <div className="container">Loading...</div>;
    if (tournament === null) return <div className="container">Tournament not found</div>;

    // Calculate Points Table
    const statsMap: Record<string, TeamStats> = {};
    tournament.teams.forEach(t => {
        statsMap[t.id] = {
            id: t.id, name: t.name, color: t.color || '#fff',
            played: 0, won: 0, lost: 0, tied: 0, points: 0,
            runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, nrr: 0
        };
    });

    matches.forEach(m => {
        if (m.status !== 'completed') return;

        const inn1 = m.innings[0];
        const inn2 = m.innings[1];

        if (!inn1 || !inn2) return;

        const teamA = statsMap[m.teamA.id];
        const teamB = statsMap[m.teamB.id];

        if (!teamA || !teamB) return;

        teamA.played++;
        teamB.played++;

        // Calculate scores and overs
        const t1OversMath = Math.floor(inn1.oversCompleted) + ((inn1.oversCompleted % 1) * 10 / 6);
        const t2OversMath = Math.floor(inn2.oversCompleted) + ((inn2.oversCompleted % 1) * 10 / 6);

        // All out means they faced their full quota for NRR calculation purposes
        const t1Faced = inn1.wickets >= 10 ? m.overs : t1OversMath;
        const t2Faced = inn2.wickets >= 10 ? m.overs : t2OversMath;

        if (inn1.battingTeamId === teamA.id) {
            teamA.runsScored += inn1.score; teamA.oversFaced += t1Faced;
            teamB.runsConceded += inn1.score; teamB.oversBowled += t1Faced;
            teamB.runsScored += inn2.score; teamB.oversFaced += t2Faced;
            teamA.runsConceded += inn2.score; teamA.oversBowled += t2Faced;
        } else {
            teamB.runsScored += inn1.score; teamB.oversFaced += t1Faced;
            teamA.runsConceded += inn1.score; teamA.oversBowled += t1Faced;
            teamA.runsScored += inn2.score; teamA.oversFaced += t2Faced;
            teamB.runsConceded += inn2.score; teamB.oversBowled += t2Faced;
        }

        if (inn1.score > inn2.score) {
            const winner = inn1.battingTeamId === teamA.id ? teamA : teamB;
            const loser = inn1.battingTeamId === teamA.id ? teamB : teamA;
            winner.won++; winner.points += 2;
            loser.lost++;
        } else if (inn2.score > inn1.score) {
            const winner = inn2.battingTeamId === teamA.id ? teamA : teamB;
            const loser = inn2.battingTeamId === teamA.id ? teamB : teamA;
            winner.won++; winner.points += 2;
            loser.lost++;
        } else {
            teamA.tied++; teamB.tied++;
            teamA.points += 1; teamB.points += 1;
        }
    });

    const statsList = Object.values(statsMap).map(s => {
        const rsrr = s.oversFaced > 0 ? s.runsScored / s.oversFaced : 0;
        const rcrc = s.oversBowled > 0 ? s.runsConceded / s.oversBowled : 0;
        s.nrr = rsrr - rcrc;
        return s;
    }).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.nrr - a.nrr;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
            <div className="header" style={{ justifyContent: 'space-between' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="header-title">{tournament.name}</span>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--accent-color)' }}>
                        <Trophy size={24} /> Points Table
                    </h2>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.8rem', textAlign: 'left' }}>Team</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center' }}>P</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center' }}>W</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center' }}>L</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center' }}>Pts</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center' }}>NRR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsList.map((s) => (
                                <tr key={s.id} style={{ borderTop: '1px solid var(--card-bg)' }}>
                                    <td style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: s.color }}></div>
                                        {s.name}
                                    </td>
                                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>{s.played}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--success-color)' }}>{s.won}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--danger-color)' }}>{s.lost}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>{s.points}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'center', color: s.nrr >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                        {s.nrr > 0 ? '+' : ''}{s.nrr.toFixed(3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-secondary)' }}>Matches</h2>
                </div>

                {matches.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                        No matches played yet
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {matches.map(m => (
                            <div key={m.id} className="card" onClick={() => navigate(m.status === 'completed' ? `/scorecard/${m.id}` : `/match/${m.id}`)} style={{ cursor: 'pointer', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <span>{new Date(m.date).toLocaleDateString()}</span>
                                    <span style={{ color: m.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)' }}>{m.status.toUpperCase()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: m.teamA.color || '#3b82f6' }}></div>
                                        {m.teamA.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                        {m.teamB.name}
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: m.teamB.color || '#ef4444' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem', marginTop: 'auto' }}>
                <button 
                    className="btn" 
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => navigate(`/match-setup?tournamentId=${tournament.id}`)}
                >
                    <Plus size={20} /> Host Match
                </button>
            </div>
        </div>
    );
}
