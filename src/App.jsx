import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomeScreen from './components/HomeScreen';
import SongList from './components/SongList';
import PlayScreen from './components/PlayScreen';
import Progress from './components/Progress';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';
import { getProfile } from './utils/db';

const NAV = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/songs', label: 'Songs', icon: '🎵' },
  { path: '/progress', label: 'Progress', icon: '🏆' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    getProfile().then(p => setOnboarded(p.onboarded));
  }, []);

  if (onboarded === null) return null;

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  const isPlay = location.pathname.startsWith('/play');

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/songs" element={<SongList />} />
        <Route path="/play/:songId" element={<PlayScreen />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      {!isPlay && (
        <nav className="bottom-nav">
          {NAV.map(item => (
            <button
              key={item.path}
              className={`nav-btn${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
