import { useNavigate } from 'react-router-dom';
import { Trophy, PlusCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { calculateStandings } from '../utils/standingsUtils';
import { StandingsTable } from '../components/StandingsTable';
import { AdBanner } from '../components/AdBanner';

export default function Home() {
    const navigate = useNavigate();
    const matches = useLiveQuery(() => db.matches.toArray()) || [];

    const standings = calculateStandings(matches);

    const handleClearHistory = async () => {
        await db.matches.clear();
    };

    return (
        <div className="container" style={{ justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <Trophy size={64} color="var(--accent-color)" />
                <h1 style={{ fontSize: '2rem', marginTop: '1rem', color: 'var(--text-primary)' }}>
                    Local Cricket Score
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Offline, mobile-first cricket scoring
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matches.some(m => m.status === 'ongoing' || m.status === 'setup') && (
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '1.2rem', fontSize: '1.2rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                        onClick={() => {
                            const ongoing = matches.find(m => m.status === 'ongoing' || m.status === 'setup');
                            if (ongoing) navigate(ongoing.status === 'setup' ? '/setup' : `/match/${ongoing.id}`);
                        }}
                    >
                        Resume Match
                    </button>
                )}
                
                <button
                    className="btn"
                    style={{ padding: '1.2rem', fontSize: '1.2rem' }}
                    onClick={() => navigate('/setup')}
                >
                    <PlusCircle size={24} />
                    Quick Match
                </button>
            </div>

            <StandingsTable
                standings={standings}
                onClearHistory={handleClearHistory}
            />

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                    onClick={() => navigate('/privacy')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Privacy Policy
                </button>
            </div>

            <AdBanner dataAdSlot="1111111111" />
        </div>
    );
}
