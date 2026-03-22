import { useState } from 'react';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { saveProfile } from '../utils/db';

const AVATARS = ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨', '🐯', '🦁', '🐙', '🦄'];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🐱');
  const [micDetected, setMicDetected] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const { micStatus, start, stop } = usePitchDetection({
    enabled: calibrating,
    onNoteDetected: (midi) => {
      if (midi > 30 && midi < 110) {
        setMicDetected(true);
        stop();
        setTimeout(() => setStep(4), 800);
      }
    }
  });

  const handleMicStep = async () => {
    setCalibrating(true);
    setStep(3);
  };

  const handleFinish = async () => {
    await saveProfile({
      name: name || 'Player',
      avatar,
      xp: 0,
      level: 1,
      streak: 0,
      lastPlayDate: null,
      achievements: [],
      onboarded: true,
    });
    onComplete();
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      textAlign: 'center',
    }}>
      {step === 0 && (
        <div>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎹</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #00e5ff, #b388ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PianoHero
          </h1>
          <p style={{ color: '#8888aa', marginBottom: 40, fontSize: 16 }}>Learn piano like a game!</p>
          <button className="btn-primary" onClick={() => setStep(1)}>Let's Play! 🎵</button>
        </div>
      )}

      {step === 1 && (
        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>What's your name?</h2>
          <p style={{ color: '#8888aa', marginBottom: 24 }}>Pick a name and an avatar</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name..."
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: '#1a1a3a', border: '1px solid #333366',
              color: '#fff', fontSize: 16, marginBottom: 24,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)} style={{
                fontSize: 36, background: avatar === a ? '#1a1a5a' : 'transparent',
                border: avatar === a ? '2px solid #00e5ff' : '2px solid transparent',
                borderRadius: 12, padding: 8, cursor: 'pointer',
              }}>{a}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setStep(2)} disabled={!name.trim()}>Next →</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎤</div>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Enable Microphone</h2>
          <p style={{ color: '#8888aa', marginBottom: 32, lineHeight: 1.5 }}>
            PianoHero listens to your piano so we can score your playing in real time. Your audio never leaves your device.
          </p>
          <button className="btn-primary" onClick={handleMicStep}>Allow Microphone</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontSize: 56, marginBottom: 16 }}>
            {micDetected ? '✅' : micStatus === 'denied' ? '❌' : '🎹'}
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>
            {micDetected ? 'Got it!' : micStatus === 'denied' ? 'Mic Blocked' : 'Play Any Note!'}
          </h2>
          <p style={{ color: '#8888aa', marginBottom: 32, lineHeight: 1.5 }}>
            {micDetected
              ? 'Your piano is coming through loud and clear!'
              : micStatus === 'denied'
              ? 'Please allow microphone access in your browser settings and try again.'
              : 'Place your phone near the piano and press any key...'}
          </p>
          {micStatus !== 'denied' && !micDetected && (
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,229,255,0.2)', border: '2px solid #00e5ff', margin: '0 auto', animation: 'pulse 1s infinite' }} />
          )}
          <div style={{ marginTop: 32 }}>
            <button className="btn-secondary" onClick={() => setStep(4)} style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{avatar}</div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>You're all set, {name}!</h2>
          <p style={{ color: '#8888aa', marginBottom: 40 }}>Let's play your first song!</p>
          <button className="btn-primary" onClick={handleFinish}>Start Playing 🎉</button>
        </div>
      )}
    </div>
  );
}
