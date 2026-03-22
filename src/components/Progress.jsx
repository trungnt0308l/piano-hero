import { useEffect, useState } from 'react';
import { getProfile, getAllScores } from '../utils/db';
import { SONGS } from '../data/songs';

const ACHIEVEMENTS = [
  { id: 'first-note', icon: '🎹', title: 'First Note', desc: 'Play your first song' },
  { id: 'on-fire', icon: '🔥', title: 'On Fire', desc: 'Reach a 50-combo' },
  { id: 'perfectionist', icon: '⭐', title: 'Perfectionist', desc: 'Get 3 stars on any song' },
  { id: 'repertoire', icon: '🎵', title: 'Repertoire', desc: '3-star 10 different songs' },
  { id: 'flawless', icon: '💯', title: 'Flawless', desc: '100% accuracy on any song' },
  { id: 'dedicated', icon: '🗓', title: 'Dedicated', desc: '7-day streak' },
];

export default function Progress() {
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    getProfile().then(setProfile);
    getAllScores().then(setScores);
  }, []);

  const xpForNext = 500;
  const xpProgress = (profile?.xp ?? 0) % xpForNext;
  const totalSongs = SONGS.length;
  const played = scores.length;
  const threeStarred = scores.filter(s => s.stars === 3).length;

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Progress</h1>

        {/* Level */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: '#8888aa' }}>Level {profile?.level ?? 1}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{profile?.name ?? 'Player'}</div>
            </div>
            <div style={{ fontSize: 40 }}>{profile?.avatar ?? '🎹'}</div>
          </div>
          <div style={{ background: '#0a0a1a', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{
              width: `${(xpProgress / xpForNext) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00e5ff, #b388ff)',
            }} />
          </div>
          <div style={{ fontSize: 12, color: '#8888aa' }}>{xpProgress} / {xpForNext} XP to Level {(profile?.level ?? 1) + 1}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            ['🎵', played, 'Played'],
            ['⭐', threeStarred, '3-Starred'],
            ['🔥', profile?.streak ?? 0, 'Day Streak'],
          ].map(([icon, val, label]) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 11, color: '#8888aa' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Achievements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = (profile?.achievements ?? []).includes(a.id);
              return (
                <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: unlocked ? 1 : 0.4 }}>
                  <div style={{ fontSize: 28 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#8888aa' }}>{a.desc}</div>
                  </div>
                  {unlocked && <div style={{ marginLeft: 'auto', color: '#00e5ff' }}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
