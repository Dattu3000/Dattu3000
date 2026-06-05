import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Trophy, History, User } from 'lucide-react';

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/tournaments', label: 'Tournaments', icon: Trophy },
        { path: '/history', label: 'History', icon: History },
        { path: '/profile', label: 'Profile', icon: User }
    ];

    // Don't show bottom nav on specific screens
    const hideOnRoutes = ['/match/', '/setup', '/match-setup', '/login', '/scorecard/'];
    if (hideOnRoutes.some(r => location.pathname.startsWith(r))) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            backgroundColor: 'var(--card-bg)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0.8rem 0',
            paddingBottom: 'calc(0.8rem + env(safe-area-inset-bottom))',
            zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
        }}>
            {tabs.map(tab => {
                const active = location.pathname === tab.path || (tab.path === '/tournaments' && location.pathname.startsWith('/tournament/'));
                const Icon = tab.icon;
                return (
                    <div 
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        style={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            flex: 1,
                            transition: 'color 0.2s'
                        }}
                    >
                        <Icon size={24} />
                        <span style={{ fontSize: '0.7rem', fontWeight: active ? 'bold' : 'normal' }}>{tab.label}</span>
                    </div>
                );
            })}
        </div>
    );
};
