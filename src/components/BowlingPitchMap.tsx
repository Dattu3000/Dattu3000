import React from 'react';
import type { Ball } from '../types';

interface BowlingPitchMapProps {
    balls: Ball[];
    bowlerId: string;
}

export const BowlingPitchMap: React.FC<BowlingPitchMapProps> = ({ balls, bowlerId }) => {
    // Filter legal deliveries for this bowler that have pitch coordinates
    const bowlerBalls = balls.filter(b => b.bowlerId === bowlerId && b.isLegalDelivery && b.pitchX !== undefined && b.pitchY !== undefined);

    if (bowlerBalls.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.8rem' }}>
                No pitch data recorded
            </div>
        );
    }

    const getColor = (runs: number, isWicket: boolean) => {
        if (isWicket) return '#ef233c'; // Red for wickets
        if (runs >= 4) return '#f77f00'; // Orange for boundaries
        if (runs === 0) return '#a8dadc'; // Light for dots
        return '#4cc9f0'; // Blue for scoring shots
    };

    return (
        <div style={{ position: 'relative', width: '120px', height: '260px', margin: '0 auto' }}>
            <div style={{
                position: 'relative',
                width: '100%', height: '100%',
                backgroundColor: '#e6c280', // Pitch color
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                {/* Bowling Crease (Top) */}
                <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, height: '2px', backgroundColor: 'rgba(255,255,255,0.8)' }}></div>
                {/* Batting Crease (Bottom) */}
                <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, height: '2px', backgroundColor: 'rgba(255,255,255,0.8)' }}></div>

                {/* Stumps Top */}
                <div style={{ position: 'absolute', top: '2%', left: '45%', width: '10%', height: '4px', backgroundColor: 'rgba(255,255,255,0.9)' }}></div>
                {/* Stumps Bottom */}
                <div style={{ position: 'absolute', bottom: '2%', left: '45%', width: '10%', height: '4px', backgroundColor: 'rgba(255,255,255,0.9)' }}></div>
                
                {/* Length zones (Visual only) */}
                <div style={{ position: 'absolute', top: '30%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                <div style={{ position: 'absolute', top: '70%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>

                {/* Plot the balls */}
                {bowlerBalls.map(ball => {
                    const cx = ball.pitchX! * 100;
                    const cy = ball.pitchY! * 100;

                    return (
                        <div
                            key={ball.id}
                            style={{
                                position: 'absolute',
                                left: `${cx}%`,
                                top: `${cy}%`,
                                transform: 'translate(-50%, -50%)',
                                width: ball.isWicket ? '10px' : '8px',
                                height: ball.isWicket ? '10px' : '8px',
                                backgroundColor: getColor(ball.runs, ball.isWicket),
                                borderRadius: ball.isWicket ? '2px' : '50%',
                                border: '1px solid rgba(0,0,0,0.5)',
                                zIndex: ball.isWicket ? 10 : 5,
                                opacity: 0.9
                            }}
                            title={`Runs: ${ball.runs}${ball.isWicket ? ' (W)' : ''}`}
                        />
                    );
                })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}><span style={{ color: '#ef233c' }}>■</span> Wicket</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}><span style={{ color: '#f77f00' }}>●</span> 4s/6s</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}><span style={{ color: '#a8dadc' }}>●</span> Dot</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}><span style={{ color: '#4cc9f0' }}>●</span> Run</span>
            </div>
        </div>
    );
};
