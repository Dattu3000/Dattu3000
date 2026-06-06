import React, { useState } from 'react';
import { CloudRain } from 'lucide-react';

interface DLSCalculatorProps {
    initialOvers: number;
    team1Score: number;
    team1OversFaced: number;
    onClose: () => void;
}

export const DLSCalculator: React.FC<DLSCalculatorProps> = ({ initialOvers, team1Score, team1OversFaced, onClose }) => {
    const [team2Overs, setTeam2Overs] = useState<number>(initialOvers);

    // Simplified DLS Resource Approximation
    // True DLS is proprietary, this uses a generic resource scaling algorithm common in club cricket.
    const calculateRevisedTarget = () => {
        if (team1Score === 0) return 0;
        
        // Resource scaling based on overs
        // If team 2 gets fewer overs than team 1 actually faced, their target is scaled down
        const runRate = team1Score / team1OversFaced;
        
        let revisedScore = runRate * team2Overs;
        
        // Add a "chasing" penalty/bonus based on the reduction severity (common in local formulas)
        if (team2Overs < team1OversFaced) {
            const reductionRatio = team2Overs / team1OversFaced;
            // The fewer overs they have, the higher the required run rate should be compared to Team 1
            revisedScore = revisedScore * (1 + (1 - reductionRatio) * 0.1); 
        }

        return Math.floor(revisedScore) + 1;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '400px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--accent-color)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', marginBottom: '1.5rem', justifyContent: 'center' }}>
                    <CloudRain size={24} />
                    DLS Par Score Calculator
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>First Innings Score</span>
                        <span style={{ fontWeight: 'bold' }}>{team1Score}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>First Innings Overs</span>
                        <span style={{ fontWeight: 'bold' }}>{team1OversFaced}</span>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-primary)' }}>Revised Overs for Team 2</label>
                        <input
                            type="number"
                            className="form-input"
                            value={team2Overs}
                            onChange={(e) => setTeam2Overs(Number(e.target.value))}
                            min="1"
                            max={initialOvers}
                            step="1"
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1.5rem', backgroundColor: 'rgba(247, 127, 0, 0.1)', borderRadius: '12px', border: '1px dashed var(--accent-color)' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Revised Target</div>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-color)', lineHeight: 1 }}>
                            {calculateRevisedTarget()}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Required RR: {(calculateRevisedTarget() / team2Overs).toFixed(2)}
                        </div>
                    </div>
                </div>

                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }} onClick={onClose}>
                    Close Calculator
                </button>
            </div>
        </div>
    );
};
