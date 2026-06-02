import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ArrowLeft, User, LogOut, Award, Activity, BarChart2, CheckCircle } from 'lucide-react';
import { calculatePlayerStats, getAllPlayerNames } from '../utils/statsUtils';
import { PlayerCard } from '../components/PlayerCard';

interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

interface CredentialResponse {
    credential: string;
}

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (config: { client_id: string; callback: (response: CredentialResponse) => void }) => void;
                    renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: number }) => void;
                };
            };
        };
    }
}

const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT", e);
        return null;
    }
};

export default function Profile() {
    const navigate = useNavigate();
    const matches = useLiveQuery(() => db.matches.toArray()) || [];
    const [googleUser, setGoogleUser] = useLocalStorage<GoogleUser | null>('google_user', null);
    const [activeTab, setActiveTab] = useState<'overview' | 'batting' | 'bowling' | 'fielding' | 'card'>('overview');

    const playerNamesList = getAllPlayerNames(matches);

    // Initializer function for selectedPlayerName to avoid setState inside useEffect
    const [selectedPlayerName, setSelectedPlayerName] = useState<string>(() => {
        if (googleUser && googleUser.name) {
            return googleUser.name;
        }
        return playerNamesList.length > 0 ? playerNamesList[0] : '';
    });

    // Google Identity Services setup
    useEffect(() => {
        const handleCredentialResponse = (response: CredentialResponse) => {
            try {
                const credential = response.credential;
                const payload = decodeJwt(credential);
                if (payload) {
                    const user: GoogleUser = {
                        name: payload.name,
                        email: payload.email,
                        picture: payload.picture
                    };
                    setGoogleUser(user);
                    setSelectedPlayerName(payload.name);
                }
            } catch (error) {
                console.error("Error processing Google login response", error);
            }
        };

        const initializeGoogleSignIn = () => {
            const google = window.google;
            if (google?.accounts?.id) {
                google.accounts.id.initialize({
                    client_id: (import.meta.env.VITE_GOOGLE_CLIENT_ID) || '54321-demo-client-id.apps.googleusercontent.com',
                    callback: handleCredentialResponse,
                });
                
                const btnContainer = document.getElementById('google-signin-btn');
                if (btnContainer) {
                    google.accounts.id.renderButton(btnContainer, {
                        theme: 'dark',
                        size: 'large',
                        width: 250,
                    });
                }
            }
        };

        initializeGoogleSignIn();
        
        const interval = setInterval(() => {
            const google = window.google;
            if (google?.accounts?.id) {
                initializeGoogleSignIn();
                clearInterval(interval);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [setGoogleUser]);

    const handleSignOut = () => {
        setGoogleUser(null);
        if (playerNamesList.length > 0) {
            setSelectedPlayerName(playerNamesList[0]);
        } else {
            setSelectedPlayerName('');
        }
    };

    const handleDemoLogin = () => {
        const demoUser: GoogleUser = {
            name: "Virat Kohli",
            email: "virat.kohli@demo.com",
            picture: "https://lh3.googleusercontent.com/a/default-user=s96-c"
        };
        setGoogleUser(demoUser);
        setSelectedPlayerName("Virat Kohli");
    };

    const stats = calculatePlayerStats(matches, selectedPlayerName);

    const getOversDisplay = (balls: number): string => {
        const overs = Math.floor(balls / 6);
        const remainder = balls % 6;
        return remainder > 0 ? `${overs}.${remainder}` : `${overs}`;
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
                <span className="header-title">User Stats & Profile</span>
            </div>

            <div className="container" style={{ paddingBottom: '2rem' }}>
                {/* Account Section */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {googleUser ? (
                        <>
                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 'bold' }}>
                                <CheckCircle size={14} />
                                Google Connected
                            </div>
                            <img 
                                src={googleUser.picture} 
                                alt={googleUser.name} 
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.src = 'https://lh3.googleusercontent.com/a/default-user=s96-c';
                                }}
                            />
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{googleUser.name}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{googleUser.email}</p>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto' }} onClick={handleSignOut}>
                                <LogOut size={16} /> Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%' }}>
                                <User size={48} color="var(--text-secondary)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>Guest Profile</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign in to save and link your stats</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                                <div id="google-signin-btn" style={{ minHeight: '40px' }}></div>
                                <button className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }} onClick={handleDemoLogin}>
                                    Demo Sign In (Simulated)
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Profile Picker Dropdown */}
                <div className="card">
                    <label className="form-label">Select Player to View Stats</label>
                    {playerNamesList.length > 0 ? (
                        <select 
                            className="form-select"
                            value={selectedPlayerName}
                            onChange={(e) => setSelectedPlayerName(e.target.value)}
                        >
                            {selectedPlayerName && !playerNamesList.includes(selectedPlayerName) && (
                                <option value={selectedPlayerName}>{selectedPlayerName}</option>
                            )}
                            {playerNamesList.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No scored players found in match records yet. Matches you create and score will appear here.
                        </div>
                    )}
                </div>

                {selectedPlayerName && (
                    <>
                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                            {(['overview', 'batting', 'bowling', 'fielding', 'card'] as const).map(tab => (
                                <button
                                    key={tab}
                                    className={`btn ${activeTab === tab ? '' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem', textTransform: 'capitalize', minWidth: '85px' }}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Stats Dashboard */}
                        {activeTab === 'card' ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                                <PlayerCard 
                                    stats={stats} 
                                    imageUrl={googleUser?.name === selectedPlayerName ? googleUser.picture : undefined}
                                />
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
                                {activeTab === 'overview' && (
                                <div>
                                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Award size={18} color="var(--accent-color)" /> Career Overview
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Matches Played</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.matchesPlayed}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Runs</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.runsScored}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wickets Taken</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stats.wickets}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>High Score</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {stats.highestScore}{stats.highestScoreNotOut && stats.highestScore > 0 ? '*' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    {stats.matchesPlayed === 0 && (
                                        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            No match actions registered yet for "{selectedPlayerName}".
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'batting' && (
                                <div>
                                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BarChart2 size={18} color="var(--success-color)" /> Batting Performance
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Innings Batted</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.battingInnings}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Runs Scored</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.runsScored}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Balls Faced</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.ballsFaced}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Batting Average</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.battingInnings > 0 ? stats.battingAverage : '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Strike Rate</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.battingStrikeRate > 0 ? stats.battingStrikeRate : '0.00'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Highest Score</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.highestScore}{stats.highestScoreNotOut && stats.highestScore > 0 ? '*' : ''}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Boundaries (4s / 6s)</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.fours} / {stats.sixes}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bowling' && (
                                <div>
                                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={18} color="var(--accent-color)" /> Bowling Records
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Innings Bowled</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.bowlingInnings}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Overs Bowled</span>
                                            <span style={{ fontWeight: 'bold' }}>{getOversDisplay(stats.ballsBowled)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Runs Conceded</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{stats.runsConceded}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Wickets Taken</span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{stats.wickets}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Economy Rate</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.ballsBowled > 0 ? stats.economyRate.toFixed(2) : '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Bowling Average</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.wickets > 0 ? stats.bowlingAverage.toFixed(2) : '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Best Bowling Inning</span>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {stats.bestWickets > 0 || stats.bestRunsConceded > 0 
                                                    ? `${stats.bestWickets}/${stats.bestRunsConceded}` 
                                                    : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'fielding' && (
                                <div>
                                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={18} color="var(--text-secondary)" /> Fielding Achievements
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Catches Taken</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.catches}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Stumpings</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.stumpings}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Run Outs Involved</span>
                                            <span style={{ fontWeight: 'bold' }}>{stats.runOuts}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
