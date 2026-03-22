import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SONGS, getDifficultyLabel } from '../data/songs';
import { getAllScores } from '../utils/db';

export default function SongList() {
  const navigate = useNavigate();
  const [scores, setScores] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllScores().then(arr => {
      const map = {};
      arr.forEach(s => { map[s.songId] = s; });
      setScores(map);
    });
  }, []);

  const filtered = SONGS.filter(s => {
    const matchDiff = filter === 'all' || s.difficulty === Number(filter);
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.includes(search.toLowerCase()));
    return matchDiff && matchSearch;
  });

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Songs</h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search songs..."
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            background: '#1a1a3a', border: '1px solid #333366',
            color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['all','All'],['1','Easy'],['2','Medium'],['3','Hard']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: filter === v ? '#00e5ff' : '#1a1a3a',
              color: filter === v ? '#000' : '#aaa',
              border: 'none', cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(song => {
            const score = scores[song.id];
            const stars = score?.stars ?? 0;
            return (
              <div key={song.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/play/${song.id}`)}>
                <div style={{ fontSize: 28, width: 44, textAlign: 'center' }}>
                  {song.tags.includes('training') ? '🏃' : song.tags.includes('classical') ? '🎼' : '🎵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                  <div style={{ color: '#8888aa', fontSize: 12 }}>{getDifficultyLabel(song.difficulty)} · {song.notes.length} notes</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, letterSpacing: -2, textAlign: 'right' }}>
                    {[1,2,3].map(i => <span key={i} style={{ color: i <= stars ? '#ffd700' : '#333' }}>★</span>)}
                  </div>
                  {score?.score && <div style={{ fontSize: 11, color: '#8888aa', textAlign: 'right' }}>{score.score.toLocaleString()}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
