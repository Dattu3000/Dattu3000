import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MatchSetup from './pages/MatchSetup';
import MatchScoring from './pages/MatchScoring';
import Scorecard from './pages/Scorecard';
import History from './pages/History';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Login from './pages/Login';
import TournamentSetup from './pages/TournamentSetup';
import TournamentDashboard from './pages/TournamentDashboard';
import TournamentsList from './pages/TournamentsList';
import { BottomNav } from './components/BottomNav';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        const isAuth = localStorage.getItem('is_authenticated');
        if (!isAuth && location.pathname !== '/login') {
            navigate('/login');
        }
    }, [navigate, location]);

    return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<MatchSetup />} />
        <Route path="/match/:id" element={<MatchScoring />} />
        <Route path="/scorecard/:id" element={<Scorecard />} />
        <Route path="/history" element={<History />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tournaments" element={<TournamentsList />} />
        <Route path="/tournament/setup" element={<TournamentSetup />} />
        <Route path="/tournament/:id" element={<TournamentDashboard />} />
      </Routes>
      <BottomNav />
      </AuthWrapper>
    </BrowserRouter>
  );
}

export default App;
