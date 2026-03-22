import { useState, useRef } from 'react';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { saveProfile } from '../utils/db';

const AVATARS = ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨', '🐯', '🦁', '🐙', '🦄'];

// The 7 notes to detect: C4 D4 E4 F4 G4 A4 B4
// Each entry: label, and a set of MIDI numbers that count as that note (across octaves)
const CALIBRATION_NOTES = [
  { label: 'C', semitone: 0 },
  { label: 'D', semitone: 2 },
  { label: 'E', semitone: 4 },
  { label: 'F', semitone: 5 },
  { label: 'G', semitone: 7 },
  { label: 'A', semitone: 9 },
  { label: 'B', semitone: 11 },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🐱');
  const [micError, setMicError] = useState('');
  const [detectedSemitones, setDetectedSemitones] = useState(new Set());
  const [lastDetected, setLastDetected] = useState(null); // label of most recently detected note
  const lastDetectedRef = useRef(null);

  const allDetected = CALIBRATION_NOTES.every(n => detectedSemitones.has(n.semitone));

  const { micStatus, start, stop } = usePitchDetection({
    onNoteDetected: (midi) => {
      const semitone = midi % 12;
      const match = CALIBRATION_NOTES.find(n => n.semitone === semitone);
      if (!match) return;

      setDetectedSemitones(prev => {
        const next = new Set(prev);
        next.add(semitone);
        return next;
      });

      // Flash label feedback — debounce so it doesn't flicker too fast
      if (lastDetectedRef.current !== match.label) {
        lastDetectedRef.current = match.label;
        setLastDetected(match.label);
        setTimeout(() => {
          lastDetectedRef.current = null;
          setLastDetected(null);
        }, 600);
      }
    }
  });

  // Auto-advance once all 7 are hit
  const allDetectedRef = useRef(false);
  if (allDetected && !allDetectedRef.current) {
    allDetectedRef.current = true;
    stop();
    setTimeout(() => setStep(4), 900);
  }

  const handleMicStep = () => {
    if (!navigator.mediaDevices || !window.isSecureContext) {
      setMicError('Microphone requires HTTPS. Open this app via https:// or on localhost.');
      setStep(3);
      return;
    }
    setDetectedSemitones(new Set());
    allDetectedRef.current = false;
    setStep(3);
    start().catch(e => setMicError(e.message));
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
              outline: 'none', boxSizing: 'border-box',
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
        <div style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ fontSize: 40, marginBottom: 10 }}>
            {micError || micStatus === 'denied' ? '❌' : allDetected ? '✅' : '🎤'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {micError || micStatus === 'denied'
              ? 'Mic Problem'
              : allDetected
              ? 'Perfect!'
              : micStatus === 'listening'
              ? 'Play each note once'
              : 'Starting mic…'}
          </h2>
          <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            {micError
              ? micError
              : micStatus === 'denied'
              ? 'Microphone access was blocked. Allow it in browser settings and reload.'
              : allDetected
              ? 'All notes detected! Great sound.'
              : 'Play C D E F G A B on your piano — any octave'}
          </p>

          {/* HTTPS error box */}
          {micError && micError.includes('HTTPS') && (
            <div style={{ background: '#1a0a0a', border: '1px solid #ff4444', borderRadius: 10, padding: 12, fontSize: 12, color: '#ff8888', marginBottom: 16, textAlign: 'left' }}>
              <strong>How to fix:</strong> Open via <code>https://</code> or <code>localhost</code>. Plain HTTP on a local IP doesn't allow microphone access.
            </div>
          )}

          {/* Note checklist */}
          {!micError && micStatus !== 'denied' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {CALIBRATION_NOTES.map(n => {
                const done = detectedSemitones.has(n.semitone);
                const active = lastDetected === n.label;
                return (
                  <div key={n.label} style={{
                    width: 44, height: 56,
                    borderRadius: 10,
                    background: done ? '#00e5ff22' : '#1a1a3a',
                    border: `2px solid ${active ? '#fff' : done ? '#00e5ff' : '#333366'}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                    transform: active ? 'scale(1.15)' : 'scale(1)',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: done ? '#00e5ff' : '#aaa' }}>
                      {n.label}
                    </span>
                    <span style={{ fontSize: 16 }}>{done ? '✓' : '·'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress count */}
          {micStatus === 'listening' && !micError && (
            <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
              {detectedSemitones.size} / 7 detected
            </p>
          )}

          <button className="btn-secondary" onClick={() => setStep(4)}
            style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>
            Skip for now
          </button>
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
