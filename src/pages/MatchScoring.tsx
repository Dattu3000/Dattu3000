import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match, Ball, ExtraType, WicketType, ShotRegion } from '../types';
import { ArrowLeft, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BoundaryPopup } from '../components/BoundaryPopup';
import { FieldGraphic } from '../components/FieldGraphic';

export default function MatchScoring() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [matches, setMatches] = useLocalStorage<Match[]>('cricket_matches', []);

    const matchIndex = matches.findIndex(m => m.id === id);
    const match = matches[matchIndex];

    // If match not found, redirect (or not loaded yet)
    useEffect(() => {
        if (matches.length > 0 && !match) {
            navigate('/');
        }
    }, [match, matches, navigate]);

    if (!match) return <div className="container">Loading...</div>;

    const currentInning = match.innings[match.currentInning - 1];
    const battingTeam = match.teamA.id === currentInning.battingTeamId ? match.teamA : match.teamB;
    const bowlingTeam = match.teamA.id === currentInning.bowlingTeamId ? match.teamA : match.teamB;

    const striker = battingTeam.players.find(p => p.id === currentInning.strikerId);
    const nonStriker = battingTeam.players.find(p => p.id === currentInning.nonStrikerId);
    const bowler = bowlingTeam.players.find(p => p.id === currentInning.bowlerId);

    const editPlayerName = (teamId: string, playerId: string, currentName: string) => {
        const newName = window.prompt("Enter player name:", currentName);
        if (!newName || newName.trim() === '') return;

        const newMatches = [...matches];
        const newMatch = { ...match };
        const teamToEdit = newMatch.teamA.id === teamId ? newMatch.teamA : newMatch.teamB;

        const playerIndex = teamToEdit.players.findIndex(p => p.id === playerId);
        if (playerIndex >= 0) {
            teamToEdit.players[playerIndex].name = newName.trim();
            newMatches[matchIndex] = newMatch;
            setMatches(newMatches);
        }
    };

    const addBall = (runsOffBat: number, _isExtra: boolean = false, extraType: ExtraType = null, extraRuns: number = 0, isWicket: boolean = false, wicketType: WicketType = null, incomingBatterId?: string, incomingBatterName?: string, fielderId?: string, fielderName?: string, shotRegion?: ShotRegion) => {
        const isLegalDelivery = extraType !== 'wide' && extraType !== 'noBall';

        // Simplistic calculation for overs, normally handles 6 balls per over logic
        const currentOverBals = currentInning.totalBalls % 6;
        const currentOverIdx = Math.floor(currentInning.totalBalls / 6);

        const newMatches = [...matches];
        const newMatch = { ...match };
        const newInning = { ...currentInning };

        let finalFielderId = fielderId;
        if (fielderName && fielderName.trim()) {
            const nameTrim = fielderName.trim();
            const bowlTeam = newMatch.teamA.id === newInning.bowlingTeamId ? newMatch.teamA : newMatch.teamB;

            const existing = bowlTeam.players.find((p: any) => p.name.toLowerCase() === nameTrim.toLowerCase());
            if (existing) {
                finalFielderId = existing.id;
            } else {
                const isDefault = (n: string) => n.startsWith('Player A') || n.startsWith('Player B');
                const placeholder = bowlTeam.players.find((p: any) => isDefault(p.name));

                if (placeholder) {
                    placeholder.name = nameTrim;
                    finalFielderId = placeholder.id;
                } else {
                    const newId = uuidv4();
                    bowlTeam.players.push({ id: newId, name: nameTrim } as any);
                    finalFielderId = newId;
                }
            }
        }

        const newBall: Ball = {
            id: uuidv4(),
            inning: match.currentInning,
            over: currentOverIdx,
            ballNumber: isLegalDelivery ? currentOverBals + 1 : currentOverBals,
            batsmanId: currentInning.strikerId || '',
            bowlerId: currentInning.bowlerId || '',
            runs: runsOffBat,
            extraType,
            extraRuns,
            isWicket,
            wicketType,
            wicketBatsmanId: isWicket ? currentInning.strikerId || null : null,
            fielderId: finalFielderId,
            shotRegion,
            timestamp: Date.now(),
            isLegalDelivery
        };

        // Declarations moved to top of addBall logic
        newInning.score += (runsOffBat + extraRuns);
        if (isWicket) newInning.wickets += 1;
        if (isLegalDelivery) newInning.totalBalls += 1;
        newInning.oversCompleted = Math.floor(newInning.totalBalls / 6) + ((newInning.totalBalls % 6) / 10);
        newInning.balls = [...newInning.balls, newBall];

        if (isWicket && newInning.wickets < 10) {
            let nextStrikerId = incomingBatterId;

            if (incomingBatterName && incomingBatterName.trim()) {
                const nameTrim = incomingBatterName.trim();
                const bTeam = newMatch.teamA.id === newInning.battingTeamId ? newMatch.teamA : newMatch.teamB;

                const existing = bTeam.players.find((p: any) => p.name.toLowerCase() === nameTrim.toLowerCase());
                if (existing) {
                    nextStrikerId = existing.id;
                } else {
                    const isDefault = (n: string) => n.startsWith('Player A') || n.startsWith('Player B');
                    const outIds = newInning.balls.filter((b: any) => b.isWicket).map((b: any) => b.wicketBatsmanId);
                    const placeholder = bTeam.players.find((p: any) => isDefault(p.name) && !outIds.includes(p.id) && p.id !== currentInning.strikerId && p.id !== currentInning.nonStrikerId);

                    if (placeholder) {
                        placeholder.name = nameTrim;
                        nextStrikerId = placeholder.id;
                    } else {
                        const newId = uuidv4();
                        bTeam.players.push({ id: newId, name: nameTrim, isSubstitute: false } as any);
                        nextStrikerId = newId;
                    }
                }
            }

            // Fallback if no valid explicit batter given
            if (!nextStrikerId) {
                const bTeam = newMatch.teamA.id === newInning.battingTeamId ? newMatch.teamA : newMatch.teamB;
                const outIds = newInning.balls.filter((b: any) => b.isWicket).map((b: any) => b.wicketBatsmanId);
                const available = bTeam.players.find((p: any) => !outIds.includes(p.id) && p.id !== currentInning.strikerId && p.id !== currentInning.nonStrikerId);
                nextStrikerId = available?.id || bTeam.players[newInning.wickets + 1]?.id;
            }

            newInning.strikerId = nextStrikerId;
        }

        // Rotate strike if odd runs
        let totalRunsForStrikeRotation = runsOffBat;
        if (extraType === 'bye' || extraType === 'legBye') {
            totalRunsForStrikeRotation += extraRuns;
        } else if (extraType === 'wide') {
            totalRunsForStrikeRotation += Math.max(0, extraRuns - 1);
        }

        if (totalRunsForStrikeRotation % 2 !== 0) {
            const temp = newInning.strikerId;
            newInning.strikerId = newInning.nonStrikerId;
            newInning.nonStrikerId = temp;
        }

        // Rotate at end of over. Strike changes regardless of runs scored on the last ball.
        if (isLegalDelivery && newInning.totalBalls % 6 === 0) {
            // To properly rotate at end of over, we simply swap striker and non-striker.
            // Note: if the last ball had odd runs, it already swapped above. The end of over swap will swap them BACK.
            // Example: odd runs on last ball -> batsman A runs to non-striker. Then over ends -> batsman A becomes striker again for next over.
            // This IS the correct cricket rule.
            const tempStr = newInning.strikerId;
            newInning.strikerId = newInning.nonStrikerId;
            newInning.nonStrikerId = tempStr;
        }

        // Check if inning ended
        let status = match.status;
        let newCurrentInning = match.currentInning;

        if (newInning.wickets >= 10 || newInning.totalBalls >= match.overs * 6) {
            if (match.currentInning === 1) {
                newCurrentInning = 2;
            } else {
                status = 'completed';
            }
        }

        if (match.currentInning === 2) {
            const target = match.innings[0].score + 1;
            if (newInning.score >= target) {
                status = 'completed';
            }
        }

        newMatch.innings[match.currentInning - 1] = newInning;
        newMatch.status = status;
        newMatch.currentInning = newCurrentInning;

        newMatches[matchIndex] = newMatch;
        setMatches(newMatches);

        if (!isWicket && (runsOffBat === 4 || runsOffBat === 6)) {
            setBoundaryCelebration(runsOffBat as 4 | 6);
        }
    };

    const undoLastBall = () => {
        if (currentInning.balls.length === 0) return;

        const newMatches = [...matches];
        const newMatch = { ...match };
        const newInning = { ...currentInning };

        const lastBall = newInning.balls.pop()!;
        newInning.score -= (lastBall.runs + lastBall.extraRuns);
        if (lastBall.isWicket) newInning.wickets -= 1;
        if (lastBall.isLegalDelivery) newInning.totalBalls -= 1;
        newInning.oversCompleted = Math.floor(newInning.totalBalls / 6) + ((newInning.totalBalls % 6) / 10);

        newMatch.innings[match.currentInning - 1] = newInning;
        newMatches[matchIndex] = newMatch;
        setMatches(newMatches);
    };

    const currentRunRate = currentInning.totalBalls > 0
        ? (currentInning.score / (currentInning.totalBalls / 6)).toFixed(1)
        : '0.0';

    let requiredRunRate = '0.0';
    let targetScore = 0;
    if (match.currentInning === 2) {
        targetScore = match.innings[0].score + 1;
        const ballsRemaining = (match.overs * 6) - currentInning.totalBalls;
        requiredRunRate = ballsRemaining > 0
            ? ((targetScore - currentInning.score) / (ballsRemaining / 6)).toFixed(1)
            : '0.0';
    }

    // Calculate Last 6 Balls
    const lastBalls = currentInning.balls.slice(-6).map(b => {
        let str = b.runs.toString();
        if (b.extraType === 'wide') {
            const wdr = b.extraRuns + b.runs - 1;
            str = wdr > 0 ? `1WD+${wdr}` : `1WD`;
        } else if (b.extraType === 'noBall') {
            const nbr = b.extraRuns + b.runs - 1;
            str = nbr > 0 ? `1NB+${nbr}` : `1NB`;
        } else if (b.extraType === 'bye') {
            const br = b.extraRuns + b.runs - 1; // base runs used is 1, so subtract 1
            str = br > 0 ? `1B+${br}` : `1B`;
        } else if (b.extraType === 'legBye') {
            const lbr = b.extraRuns + b.runs - 1;
            str = lbr > 0 ? `1LB+${lbr}` : `1LB`;
        }
        if (b.isWicket) str = 'W';
        return { id: b.id, label: str };
    });

    const [extraPrompt, setExtraPrompt] = useState<{ type: ExtraType, baseRuns: number } | null>(null);
    const [wicketFlow, setWicketFlow] = useState<{ step: 'type' | 'fielder' | 'batter', type?: WicketType, runs?: number, fielderId?: string, fielderName?: string } | null>(null);
    const [boundaryCelebration, setBoundaryCelebration] = useState<4 | 6 | null>(null);
    const [shotPrompt, setShotPrompt] = useState<{ runs: number } | null>(null);

    const handleExtraClick = (type: ExtraType, baseRuns: number) => {
        setExtraPrompt({ type, baseRuns });
    };

    const submitExtra = (runsChosen: number) => {
        if (!extraPrompt) return;

        if (extraPrompt.type === 'bye' || extraPrompt.type === 'legBye' || extraPrompt.type === 'wide' || extraPrompt.type === 'noBall') {
            // For all extras, log base penalty as extraRuns (1) and runsChosen as bat runs
            // This treats byes exactly like wides (e.g. 1 base bye + N runs chosen)
            addBall(runsChosen, true, extraPrompt.type, extraPrompt.baseRuns);
        }

        setExtraPrompt(null);
    };

    // Mandatory Names Dialog Logic
    // We need to know if it's the start of the innings, or start of a new over.
    const [needsNames, setNeedsNames] = useState<{ type: 'innings' | 'over', strikerId?: string, nonStrikerId?: string, bowlerId?: string } | null>(null);

    useEffect(() => {
        if (!match || match.status === 'completed') return;

        const inning = match.innings[match.currentInning - 1];
        const bTeam = match.teamA.id === inning.battingTeamId ? match.teamA : match.teamB;
        const bowlTeam = match.teamA.id === inning.bowlingTeamId ? match.teamA : match.teamB;

        let striker = bTeam.players.find(p => p.id === inning.strikerId);
        let nonStriker = bTeam.players.find(p => p.id === inning.nonStrikerId);
        let currentBowler = bowlTeam.players.find(p => p.id === inning.bowlerId);

        // Check if names are still default "Player XX"
        const isDefault = (name: string) => name.startsWith('Player A') || name.startsWith('Player B');

        // Check 1: Start of Inning
        if (inning.totalBalls === 0 && inning.balls.length === 0) {
            if (striker && isDefault(striker.name) && !needsNames) {
                setNeedsNames({ type: 'innings', strikerId: striker.id, nonStrikerId: nonStriker?.id, bowlerId: currentBowler?.id });
                return; // Prioritize this prompt
            }
        }

        // Check 2: Start of New Over
        if (inning.totalBalls > 0 && inning.totalBalls % 6 === 0) {
            // Ensure the last ball of the over was actually a legal delivery that completed the over
            // AND ensure we are not at the end of the inning (match.overs * 6)
            const lastBallInfo = inning.balls[inning.balls.length - 1];
            if (lastBallInfo.isLegalDelivery && inning.totalBalls < match.overs * 6 && !needsNames) {
                // The current bowler id has been auto-rotated by basic logic or is still default.
                // We ALWAYS prompt for the new bowler at the start of an over unless they explicitly set it.
                // Actually, the simplest check is: do we have a new bowler for this over?
                // The MVP logic in addBall just left the bowlerId the same. 
                // Let's force a prompt every over by checking a custom over flag, or simply if the current bowler hasn't bowled THIS over yet.
                // But easier: check if the 'bowlerId' in state is default. We haven't changed the bowlerId on over change in addBall!
                // Wait, if we don't change it, the user has to manually tap to edit. 
                // Let's force a prompt for bowler by injecting a "new bowler needed" state.

                // Let's see if the *last* ball was bowled by the *current* bowlerId. 
                // If so, it means the bowler hasn't been changed yet for the new over.
                if (lastBallInfo.bowlerId === inning.bowlerId) {
                    setNeedsNames({ type: 'over', bowlerId: inning.bowlerId });
                    return;
                }
            }
        }
    }, [match, needsNames]);

    const handleNamesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newMatches = [...matches];
        const newMatch = { ...match };
        const inning = newMatch.innings[newMatch.currentInning - 1];
        const bTeam = newMatch.teamA.id === inning.battingTeamId ? newMatch.teamA : newMatch.teamB;
        const bowlTeam = newMatch.teamA.id === inning.bowlingTeamId ? newMatch.teamA : newMatch.teamB;

        const replaceOrFindPlayer = (team: any, nameVal: string, currentId?: string, isNewRole: boolean = false): string | undefined => {
            if (!nameVal) return currentId;
            const nameTrim = nameVal.trim();
            if (!nameTrim) return currentId;

            if (isNewRole) {
                // Find existing by name to reuse (e.g. bowler comes back for another spell)
                const existing = team.players.find((p: any) => p.name.toLowerCase() === nameTrim.toLowerCase());
                if (existing) return existing.id;

                // If not found, find an unused default placeholder
                const isDefault = (n: string) => n.startsWith('Player A') || n.startsWith('Player B');
                const placeholder = team.players.find((p: any) => isDefault(p.name));
                if (placeholder) {
                    placeholder.name = nameTrim;
                    return placeholder.id;
                }

                // Fallback (only if team uses > 11 players for some reason)
                const newId = uuidv4();
                team.players.push({ id: newId, name: nameTrim });
                return newId;
            } else {
                // Just rename existing
                const p = team.players.find((p: any) => p.id === currentId);
                if (p) p.name = nameTrim;
                return currentId;
            }
        };

        if (needsNames?.type === 'innings') {
            inning.strikerId = replaceOrFindPlayer(bTeam, formData.get('strikerName') as string, needsNames.strikerId, false);
            inning.nonStrikerId = replaceOrFindPlayer(bTeam, formData.get('nonStrikerName') as string, needsNames.nonStrikerId, false);
            inning.bowlerId = replaceOrFindPlayer(bowlTeam, formData.get('bowlerName') as string, needsNames.bowlerId, false);
        } else if (needsNames?.type === 'over') {
            // Over: Need to allocate a NEW bowler, don't rename the one who just bowled!
            inning.bowlerId = replaceOrFindPlayer(bowlTeam, formData.get('bowlerName') as string, needsNames.bowlerId, true);
        }

        newMatches[matchIndex] = newMatch;
        setMatches(newMatches);
        setNeedsNames(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div className="header" style={{ justifyContent: 'space-between' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="header-title">{battingTeam.name} vs {bowlingTeam.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Innings {match.currentInning} • {match.overs} Overs Match
                    </span>
                </div>
                <button
                    onClick={() => navigate(`/scorecard/${match.id}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}
                    title="View Scorecard"
                >
                    <FileText size={24} />
                </button>
            </div>

            <div className="container" style={{ paddingBottom: '0', overflowY: 'auto' }}>

                {/* Score Board */}
                <div className="card" style={{ textAlign: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--card-bg)' }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                        {currentInning.score}
                        <span style={{ fontSize: '2rem', color: 'var(--danger-color)', margin: '0 5px' }}>/</span>
                        {currentInning.wickets}
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Overs: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{currentInning.oversCompleted.toFixed(1)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <div>CRR: <span style={{ color: 'var(--text-primary)' }}>{currentRunRate}</span></div>
                        {match.currentInning === 2 && (
                            <>
                                <div>Target: <span style={{ color: 'var(--text-primary)' }}>{targetScore}</span></div>
                                <div>RRR: <span style={{ color: 'var(--text-primary)' }}>{requiredRunRate}</span></div>
                            </>
                        )}
                    </div>
                </div>

                {/* This Over Strip */}
                <div className="card" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>This Over:</span>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
                        {lastBalls.length === 0 && <span style={{ color: 'var(--card-bg)' }}>-</span>}
                        {lastBalls.map(b => (
                            <div
                                key={b.id}
                                style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    backgroundColor: b.label === 'W' ? 'var(--danger-color)' : 'var(--card-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                            >
                                {b.label}
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                        onClick={undoLastBall}
                        disabled={currentInning.balls.length === 0}
                    >
                        Undo
                    </button>
                </div>

                {/* Players Area */}
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Batters (Tap to edit)</div>
                        {striker && (
                            <div
                                style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--accent-color)' }}
                                onClick={() => editPlayerName(battingTeam.id, striker.id, striker.name)}
                            >
                                {striker.name} *
                            </div>
                        )}
                        {nonStriker && (
                            <div
                                style={{ color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.2rem' }}
                                onClick={() => editPlayerName(battingTeam.id, nonStriker.id, nonStriker.name)}
                            >
                                {nonStriker.name}
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Bowler (Tap to edit)</div>
                        {bowler && (
                            <div
                                style={{ fontWeight: 'bold', cursor: 'pointer' }}
                                onClick={() => editPlayerName(bowlingTeam.id, bowler.id, bowler.name)}
                            >
                                {bowler.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlays */}
            {extraPrompt && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>
                            {extraPrompt.type === 'noBall' ? 'Add runs off bat for NO BALL'
                                : extraPrompt.type === 'wide' ? 'Add extra runs for WIDE'
                                    : `How many runs for ${extraPrompt.type?.toUpperCase()}?`}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                            {[0, 1, 2, 3, 4, 5, 6].map(r => (
                                <button key={r} className="btn" onClick={() => submitExtra(r)}>{r}</button>
                            ))}
                        </div>
                        <button className="btn btn-secondary" onClick={() => setExtraPrompt(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {wicketFlow?.step === 'type' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>How did the wicket fall?</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                            {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map(wType => (
                                <button key={wType} className="btn" onClick={() => {
                                    let wt: WicketType = 'bowled';
                                    if (wType === 'Caught') wt = 'caught';
                                    if (wType === 'LBW') wt = 'lbw';
                                    if (wType === 'Run Out') wt = 'runOut';
                                    if (wType === 'Stumped') wt = 'stumped';
                                    if (wType === 'Hit Wicket') wt = 'hitWicket';

                                    if (wt === 'caught' || wt === 'runOut' || wt === 'stumped') {
                                        setWicketFlow({ step: 'fielder', type: wt, runs: 0 });
                                    } else {
                                        setWicketFlow({ step: 'batter', type: wt, runs: 0 });
                                    }
                                }}>{wType}</button>
                            ))}
                        </div>
                        <button className="btn btn-secondary" onClick={() => setWicketFlow(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {wicketFlow?.step === 'fielder' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <form className="card" style={{ width: '90%', maxWidth: '400px' }} onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const selectedFielderId = formData.get('existingFielder') as string;
                        const newFielderName = formData.get('newFielderName') as string;

                        setWicketFlow({ step: 'batter', type: wicketFlow.type, runs: 0, fielderId: selectedFielderId, fielderName: newFielderName });
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--danger-color)', textAlign: 'center' }}>
                            {wicketFlow.type === 'caught' ? 'Who Caught it?' : wicketFlow.type === 'stumped' ? 'Who Stumped it?' : 'Who did the Run Out?'}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Select Fielder:</label>
                            <select name="existingFielder" className="form-input" defaultValue="">
                                <option value="" disabled>Select fielder</option>
                                {bowlingTeam.players.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>OR</div>

                        <div className="form-group">
                            <label className="form-label">Enter New Name (e.g. Sub):</label>
                            <input name="newFielderName" className="form-input" placeholder="e.g. Sub Fielder" />
                        </div>

                        <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>Next</button>
                        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setWicketFlow(null)}>Cancel</button>
                    </form>
                </div>
            )}

            {wicketFlow?.step === 'batter' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <form className="card" style={{ width: '90%', maxWidth: '400px' }} onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const selectedBatterId = formData.get('existingBatter') as string;
                        const newBatterName = formData.get('newBatterName') as string;

                        addBall(0, false, null, 0, true, wicketFlow.type, selectedBatterId, newBatterName, wicketFlow.fielderId, wicketFlow.fielderName);
                        setWicketFlow(null);
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--danger-color)', textAlign: 'center' }}>Incoming Batter</h3>

                        <div className="form-group">
                            <label className="form-label">Select from Roster:</label>
                            <select name="existingBatter" className="form-input" defaultValue="">
                                <option value="" disabled>Select next batter</option>
                                {(() => {
                                    const outIds = currentInning.balls.filter(b => b.isWicket).map(b => b.wicketBatsmanId);
                                    const available = battingTeam.players.filter(p => !outIds.includes(p.id) && p.id !== currentInning.strikerId && p.id !== currentInning.nonStrikerId);
                                    return available.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ));
                                })()}
                            </select>
                        </div>

                        <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>OR</div>

                        <div className="form-group">
                            <label className="form-label">Enter New Name:</label>
                            <input name="newBatterName" className="form-input" placeholder="e.g. MS Dhoni" />
                        </div>

                        <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>Confirm Wicket</button>
                        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setWicketFlow(null)}>Cancel</button>
                    </form>
                </div>
            )}

            {needsNames && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <form className="card" style={{ width: '90%', maxWidth: '400px' }} onSubmit={handleNamesSubmit}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)', textAlign: 'center' }}>
                            {needsNames.type === 'innings' && 'Start of Innings'}
                            {needsNames.type === 'over' && 'New Over Start'}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
                            Please enter the names of the active players.
                        </p>

                        {needsNames.strikerId && (
                            <div className="form-group">
                                <label className="form-label">Striker Name</label>
                                <input name="strikerName" className="form-input" required autoFocus />
                            </div>
                        )}
                        {needsNames.nonStrikerId && (
                            <div className="form-group">
                                <label className="form-label">Non-Striker Name</label>
                                <input name="nonStrikerName" className="form-input" required />
                            </div>
                        )}
                        {needsNames.bowlerId && (
                            <div className="form-group">
                                <label className="form-label">Bowler Name</label>
                                <input name="bowlerName" className="form-input" required autoFocus />
                            </div>
                        )}

                        <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>Start</button>
                    </form>
                </div>
            )}

            {boundaryCelebration && (
                <BoundaryPopup type={boundaryCelebration} onClose={() => setBoundaryCelebration(null)} />
            )}

            {shotPrompt && (
                <FieldGraphic
                    onSelectZone={(region) => {
                        addBall(shotPrompt.runs, false, null, 0, false, null, undefined, undefined, undefined, undefined, region);
                        setShotPrompt(null);
                    }}
                    onSkip={() => {
                        addBall(shotPrompt.runs);
                        setShotPrompt(null);
                    }}
                />
            )}

            {/* Control Panel (Fixed Bottom) */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                padding: '1rem',
                marginTop: 'auto',
                boxShadow: '0 -4px 10px rgba(0,0,0,0.2)'
            }}>
                {match.status === 'completed' ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <h2 style={{ color: 'var(--accent-color)' }}>Match Completed!</h2>
                        <button className="btn" onClick={() => navigate(`/scorecard/${match.id}`)} style={{ marginTop: '1rem' }}>
                            View Scorecard
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {[0, 1, 2, 3, 4, 6].map(runs => (
                                <button
                                    key={runs}
                                    className="btn"
                                    style={{ padding: '1.2rem 0', fontSize: '1.5rem', gridColumn: runs === 0 ? 'span 2' : 'span 1' }}
                                    onClick={() => {
                                        if (runs > 0) {
                                            setShotPrompt({ runs });
                                        } else {
                                            addBall(runs);
                                        }
                                    }}
                                >
                                    {runs}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.8rem 0' }} onClick={() => handleExtraClick('wide', 1)}>WD</button>
                            <button className="btn btn-secondary" style={{ padding: '0.8rem 0' }} onClick={() => handleExtraClick('noBall', 1)}>NB</button>
                            <button className="btn btn-secondary" style={{ padding: '0.8rem 0' }} onClick={() => handleExtraClick('bye', 1)}>B</button>
                            <button className="btn btn-secondary" style={{ padding: '0.8rem 0' }} onClick={() => handleExtraClick('legBye', 1)}>LB</button>
                            <button className="btn btn-danger" style={{ gridColumn: 'span 4', padding: '1rem 0', fontSize: '1.2rem' }} onClick={() => setWicketFlow({ step: 'type' })}>
                                WICKET
                            </button>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
