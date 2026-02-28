import React, { useEffect } from 'react';
import './BoundaryPopup.css';

interface BoundaryPopupProps {
    type: 4 | 6;
    onClose: () => void;
}

export const BoundaryPopup: React.FC<BoundaryPopupProps> = ({ type, onClose }) => {
    useEffect(() => {
        // Auto-close after 1.5 second to match animation
        const timer = setTimeout(() => {
            onClose();
        }, 1500);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Simple geometric batsman silhouette matching the cyan color in reference
    const batsmanSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="%2300bfff" d="M50,15 A8,8 0 1,1 66,15 A8,8 0 1,1 50,15 Z M60,25 C75,25 70,50 70,50 L80,90 L65,90 L60,60 L50,90 L35,90 L45,55 C40,40 50,25 60,25 Z M70,35 L90,15 L95,20 L75,40 Z"/></svg>`;

    return (
        <div className="boundary-overlay">
            <div className={`boundary-card type-${type}`}>
                <div className="burst-bg"></div>

                <div className="boundary-content">
                    <div className="giant-number">{type}</div>

                    <div className="batsman-silhouette">
                        <div className="yellow-sunburst"></div>
                        <img
                            src={batsmanSvg}
                            alt="batsman"
                            className="batsman-img"
                        />
                    </div>
                </div>

                <div className="boundary-text">{type === 6 ? 'SIX' : 'FOUR'}</div>
            </div>
        </div>
    );
};
