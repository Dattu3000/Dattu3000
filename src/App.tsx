import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MatchSetup from './pages/MatchSetup';
import MatchScoring from './pages/MatchScoring';
import Scorecard from './pages/Scorecard';
import History from './pages/History';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<MatchSetup />} />
        <Route path="/match/:id" element={<MatchScoring />} />
        <Route path="/scorecard/:id" element={<Scorecard />} />
        <Route path="/history" element={<History />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
