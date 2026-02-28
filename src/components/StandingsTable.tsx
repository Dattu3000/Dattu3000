import React from 'react';
import type { TeamStanding } from '../utils/standingsUtils';
import { Trash2 } from 'lucide-react';

interface StandingsTableProps {
    standings: TeamStanding[];
    onClearHistory: () => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onClearHistory }) => {
    if (standings.length === 0) {
        return (
            <div className="card" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem 1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>Tournament Standings</h2>
                <p style={{ color: 'var(--text-secondary)' }}>No completed matches yet. Start a match to build the points table!</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>Tournament Standings</h2>
                <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', width: 'auto' }}
                    onClick={() => {
                        if (window.confirm('Are you sure you want to reset the entire tournament? This will delete all matches from history.')) {
                            onClearHistory();
                        }
                    }}
                >
                    <Trash2 size={16} /> Reset
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '450px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--card-bg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', width: '35%' }}>Team</th>
                            <th style={{ padding: '0.5rem' }}>P</th>
                            <th style={{ padding: '0.5rem' }}>W</th>
                            <th style={{ padding: '0.5rem' }}>L</th>
                            <th style={{ padding: '0.5rem', color: 'var(--accent-color)' }}>PTS</th>
                            <th style={{ padding: '0.5rem' }}>NRR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((t, index) => (
                            <tr key={t.teamId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>
                                    <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>{index + 1}</span>
                                    {t.teamName}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{t.played}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{t.won}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{t.lost}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>{t.points}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{t.nrr > 0 ? '+' : ''}{t.nrr.toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                Win: 2 pts • Tie: 1 pt • Loss: 0 pts <br />
                NRR (Net Run Rate) decides rank on tied points.
            </div>
        </div>
    );
};
