import React, { useRef } from 'react';

interface PitchMapModalProps {
    onSelectCoordinates: (x: number, y: number) => void;
    onSkip: () => void;
}

export const PitchMapModal: React.FC<PitchMapModalProps> = ({ onSelectCoordinates, onSkip }) => {
    const pitchRef = useRef<HTMLDivElement>(null);

    const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!pitchRef.current) return;
        
        const rect = pitchRef.current.getBoundingClientRect();
        // Calculate relative coordinates 0 to 1
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        onSelectCoordinates(x, y);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Where did the ball pitch?
            </h3>

            <div style={{ position: 'relative', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '12px' }}>
                <div 
                    ref={pitchRef}
                    onClick={handlePitchClick}
                    style={{
                        position: 'relative',
                        width: '160px', height: '360px',
                        backgroundColor: '#e6c280', // Pitch color
                        border: '2px solid #fff',
                        cursor: 'crosshair',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Bowling Crease (Top) */}
                    <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, height: '2px', backgroundColor: '#fff', opacity: 0.6 }}></div>
                    {/* Batting Crease (Bottom) */}
                    <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, height: '2px', backgroundColor: '#fff', opacity: 0.6 }}></div>

                    {/* Stumps Top */}
                    <div style={{ position: 'absolute', top: '2%', left: '45%', width: '10%', height: '4px', backgroundColor: '#fff' }}></div>
                    {/* Stumps Bottom */}
                    <div style={{ position: 'absolute', bottom: '2%', left: '45%', width: '10%', height: '4px', backgroundColor: '#fff' }}></div>
                    
                    {/* Zones lines (Visual only) */}
                    <div style={{ position: 'absolute', top: '0', bottom: '0', left: '33%', width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                    <div style={{ position: 'absolute', top: '0', bottom: '0', left: '66%', width: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                    
                    {/* Length lines */}
                    <div style={{ position: 'absolute', top: '30%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                    <div style={{ position: 'absolute', top: '70%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>

                    <div style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                        Batter
                    </div>
                    <div style={{ position: 'absolute', top: '-25px', left: 0, right: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                        Bowler
                    </div>
                </div>
            </div>

            <button
                className="btn btn-secondary"
                style={{ marginTop: '2.5rem', width: '200px' }}
                onClick={onSkip}
            >
                Skip / Unknown
            </button>
        </div>
    );
};
