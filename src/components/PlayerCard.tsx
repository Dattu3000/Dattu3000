import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2 } from 'lucide-react';
import type { PlayerStats } from '../utils/statsUtils';

interface PlayerCardProps {
    stats: PlayerStats;
    imageUrl?: string;
    isMVP?: boolean;
    mvpDetails?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ stats, imageUrl, isMVP, mvpDetails }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        
        try {
            // Small timeout to ensure rendering is complete
            await new Promise(res => setTimeout(res, 100));
            const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: '#0d1b2a' });
            
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                const fileName = `${stats.name.replace(/\s+/g, '_')}_Card.png`;
                
                if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
                    try {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        await navigator.share({
                            title: `${stats.name} - Player Card`,
                            text: `Check out ${stats.name}'s cricket stats!`,
                            files: [file]
                        });
                    } catch (e) {
                        // User cancelled share or failed
                        downloadBlob(blob, fileName);
                    }
                } else {
                    downloadBlob(blob, fileName);
                }
            }, 'image/png');
        } catch (err) {
            console.error("Failed to generate player card", err);
            alert("Failed to export player card.");
        } finally {
            setIsExporting(false);
        }
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div 
                ref={cardRef} 
                style={{
                    width: '320px',
                    height: '480px',
                    borderRadius: '20px',
                    background: 'linear-gradient(145deg, #1b263b, #0d1b2a)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    color: 'white',
                    fontFamily: 'var(--font-family)'
                }}
            >
                {/* Header Pattern */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '160px', background: 'radial-gradient(circle at top right, rgba(247, 127, 0, 0.3), transparent 70%)' }} />
                
                {isMVP && (
                    <div style={{ position: 'absolute', top: '15px', right: '-35px', background: 'var(--accent-color)', color: 'white', padding: '5px 40px', transform: 'rotate(45deg)', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 10 }}>
                        MVP
                    </div>
                )}

                {/* Player Image / Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', zIndex: 2 }}>
                    <div style={{ 
                        width: '120px', height: '120px', borderRadius: '50%', 
                        border: '4px solid var(--accent-color)', 
                        background: 'var(--panel-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                    }}>
                        {imageUrl ? (
                            <img src={imageUrl} alt={stats.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        ) : (
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                {stats.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Player Name & Tag */}
                <div style={{ textAlign: 'center', marginTop: '15px', zIndex: 2, padding: '0 15px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        {stats.name}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        CricTrack Pro Card
                    </div>
                    {mvpDetails && (
                        <div style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '5px', fontWeight: 'bold' }}>
                            {mvpDetails}
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div style={{ 
                    marginTop: 'auto', 
                    padding: '20px',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    zIndex: 2
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Matches</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{stats.matchesPlayed}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.runsScored}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wickets</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stats.wickets}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>High Score</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            {stats.highestScore}{stats.highestScoreNotOut && stats.highestScore > 0 ? '*' : ''}
                        </div>
                    </div>
                </div>
            </div>

            <button 
                className="btn" 
                onClick={handleShare} 
                disabled={isExporting}
                style={{ width: '320px', padding: '1rem' }}
            >
                {isExporting ? 'Generating...' : (
                    <>
                        <Share2 size={20} style={{ marginRight: '0.5rem' }} /> Share Trading Card
                    </>
                )}
            </button>
        </div>
    );
};
