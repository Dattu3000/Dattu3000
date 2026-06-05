import React, { useRef } from 'react';
import type { ShotRegion } from '../types';

interface ShotTrackerModalProps {
    onSelectCoordinates: (x: number, y: number, region: ShotRegion) => void;
    onSkip: () => void;
}

export const ShotTrackerModal: React.FC<ShotTrackerModalProps> = ({ onSelectCoordinates, onSkip }) => {
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!fieldRef.current) return;
        
        const rect = fieldRef.current.getBoundingClientRect();
        // Calculate relative coordinates 0 to 1
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // Approximate region based on angle from center
        const dx = x - 0.5;
        const dy = y - 0.5;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Map angle to ShotRegion (approximate, 0 is right/point, -90 is top/third man depending on orientation)
        // Let's assume batter is at bottom (y > 0.5) hitting upwards (y < 0.5)
        // Center of pitch is 0.5, 0.5. Top is 0, bottom is 1.
        let region: ShotRegion = null;
        
        if (dx > 0 && dy < 0) {
            if (angle > -45) region = 'Point';
            else region = 'Third Man';
        } else if (dx < 0 && dy < 0) {
            if (angle < -135) region = 'Square Leg';
            else region = 'Fine Leg';
        } else if (dx < 0 && dy > 0) {
            if (angle > 135) region = 'Mid Wicket';
            else region = 'Mid On';
        } else {
            if (angle < 45) region = 'Cover';
            else region = 'Mid Off';
        }

        onSelectCoordinates(x, y, region);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Tap where the ball was hit
            </h3>

            <div 
                ref={fieldRef}
                onClick={handleFieldClick}
                style={{
                    position: 'relative',
                    width: '320px', height: '320px',
                    borderRadius: '50%',
                    backgroundColor: '#2e7d32', // Grass green field
                    border: '4px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'crosshair',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* 30 Yard Circle */}
                <div style={{
                    position: 'absolute', width: '180px', height: '180px',
                    borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)',
                    pointerEvents: 'none'
                }}></div>

                {/* Pitch */}
                <div style={{
                    position: 'absolute', width: '20px', height: '60px',
                    backgroundColor: '#e6c280', // Pitch color
                    pointerEvents: 'none'
                }}></div>

                {/* Stumps */}
                <div style={{ position: 'absolute', width: '10px', height: '2px', backgroundColor: '#fff', top: '128px' }}></div>
                <div style={{ position: 'absolute', width: '10px', height: '2px', backgroundColor: '#fff', bottom: '128px' }}></div>
                
                {/* Batting Direction Indicator */}
                <div style={{ position: 'absolute', bottom: '110px', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                    ▼ Batter ▼
                </div>
            </div>

            <button
                className="btn btn-secondary"
                style={{ marginTop: '2rem', width: '200px' }}
                onClick={onSkip}
            >
                Skip / Unknown
            </button>
        </div>
    );
};
