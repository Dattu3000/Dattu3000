import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match } from '../types';
import { ArrowLeft, Clock } from 'lucide-react';

export default function History() {
    const navigate = useNavigate();
    const [matches] = useLocalStorage<Match[]>('cricket_matches', []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="header">
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', position: 'absolute', left: '1rem', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="header-title">Match History</span>
            </div>

            <div className="container" style={{ overflowY: 'auto' }}>
                {matches.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
                        <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No matches found in history.</p>
                    </div>
                ) : (
                    [...matches].reverse().map(match => (
                        <div
                            key={match.id}
                            className="card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(match.status === 'completed' ? `/scorecard/${match.id}` : `/match/${match.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold' }}>{match.name}</span>
                                <span style={{ fontSize: '0.8rem', color: match.status === 'completed' ? 'var(--success-color)' : 'var(--accent-color)' }}>
                                    {match.status.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {new Date(match.date).toLocaleDateString()} • {match.overs} Overs
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
