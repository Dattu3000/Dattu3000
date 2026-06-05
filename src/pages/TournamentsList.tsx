import { useNavigate } from 'react-router-dom';
import { Trophy, Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export default function TournamentsList() {
    const navigate = useNavigate();
    const tournaments = useLiveQuery(() => db.tournaments.toArray()) || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', paddingBottom: '90px' }}>
            <div className="header" style={{ justifyContent: 'center' }}>
                <span className="header-title">Tournaments</span>
            </div>

            <div className="container" style={{ flex: 1 }}>
                {tournaments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <Trophy size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h2>No Tournaments Yet</h2>
                        <p>Host your first tournament and track the points table!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        {tournaments.map(t => (
                            <div key={t.id} className="card" onClick={() => navigate(`/tournament/${t.id}`)} style={{ cursor: 'pointer', padding: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{t.name}</h3>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {t.teams.length} Teams
                                        </p>
                                    </div>
                                    <span style={{ 
                                        backgroundColor: t.status === 'completed' ? 'var(--success-color)' : 'rgba(59, 130, 246, 0.2)', 
                                        color: t.status === 'completed' ? '#fff' : 'var(--accent-color)',
                                        padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button 
                className="btn" 
                style={{ 
                    position: 'fixed', bottom: '90px', right: '20px', 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 90
                }}
                onClick={() => navigate('/tournament/setup')}
            >
                <Plus size={32} />
            </button>
        </div>
    );
}
