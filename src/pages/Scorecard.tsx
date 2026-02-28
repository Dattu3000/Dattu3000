import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match } from '../types';
import { ArrowLeft, Download, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Scorecard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [matches] = useLocalStorage<Match[]>('cricket_matches', []);
    const scorecardRef = useRef<HTMLDivElement>(null);
    const [expandedInnings, setExpandedInnings] = useState<number[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    const matchIndex = matches.findIndex(m => m.id === id);
    const match = matches[matchIndex];

    // Initialize expanded state once match loads
    useEffect(() => {
        if (match && expandedInnings.length === 0) {
            // Default: expand only the CURRENT inning
            setExpandedInnings([match.currentInning]);
        }
    }, [match]);

    if (!match) return <div className="container">Loading...</div>;

    const toggleInning = (inningNum: number) => {
        setExpandedInnings(prev =>
            prev.includes(inningNum)
                ? prev.filter(n => n !== inningNum)
                : [...prev, inningNum]
        );
    };

    const handleShare = async () => {
        if (scorecardRef.current) {
            setIsExporting(true);
            // Give React a tick to render all expanded innings before capturing
            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(scorecardRef.current as HTMLDivElement, { scale: 2, useCORS: true });
                    // Use standard canvas to blob logic
                    canvas.toBlob(async (blob) => {
                        if (!blob) return;

                        if (navigator.share) {
                            const file = new File([blob], `scorecard-${match.id}.png`, { type: 'image/png' });
                            await navigator.share({
                                title: `Cricket Scorecard: ${match.name}`,
                                files: [file]
                            });
                        } else {
                            // Fallback for desktop/non-supporting browsers
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `scorecard-${match.id}.png`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }
                    }, 'image/png');

                } catch (err) {
                    console.error("Failed to generate scorecard image", err);
                    alert("Failed to export scorecard.");
                } finally {
                    setIsExporting(false);
                }
            }, 100); // 100ms timeout to allow DOM to update before taking screenshot
        }
    };

    const getTeamName = (teamId: string) => teamId === match.teamA.id ? match.teamA.name : match.teamB.name;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="header" style={{ justifyContent: 'space-between' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="header-title">Scorecard</span>
                <button
                    onClick={handleShare}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}
                >
                    <Download size={24} />
                </button>
            </div>

            <div className="container" style={{ overflowY: 'auto' }}>
                <div
                    ref={scorecardRef}
                    className="card"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '2px solid var(--card-bg)',
                        padding: '1.5rem',
                        color: 'var(--text-primary)'
                    }}
                >
                    <h2 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {match.name}
                    </h2>
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {new Date(match.date).toLocaleDateString()} • {match.overs} Overs Match
                        <br />
                        {getTeamName(match.tossWinnerId!)} won the toss and elected to {match.tossDecision}
                    </div>

                    {match.innings.map((inning, idx) => {
                        if (inning.teamId === '') return null; // Unplayed inning

                        const battingTeamName = getTeamName(inning.battingTeamId);
                        const runRate = inning.totalBalls > 0 ? (inning.score / (inning.totalBalls / 6)).toFixed(1) : '0.0';
                        const inningNum = idx + 1;
                        const isExpanded = expandedInnings.includes(inningNum);

                        return (
                            <div key={idx} className="card" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--card-bg)' }}>
                                {/* Accordion Header */}
                                <div
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={() => toggleInning(inningNum)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ textTransform: 'uppercase', margin: 0 }}>{battingTeamName}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Innings {inningNum}</span>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{inning.score}/{inning.wickets}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {inning.oversCompleted.toFixed(1)} Overs • RR: {runRate}
                                            </div>
                                        </div>
                                        <div>
                                            {isExpanded || isExporting ? <ChevronUp size={24} color="var(--text-secondary)" /> : <ChevronDown size={24} color="var(--text-secondary)" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Collapsible Body */}
                                {(isExpanded || isExporting) && (
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--card-bg)', paddingTop: '1rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem', minWidth: '400px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--card-bg)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                                    <th style={{ padding: '0.5rem', width: '40%' }}>Batting</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>R</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>B</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>4s</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>6s</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>SR</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const batters = new Map<string, { id: string, name: string, runs: number, balls: number, fours: number, sixes: number, dismissal: string | null }>();

                                                    const bTeam = match.teamA.id === inning.battingTeamId ? match.teamA : match.teamB;
                                                    const bowlTeam = match.teamA.id === inning.bowlingTeamId ? match.teamA : match.teamB;

                                                    inning.balls.forEach(b => {
                                                        if (!batters.has(b.batsmanId)) {
                                                            const bName = bTeam.players.find(p => p.id === b.batsmanId)?.name || 'Unknown';
                                                            batters.set(b.batsmanId, { id: b.batsmanId, name: bName, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null });
                                                        }

                                                        const stat = batters.get(b.batsmanId)!;

                                                        if (b.extraType !== 'wide') {
                                                            stat.balls += 1;
                                                        }

                                                        if (b.extraType !== 'bye' && b.extraType !== 'legBye' && b.extraType !== 'wide') {
                                                            stat.runs += b.runs;
                                                            if (b.runs === 4) stat.fours += 1;
                                                            if (b.runs === 6) stat.sixes += 1;
                                                        }

                                                        if (b.isWicket && b.wicketBatsmanId === b.batsmanId) {
                                                            const bowlerName = bowlTeam.players.find(p => p.id === b.bowlerId)?.name || 'Unknown';
                                                            let fielderStr = '';
                                                            if (b.fielderId) {
                                                                const fName = bowlTeam.players.find(p => p.id === b.fielderId)?.name || 'Sub';
                                                                fielderStr = fName;
                                                            }

                                                            if (b.wicketType === 'bowled') stat.dismissal = `b ${bowlerName}`;
                                                            else if (b.wicketType === 'caught') stat.dismissal = fielderStr ? `c ${fielderStr} b ${bowlerName}` : `c & b ${bowlerName}`;
                                                            else if (b.wicketType === 'lbw') stat.dismissal = `lbw b ${bowlerName}`;
                                                            else if (b.wicketType === 'runOut') stat.dismissal = fielderStr ? `run out (${fielderStr})` : `run out`;
                                                            else if (b.wicketType === 'stumped') stat.dismissal = fielderStr ? `st ${fielderStr} b ${bowlerName}` : `stumped b ${bowlerName}`;
                                                            else stat.dismissal = b.wicketType || 'Out';
                                                        }
                                                    });

                                                    if (inning.strikerId && !batters.has(inning.strikerId)) {
                                                        const bName = bTeam.players.find(p => p.id === inning.strikerId)?.name || 'Unknown';
                                                        batters.set(inning.strikerId, { id: inning.strikerId, name: bName, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null });
                                                    }
                                                    if (inning.nonStrikerId && !batters.has(inning.nonStrikerId)) {
                                                        const bName = bTeam.players.find(p => p.id === inning.nonStrikerId)?.name || 'Unknown';
                                                        batters.set(inning.nonStrikerId, { id: inning.nonStrikerId, name: bName, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null });
                                                    }

                                                    return Array.from(batters.values()).map(stat => {
                                                        const sr = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(2) : '0.00';
                                                        const isNotOut = stat.dismissal === null;
                                                        return (
                                                            <tr key={stat.id} style={{ borderBottom: '1px solid var(--card-bg)' }}>
                                                                <td style={{ padding: '0.8rem 0.5rem' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{stat.name}{isNotOut && match.status !== 'completed' ? '*' : ''}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: isNotOut ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                                                        {isNotOut ? 'not out' : stat.dismissal}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{stat.runs}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stat.balls}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stat.fours}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stat.sixes}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{sr}</td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>

                                        {/* Extras Summary */}
                                        <div style={{ padding: '0.5rem', margin: '1rem 0', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>Extras: </span>
                                            {(() => {
                                                let nb = 0, wd = 0, b = 0, lb = 0;
                                                inning.balls.forEach(ball => {
                                                    if (ball.extraType === 'noBall') nb += ball.extraRuns;
                                                    if (ball.extraType === 'wide') wd += ball.extraRuns;
                                                    if (ball.extraType === 'bye') b += ball.extraRuns;
                                                    if (ball.extraType === 'legBye') lb += ball.extraRuns;
                                                });
                                                const total = nb + wd + b + lb;
                                                return `${total} (nb ${nb}, w ${wd}, b ${b}, lb ${lb})`;
                                            })()}
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '400px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--card-bg)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                                    <th style={{ padding: '0.5rem', width: '40%' }}>Bowling</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>O</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>M</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>R</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>W</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>ECON</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const bowlers = new Map<string, { id: string, name: string, balls: number, runs: number, wickets: number, maidens: number }>();
                                                    const bowlTeam = match.teamA.id === inning.bowlingTeamId ? match.teamA : match.teamB;

                                                    inning.balls.forEach(b => {
                                                        if (!bowlers.has(b.bowlerId)) {
                                                            const bName = bowlTeam.players.find(p => p.id === b.bowlerId)?.name || 'Unknown';
                                                            bowlers.set(b.bowlerId, { id: b.bowlerId, name: bName, balls: 0, runs: 0, wickets: 0, maidens: 0 }); // Note: Maidens ignored for MVP simplicity
                                                        }

                                                        const stat = bowlers.get(b.bowlerId)!;

                                                        if (b.isLegalDelivery) stat.balls += 1;

                                                        if (b.extraType !== 'bye' && b.extraType !== 'legBye') {
                                                            stat.runs += b.runs + b.extraRuns;
                                                        }

                                                        if (b.isWicket && b.wicketType !== 'runOut') {
                                                            stat.wickets += 1;
                                                        }
                                                    });

                                                    return Array.from(bowlers.values()).map(stat => {
                                                        const overs = Math.floor(stat.balls / 6) + ((stat.balls % 6) / 10);
                                                        const econ = stat.balls > 0 ? (stat.runs / (stat.balls / 6)).toFixed(2) : '0.00';
                                                        return (
                                                            <tr key={stat.id} style={{ borderBottom: '1px solid var(--card-bg)' }}>
                                                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{stat.name}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{overs.toFixed(1)}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stat.maidens}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{stat.runs}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stat.wickets}</td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{econ}</td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {match.status === 'completed' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: 'var(--success-color)'
                        }}>
                            Match Completed
                            {match.innings[1] && match.innings[1].score > match.innings[0].score ?
                                ` • ${getTeamName(match.innings[1].battingTeamId)} Won` :
                                ` • ${getTeamName(match.innings[0].battingTeamId)} Won`}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <button className="btn" onClick={handleShare} disabled={isExporting} style={{ maxWidth: '300px' }}>
                        {isExporting ? 'Exporting...' : <><Download size={20} style={{ marginRight: '0.5rem' }} /> Export as Image</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
