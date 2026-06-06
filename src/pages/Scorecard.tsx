import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ArrowLeft, Download, ChevronDown, ChevronUp, Trophy, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { WagonWheel } from '../components/WagonWheel';
import { AdBanner } from '../components/AdBanner';
import { PlayerCard } from '../components/PlayerCard';
import { calculatePlayerStats } from '../utils/statsUtils';
import { AIInsights } from '../components/AIInsights';
import { BowlingPitchMap } from '../components/BowlingPitchMap';

export default function Scorecard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const matches = useLiveQuery(() => db.matches.toArray()) || [];
    const scorecardRef = useRef<HTMLDivElement>(null);
    const [expandedInnings, setExpandedInnings] = useState<number[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedBatsmanId, setSelectedBatsmanId] = useState<string | null>(null);
    const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);
    const [showAIInsights, setShowAIInsights] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    const matchIndex = matches.findIndex(m => m.id === id);
    const match = matches[matchIndex];

    // Initialize expanded state once match loads
    useEffect(() => {
        if (match && expandedInnings.length === 0) {
            // Default: expand only the CURRENT inning
            setExpandedInnings([match.currentInning]);
        }
    }, [match, expandedInnings.length]);

    if (!match) return <div className="container">Loading...</div>;

    const calculateMVP = (): { name: string, runs: number, wickets: number, points: number } | null => {
        if (!match || match.status !== 'completed') return null;

        const playerStats = new Map<string, { id: string, name: string, points: number, runs: number, wickets: number }>();

        const initPlayer = (id: string, name: string) => {
            if (!playerStats.has(id)) {
                playerStats.set(id, { id, name, points: 0, runs: 0, wickets: 0 });
            }
        };

        match.innings.forEach(inning => {
            if (inning.teamId === '') return;
            const bTeam = match.teamA.id === inning.battingTeamId ? match.teamA : match.teamB;
            const bowlTeam = match.teamA.id === inning.bowlingTeamId ? match.teamA : match.teamB;

            inning.balls.forEach(b => {
                // Batting points
                if (b.extraType !== 'bye' && b.extraType !== 'legBye' && b.extraType !== 'wide') {
                    if (b.runs > 0) {
                        const batter = bTeam.players.find(p => p.id === b.batsmanId);
                        if (batter) {
                            initPlayer(batter.id, batter.name);
                            const stat = playerStats.get(batter.id)!;
                            stat.runs += b.runs;
                            let pts = b.runs;
                            if (b.runs === 4) pts += 1;
                            if (b.runs === 6) pts += 2;
                            stat.points += pts;
                        }
                    }
                }

                // Bowling points
                if (b.isWicket && b.wicketType !== 'runOut' && b.wicketType !== 'retiredHurt') {
                    const bowler = bowlTeam.players.find(p => p.id === b.bowlerId);
                    if (bowler) {
                        initPlayer(bowler.id, bowler.name);
                        const stat = playerStats.get(bowler.id)!;
                        stat.wickets += 1;
                        stat.points += 25; // 25 per wicket
                    }
                }

                // Fielding points
                if (b.isWicket && b.fielderId) {
                    const fielder = bowlTeam.players.find(p => p.id === b.fielderId);
                    if (fielder) {
                        initPlayer(fielder.id, fielder.name);
                        const stat = playerStats.get(fielder.id)!;
                        stat.points += 10; // 10 per catch/runout
                    }
                }
            });
        });

        let mvp: { name: string, runs: number, wickets: number, points: number } | null = null;
        let maxPoints = -1;
        playerStats.forEach(stat => {
            if (stat.points > maxPoints) {
                maxPoints = stat.points;
                mvp = stat;
            }
        });

        return mvp;
    };

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

    const handleAIGenerate = () => {
        let prompt = `You are an exciting, passionate cricket commentator like Harsha Bhogle or Ian Smith. Write a thrilling post-match summary for the following match. Make it sound like a live broadcast wrap-up. Use 2-3 short paragraphs.\n\n`;
        prompt += `Match Name: ${match.name}\n`;
        prompt += `Toss: ${getTeamName(match.tossWinnerId!)} won the toss and elected to ${match.tossDecision}.\n\n`;
        
        match.innings.forEach((inning, idx) => {
            if (inning.teamId === '') return;
            const battingTeamName = getTeamName(inning.battingTeamId);
            prompt += `Innings ${idx + 1}: ${battingTeamName} scored ${inning.score}/${inning.wickets} in ${inning.oversCompleted.toFixed(1)} overs.\n`;
        });
        
        const mvp = calculateMVP();
        if (mvp) {
            prompt += `\nPlayer of the Match: ${mvp.name} with ${mvp.runs} runs and ${mvp.wickets} wickets.\n`;
        }
        
        let result = "";
        if (match.status === 'completed') {
            if (match.innings[1] && match.innings[1].score > match.innings[0].score) {
                result = `${getTeamName(match.innings[1].battingTeamId)} won the match!`;
            } else if (match.innings[1] && match.innings[1].score < match.innings[0].score) {
                result = `${getTeamName(match.innings[0].battingTeamId)} won the match!`;
            } else {
                result = `The match was a tie!`;
            }
            prompt += `\nResult: ${result}\n`;
        }

        setAiPrompt(prompt);
        setShowAIInsights(true);
    };

    const battingColor = match.innings[match.currentInning - 1]?.battingTeamId === match.teamA.id 
        ? match.teamA.color || '#3b82f6' 
        : match.teamB.color || '#3b82f6';

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', height: '100vh',
            '--accent-color': battingColor
        } as React.CSSProperties}>
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
                                                            else if (b.wicketType === 'retiredHurt') stat.dismissal = 'retired hurt';
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
                                                            <React.Fragment key={stat.id}>
                                                                <tr
                                                                    onClick={() => setSelectedBatsmanId(selectedBatsmanId === stat.id ? null : stat.id)}
                                                                    style={{ borderBottom: '1px solid var(--card-bg)', cursor: 'pointer' }}
                                                                >
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
                                                                {selectedBatsmanId === stat.id && (
                                                                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                                        <td colSpan={6} style={{ padding: '1rem', borderBottom: '1px solid var(--card-bg)' }}>
                                                                            <h4 style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Wagon Wheel - {stat.name}</h4>
                                                                            <WagonWheel balls={inning.balls} batsmanId={stat.id} />
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
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

                                                        if (b.isWicket && b.wicketType !== 'runOut' && b.wicketType !== 'retiredHurt') {
                                                            stat.wickets += 1;
                                                        }
                                                    });

                                                    return Array.from(bowlers.values()).map(stat => {
                                                        const overs = Math.floor(stat.balls / 6) + ((stat.balls % 6) / 10);
                                                        const econ = stat.balls > 0 ? (stat.runs / (stat.balls / 6)).toFixed(2) : '0.00';
                                                        return (
                                                            <React.Fragment key={stat.id}>
                                                                <tr 
                                                                    onClick={() => setSelectedBowlerId(selectedBowlerId === stat.id ? null : stat.id)}
                                                                    style={{ borderBottom: '1px solid var(--card-bg)', cursor: 'pointer' }}
                                                                >
                                                                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{stat.name}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{overs.toFixed(1)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stat.maidens}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{stat.runs}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stat.wickets}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{econ}</td>
                                                                </tr>
                                                                {selectedBowlerId === stat.id && (
                                                                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                                        <td colSpan={6} style={{ padding: '1rem', borderBottom: '1px solid var(--card-bg)' }}>
                                                                            <h4 style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pitch Map - {stat.name}</h4>
                                                                            <BowlingPitchMap balls={inning.balls} bowlerId={stat.id} />
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
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

                    {match.status === 'completed' && (() => {
                        const mvp = calculateMVP();
                        return (
                            <div className="card" style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--success-color)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                    Match Completed
                                    {match.innings[1] && match.innings[1].score > match.innings[0].score ?
                                        ` • ${getTeamName(match.innings[1].battingTeamId)} Won` :
                                        ` • ${getTeamName(match.innings[0].battingTeamId)} Won`}
                                </div>
                                {mvp && (() => {
                                    const mvpStats = calculatePlayerStats(matches, mvp.name);
                                    const mvpDetails = `${mvp.runs} R, ${mvp.wickets} W • ${mvp.points} Impact Pts`;
                                    return (
                                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <Trophy size={20} /> Player of the Match
                                            </div>
                                            <PlayerCard stats={mvpStats} isMVP={true} mvpDetails={mvpDetails} />
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                    <button className="btn" onClick={handleShare} disabled={isExporting} style={{ maxWidth: '300px' }}>
                        {isExporting ? 'Exporting...' : <><Download size={20} style={{ marginRight: '0.5rem' }} /> Export as Image</>}
                    </button>
                    {match.status === 'completed' && (
                        <button className="btn" onClick={handleAIGenerate} style={{ maxWidth: '300px', background: 'var(--accent-color)', color: 'var(--bg-color)' }}>
                            <Sparkles size={20} style={{ marginRight: '0.5rem' }} /> AI Match Report
                        </button>
                    )}
                </div>
            </div>

            {showAIInsights && (
                <AIInsights prompt={aiPrompt} onClose={() => setShowAIInsights(false)} />
            )}

            <div style={{ paddingBottom: '2rem' }}>
                <AdBanner dataAdSlot="2222222222" />
            </div>
        </div>
    );
}
