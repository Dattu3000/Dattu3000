import React from 'react';
import type { Ball } from '../types';

interface WagonWheelProps {
    balls: Ball[];
    batsmanId: string;
}

export const WagonWheel: React.FC<WagonWheelProps> = ({ balls, batsmanId }) => {
    // Filter balls for this specific batsman that have runs off the bat > 0 and a shotRegion
    const scoringShots = balls.filter(b => b.batsmanId === batsmanId && b.runs > 0 && b.shotRegion);

    if (scoringShots.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.8rem' }}>
                No spatial data recorded
            </div>
        );
    }

    // SVG plotting logic
    // We treat the center of the SVG (100, 100) as the pitch/batsman block hole
    // Top is North (0 degrees), Right is East (90 degrees), etc.

    // Mapping abstract regions to approximate angles
    // Assuming right-handed batsman facing Bottom-to-Top (Top = Straight, Bottom = Behind wickets)
    // Third Man: ~225 deg
    // Point: ~270 deg
    // Cover: ~315 deg
    // Mid Off: ~345 deg
    // Mid On: ~15 deg
    // Mid Wicket: ~45 deg
    // Square Leg: ~90 deg
    // Fine Leg: ~135 deg

    const regionAngles: Record<string, number> = {
        'Third Man': 225,
        'Point': 270,
        'Cover': 315,
        'Mid Off': 345,
        'Mid On': 15,
        'Mid Wicket': 45,
        'Square Leg': 90,
        'Fine Leg': 135
    };

    const getLineColor = (runs: number) => {
        if (runs === 6) return '#ef233c'; // Red for 6s
        if (runs === 4) return '#f77f00'; // Orange for 4s
        return '#4cc9f0'; // Light blue for 1s, 2s, 3s
    };

    const getLineLength = (runs: number) => {
        if (runs === 6) return 90; // Over the boundary
        if (runs === 4) return 80; // To the boundary
        return 40 + (runs * 10); // Inside the circle
    };

    return (
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%">
                {/* Field Background */}
                <circle cx="100" cy="100" r="95" fill="#1b263b" stroke="var(--text-secondary)" strokeWidth="1" />

                {/* 30 Yard Circle (Inner Circle) */}
                <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />

                {/* Pitch representation */}
                <rect x="95" y="80" width="10" height="40" fill="#e6c280" />

                {/* Plot the shots */}
                {scoringShots.map((shot, idx) => {
                    const angleDeg = regionAngles[shot.shotRegion as string] || 0;

                    // Add slight random jitter to angle (-10 to +10 degrees) so lines don't perfectly overlap
                    // Seed the random based on the ball ID so it doesn't flicker on re-renders ideally,
                    // but for simplicity math.random is okay for this lightweight visual
                    const pseudoRandom = (parseInt(shot.id.replace(/\D/g, '').slice(0, 5)) % 20) - 10 || 0;
                    const finalAngleDeg = angleDeg + pseudoRandom;

                    const angleRad = (finalAngleDeg - 90) * (Math.PI / 180); // SVG 0 is East, so subtract 90 to make 0 North

                    const length = getLineLength(shot.runs);
                    const x2 = 100 + (length * Math.cos(angleRad));
                    const y2 = 100 + (length * Math.sin(angleRad));

                    return (
                        <line
                            key={`shot-${idx}`}
                            x1="100" y1="100"
                            x2={x2} y2={y2}
                            stroke={getLineColor(shot.runs)}
                            strokeWidth={shot.runs >= 4 ? "3" : "2"}
                            opacity="0.8"
                            strokeLinecap="round"
                        />
                    );
                })}
            </svg>
        </div>
    );
};
