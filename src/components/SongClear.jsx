import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcStars, calcXP } from '../utils/scoring';
import { saveSongScore, getProfile, saveProfile } from '../utils/db';

const STAR_BADGES = { 3: 'Maestro', 2: 'Bravo', 1: 'Nice Try', 0: 'Keep Practicing' };

export default function SongClear({ song, result, onRetry }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const stars = calcStars(result.accuracy);
  const badge = STAR_BADGES[stars];
  const xp = calcXP(stars, song.difficulty);

  useEffect(() => {
    if (saved) return;
    setSaved(true);
    saveSongScore(song.id, { score: result.score, stars, accuracy: result.accuracy });
    getProfile().then(p => {
      const newXp = (p.xp ?? 0) + xp;
      const newLevel = Math.floor(newXp / 500) + 1;
      saveProfile({ ...p, xp: newXp, level: newLevel });
    });
  }, []);

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #0a0a1a, #1a0a2e)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>
        {stars === 3 ? '🏆' : stars === 2 ? '🥈' : stars === 1 ? '🥉' : '🎹'}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{badge}</div>
      <div style={{ fontSize: 15, color: '#8888aa', marginBottom: 24 }}>{song.title}</div>

      <div style={{ fontSize: 44, color: '#ffd700', letterSpacing: 4, marginBottom: 24 }}>
        {[1,2,3].map(i => <span key={i}>{i <= stars ? '★' : '☆'}</span>)}
      </div>

      <div className="card" style={{ width: '100%', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{result.score.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#8888aa' }}>Score</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(result.accuracy)}%</div>
          <div style={{ fontSize: 12, color: '#8888aa' }}>Accuracy</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{result.maxCombo}</div>
          <div style={{ fontSize: 12, color: '#8888aa' }}>Max Combo</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#00e5ff' }}>+{xp}</div>
          <div style={{ fontSize: 12, color: '#8888aa' }}>XP Earned</div>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={onRetry}>Play Again</button>
        <button className="btn-secondary" onClick={() => navigate('/songs')}>Back to Songs</button>
        <button className="btn-secondary" onClick={() => navigate('/')}>Home</button>
      </div>
    </div>
  );
}
