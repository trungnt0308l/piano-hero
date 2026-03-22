import { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '../utils/db';

const AVATARS = ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨', '🐯', '🦁', '🐙', '🦄'];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    getProfile().then(p => { setProfile(p); setName(p.name); });
  }, []);

  const save = async () => {
    const updated = { ...profile, name };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  return (
    <div className="screen">
      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Profile</h1>

        <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>{profile?.avatar ?? '🎹'}</div>
          {editing ? (
            <>
              <input value={name} onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0a0a1a', border: '1px solid #333', color: '#fff', fontSize: 16, marginBottom: 12, textAlign: 'center', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setProfile(p => ({ ...p, avatar: a }))}
                    style={{ fontSize: 28, background: profile?.avatar === a ? '#1a1a5a' : 'transparent', border: profile?.avatar === a ? '2px solid #00e5ff' : '2px solid transparent', borderRadius: 10, padding: 4, cursor: 'pointer' }}>{a}</button>
                ))}
              </div>
              <button className="btn-primary" onClick={save}>Save</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile?.name}</div>
              <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 16 }}>Level {profile?.level ?? 1}</div>
              <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>About</div>
          <div style={{ color: '#8888aa', fontSize: 13, lineHeight: 1.6 }}>
            PianoHero v1.0<br />
            Learn piano like a game!<br /><br />
            All your progress is saved locally on your device. No account required.
          </div>
        </div>
      </div>
    </div>
  );
}
