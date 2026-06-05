import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { Team, Tournament } from '../types';

const TEAM_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function TournamentSetup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [teams, setTeams] = useState<{ id: string, name: string, color: string }[]>([
        { id: uuidv4(), name: 'Team 1', color: TEAM_COLORS[0] },
        { id: uuidv4(), name: 'Team 2', color: TEAM_COLORS[1] }
    ]);

    const addTeam = () => {
        setTeams([...teams, { id: uuidv4(), name: `Team ${teams.length + 1}`, color: TEAM_COLORS[teams.length % TEAM_COLORS.length] }]);
    };

    const updateTeam = (id: string, field: 'name' | 'color', value: string) => {
        setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTeam = (id: string) => {
        if (teams.length <= 2) return;
        setTeams(teams.filter(t => t.id !== id));
    };

    const createTournament = async () => {
        if (!name.trim()) {
            alert('Please enter a tournament name');
            return;
        }
        if (teams.some(t => !t.name.trim())) {
            alert('Please ensure all teams have a name');
            return;
        }

        const fullTeams: Team[] = teams.map(t => ({
            id: t.id,
            name: t.name,
            color: t.color,
            players: Array.from({ length: 11 }).map((_, i) => ({ id: uuidv4(), name: `Player ${i + 1}` }))
        }));

        const tournament: Tournament = {
            id: uuidv4(),
            name,
            teams: fullTeams,
            matchIds: [],
            status: 'ongoing',
            createdAt: Date.now()
        };

        await db.tournaments.add(tournament);
        navigate(`/tournament/${tournament.id}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
            <div className="header">
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', position: 'absolute', left: '1rem', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="header-title">New Tournament</span>
            </div>

            <div className="container">
                <div className="card">
                    <div className="form-group">
                        <label className="form-label">Tournament Name</label>
                        <input
                            className="form-input"
                            placeholder="E.g., Weekend Premier League"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Teams ({teams.length})</h3>
                    <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={addTeam}>
                        <Plus size={16} /> Add Team
                    </button>
                </div>

                {teams.map((team, idx) => (
                    <div key={team.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                className="form-input"
                                placeholder={`Team ${idx + 1}`}
                                value={team.name}
                                onChange={e => updateTeam(team.id, 'name', e.target.value)}
                                style={{ marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {TEAM_COLORS.map(c => (
                                    <div 
                                        key={c} 
                                        onClick={() => updateTeam(team.id, 'color', c)}
                                        style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: team.color === c ? '2px solid white' : '2px solid transparent' }} 
                                    />
                                ))}
                            </div>
                        </div>
                        {teams.length > 2 && (
                            <button 
                                onClick={() => removeTeam(team.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <Trash2 size={24} />
                            </button>
                        )}
                    </div>
                ))}

                <div style={{ marginTop: 'auto', paddingTop: '1rem', paddingBottom: '2rem' }}>
                    <button
                        className="btn"
                        style={{ padding: '1.2rem', fontSize: '1.2rem', width: '100%' }}
                        onClick={createTournament}
                        disabled={!name.trim()}
                    >
                        Create Tournament
                    </button>
                </div>
            </div>
        </div>
    );
}
