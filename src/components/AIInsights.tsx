import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getAIResponse } from '../utils/aiUtils';

interface AIInsightsProps {
    prompt: string;
    onClose: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ prompt, onClose }) => {
    const [response, setResponse] = useState('');
    const [isGenerating, setIsGenerating] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchInsights = async () => {
            try {
                await getAIResponse(prompt, (chunk) => {
                    if (isMounted) {
                        setResponse(prev => prev + chunk);
                        // Auto-scroll
                        if (contentRef.current) {
                            contentRef.current.scrollTop = contentRef.current.scrollHeight;
                        }
                    }
                });
            } catch (err) {
                if (isMounted) setResponse(prev => prev + '\n\nFailed to generate insights.');
            } finally {
                if (isMounted) setIsGenerating(false);
            }
        };

        fetchInsights();

        return () => { isMounted = false; };
    }, [prompt]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: 'linear-gradient(145deg, #1f1f3a, #16162a)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>
                
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>
                    <Sparkles size={20} className={isGenerating ? "spin-animation" : ""} />
                    AI Match Insights
                </h3>
                
                <div 
                    ref={contentRef}
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        paddingRight: '0.5rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {response}
                    {isGenerating && <span className="blinking-cursor">|</span>}
                </div>
            </div>
            <style>{`
                .spin-animation {
                    animation: spin 2s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .blinking-cursor {
                    font-weight: bold;
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink { 50% { opacity: 0; } }
            `}</style>
        </div>
    );
};
