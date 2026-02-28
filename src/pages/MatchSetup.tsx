import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Match, Team, TossDecision } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeft } from 'lucide-react';

export default function MatchSetup() {
    const navigate = useNavigate();
    const [matches, setMatches] = useLocalStorage<Match[]>('cricket_matches', []);

    const [teamAName, setTeamAName] = useState('');
    const [teamBName, setTeamBName] = useState('');
    const [overs, setOvers] = useState<number>(20);

    const [tossWinner, setTossWinner] = useState<'A' | 'B' | null>(null);
    const [tossDecision, setTossDecision] = useState<TossDecision | null>(null);

    const startMatch = () => {
        if (!teamAName || !teamBName || !overs || !tossWinner || !tossDecision) {
            alert("Please fill all fields to start the match");
            return;
        }

        const teamA: Team = {
            id: uuidv4(),
            name: teamAName,
            players: Array.from({ length: 11 }).map((_, i) => ({ id: uuidv4(), name: `Player A${i + 1} ` })) // placeholder players for MVP speed
        };

        const teamB: Team = {
            id: uuidv4(),
            name: teamBName,
            players: Array.from({ length: 11 }).map((_, i) => ({ id: uuidv4(), name: `Player B${i + 1} ` }))
        };

        const tWinnerId = tossWinner === 'A' ? teamA.id : teamB.id;

        // Determine who bats first
        let battingTeamId = '';
        let bowlingTeamId = '';
        if (tossDecision === 'bat') {
            battingTeamId = tWinnerId;
            bowlingTeamId = tWinnerId === teamA.id ? teamB.id : teamA.id;
        } else {
            bowlingTeamId = tWinnerId;
            battingTeamId = tWinnerId === teamA.id ? teamB.id : teamA.id;
        }

        const battingTeam = battingTeamId === teamA.id ? teamA : teamB;
        const bowlingTeam = bowlingTeamId === teamA.id ? teamA : teamB;

        const newMatch: Match = {
            id: uuidv4(),
            name: `${teamAName} vs ${teamBName} `,
            date: Date.now(),
            teamA,
            teamB,
            overs,
            tossWinnerId: tWinnerId,
            tossDecision,
            status: 'ongoing',
            currentInning: 1,
            innings: [
                {
                    teamId: battingTeamId,
                    battingTeamId,
                    bowlingTeamId,
                    score: 0,
                    wickets: 0,
                    oversCompleted: 0,
                    totalBalls: 0,
                    balls: [],
                    strikerId: battingTeam.players[0].id,
                    nonStrikerId: battingTeam.players[1].id,
                    bowlerId: bowlingTeam.players[0].id
                },
                {
                    teamId: bowlingTeamId, // placeholder for 2nd inning
                    battingTeamId: bowlingTeamId,
                    bowlingTeamId: battingTeamId,
                    score: 0,
                    wickets: 0,
                    oversCompleted: 0,
                    totalBalls: 0,
                    balls: [],
                    strikerId: bowlingTeam.players[0].id,
                    nonStrikerId: bowlingTeam.players[1].id,
                    bowlerId: battingTeam.players[0].id
                }
            ]
        };

        setMatches([...matches, newMatch]);
        navigate(`/ match / ${newMatch.id} `);
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
                <span className="header-title">Match Setup</span>
            </div>

            <div className="container">
                <div className="card">
                    <div className="form-group">
                        <label className="form-label">Team A Name</label>
                        <input
                            className="form-input"
                            placeholder="E.g., Mumbai Indians"
                            value={teamAName}
                            onChange={e => setTeamAName(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>VS</div>

                    <div className="form-group">
                        <label className="form-label">Team B Name</label>
                        <input
                            className="form-input"
                            placeholder="E.g., Chennai Super Kings"
                            value={teamBName}
                            onChange={e => setTeamBName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="form-group">
                        <label className="form-label">Total Overs</label>
                        <select className="form-select" value={overs} onChange={e => setOvers(Number(e.target.value))}>
                            <option value={5}>5 Overs (Box Cricket)</option>
                            <option value={10}>10 Overs (T10)</option>
                            <option value={12}>12 Overs</option>
                            <option value={15}>15 Overs</option>
                            <option value={20}>20 Overs (T20)</option>
                            <option value={50}>50 Overs (ODI)</option>
                        </select>
                    </div>
                </div>

                {teamAName && teamBName && (
                    <div className="card">
                        <label className="form-label" style={{ marginBottom: '1rem' }}>Toss Won By</label>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                className={`btn ${tossWinner === 'A' ? '' : 'btn-secondary'} `}
                                onClick={() => setTossWinner('A')}
                            >
                                {teamAName}
                            </button>
                            <button
                                className={`btn ${tossWinner === 'B' ? '' : 'btn-secondary'} `}
                                onClick={() => setTossWinner('B')}
                            >
                                {teamBName}
                            </button>
                        </div>

                        {tossWinner && (
                            <>
                                <label className="form-label" style={{ marginBottom: '1rem' }}>Elected To</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`btn ${tossDecision === 'bat' ? '' : 'btn-secondary'} `}
                                        onClick={() => setTossDecision('bat')}
                                    >
                                        Bat
                                    </button>
                                    <button
                                        className={`btn ${tossDecision === 'bowl' ? '' : 'btn-secondary'} `}
                                        onClick={() => setTossDecision('bowl')}
                                    >
                                        Bowl
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <button
                        className="btn"
                        style={{ padding: '1.2rem', fontSize: '1.2rem' }}
                        onClick={startMatch}
                        disabled={!teamAName || !teamBName || !overs || !tossWinner || !tossDecision}
                    >
                        Start Match
                    </button>
                </div>
            </div>
        </div>
    );
}
