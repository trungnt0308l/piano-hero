import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SONGS, getDifficultyLabel } from '../data/songs';
import { getProfile, getAllScores } from '../utils/db';

function SongCard({ song, score, onPlay }) {
  const stars = score?.stars ?? 0;
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      onClick={() => onPlay(song.id)}>
      <div style={{ fontSize: 32 }}>🎵</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
        <div style={{ color: '#8888aa', fontSize: 12 }}>{getDifficultyLabel(song.difficulty)}</div>
      </div>
      <div style={{ fontSize: 18, letterSpacing: -2 }}>
        {[1,2,3].map(i => <span key={i} style={{ color: i <= stars ? '#ffd700' : '#333' }}>★</span>)}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState({});

  useEffect(() => {
    getProfile().then(setProfile);
    getAllScores().then(arr => {
      const map = {};
      arr.forEach(s => { map[s.songId] = s; });
      setScores(map);
    });
  }, []);

  const featuredSong = SONGS.find(s => s.id === 'hot-cross-buns') ?? SONGS[0];
  const almostThere = SONGS.filter(s => scores[s.id]?.stars === 2);
  const recentlyPlayed = SONGS.filter(s => scores[s.id]).slice(0, 3);

  return (
    <div className="screen" style={{ padding: '0 0 72px 0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a1a 100%)', padding: '24px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#8888aa' }}>Welcome back,</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{profile?.avatar} {profile?.name ?? 'Player'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24 }}>🔥 {profile?.streak ?? 0}</div>
            <div style={{ fontSize: 11, color: '#8888aa' }}>day streak</div>
          </div>
        </div>
        {/* XP bar */}
        <div style={{ background: '#1a1a3a', borderRadius: 8, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${((profile?.xp ?? 0) % 500) / 5}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00e5ff, #b388ff)',
            transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8888aa', marginTop: 4 }}>
          <span>Level {profile?.level ?? 1}</span>
          <span>{profile?.xp ?? 0} XP</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Song of the Day */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 8 }}>🎵 Song of the Day</div>
          <div style={{
            background: 'linear-gradient(135deg, #1a0a4e, #0a1a3e)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #2a2a5a',
            cursor: 'pointer',
          }} onClick={() => navigate(`/play/${featuredSong.id}`)}>
            <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 4 }}>{getDifficultyLabel(featuredSong.difficulty)}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{featuredSong.title}</div>
            <button className="btn-primary" style={{ maxWidth: 160 }}>Play Now ▶</button>
          </div>
        </div>

        {/* Continue Practicing */}
        {recentlyPlayed.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 8 }}>▶ Continue Practicing</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentlyPlayed.map(s => (
                <SongCard key={s.id} song={s} score={scores[s.id]} onPlay={id => navigate(`/play/${id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Almost There */}
        {almostThere.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 8 }}>⭐ Almost There!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {almostThere.map(s => (
                <SongCard key={s.id} song={s} score={scores[s.id]} onPlay={id => navigate(`/play/${id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Start */}
        {recentlyPlayed.length === 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 8 }}>🚀 Get Started</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SONGS.filter(s => s.difficulty === 1).slice(0, 3).map(s => (
                <SongCard key={s.id} song={s} score={scores[s.id]} onPlay={id => navigate(`/play/${id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
