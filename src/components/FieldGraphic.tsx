import React from 'react';
import type { ShotRegion } from '../types';

interface FieldGraphicProps {
    onSelectZone: (region: ShotRegion) => void;
    onSkip: () => void;
}

export const FieldGraphic: React.FC<FieldGraphicProps> = ({ onSelectZone, onSkip }) => {

    // Abstract representation of an 8-zone cricket field
    const zones: { id: ShotRegion; label: string; transform: string }[] = [
        { id: 'Third Man', label: 'Third Man', transform: 'rotate(-45deg) translate(0, -100px) rotate(45deg)' },
        { id: 'Point', label: 'Point', transform: 'rotate(-90deg) translate(0, -90px) rotate(90deg)' },
        { id: 'Cover', label: 'Cover', transform: 'rotate(-135deg) translate(0, -100px) rotate(135deg)' },
        { id: 'Mid Off', label: 'Mid Off', transform: 'rotate(-165deg) translate(0, -110px) rotate(165deg)' },
        { id: 'Mid On', label: 'Mid On', transform: 'rotate(165deg) translate(0, -110px) rotate(-165deg)' },
        { id: 'Mid Wicket', label: 'Mid Wicket', transform: 'rotate(135deg) translate(0, -100px) rotate(-135deg)' },
        { id: 'Square Leg', label: 'Square Leg', transform: 'rotate(90deg) translate(0, -90px) rotate(-90deg)' },
        { id: 'Fine Leg', label: 'Fine Leg', transform: 'rotate(45deg) translate(0, -100px) rotate(-45deg)' },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Where was it hit?</h3>

            <div style={{
                position: 'relative',
                width: '320px', height: '320px',
                borderRadius: '50%',
                backgroundColor: '#2e7d32', // Grass green field
                border: '4px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
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

                {/* Zones Overlay */}
                {zones.map(zone => (
                    <button
                        key={zone.id}
                        onClick={() => onSelectZone(zone.id)}
                        style={{
                            position: 'absolute',
                            width: '80px', height: '40px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #ccc',
                            borderRadius: '20px',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transform: zone.transform,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                            transition: 'transform 0.1s, background-color 0.2s'
                        }}
                    >
                        {zone.label}
                    </button>
                ))}
            </div>

            <button
                className="btn btn-secondary"
                style={{ marginTop: '3rem', width: '200px' }}
                onClick={onSkip}
            >
                Skip / Unknown
            </button>
        </div>
    );
};
