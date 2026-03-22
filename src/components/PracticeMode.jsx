import { useNavigate } from 'react-router-dom';
import { SONGS, getDifficultyLabel } from '../data/songs';

export default function PracticeMode() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Practice Mode</h1>
        <p style={{ color: '#8888aa', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          Practice at your own pace! Notes fall slower and there's no time pressure. Great for learning new songs.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SONGS.map(song => (
            <div
              key={song.id}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => navigate(`/play/${song.id}?practice=1`)}
            >
              <div style={{ fontSize: 28, width: 44, textAlign: 'center' }}>
                {song.tags.includes('training') ? '🏃' : song.tags.includes('classical') ? '🎼' : '🎵'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {song.title}
                </div>
                <div style={{ color: '#8888aa', fontSize: 12 }}>
                  {getDifficultyLabel(song.difficulty)} · {song.notes.length} notes
                </div>
              </div>
              <div style={{ color: '#00e5ff', fontSize: 20 }}>▶</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
