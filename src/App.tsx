import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MatchSetup from './pages/MatchSetup';
import MatchScoring from './pages/MatchScoring';
import Scorecard from './pages/Scorecard';
import History from './pages/History';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<MatchSetup />} />
        <Route path="/match/:id" element={<MatchScoring />} />
        <Route path="/scorecard/:id" element={<Scorecard />} />
        <Route path="/history" element={<History />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
