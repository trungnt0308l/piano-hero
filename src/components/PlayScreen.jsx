import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SONGS, midiToNoteName } from '../data/songs';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { useGameLoop } from '../hooks/useGameLoop';
import { getJudgment, calcNoteScore } from '../utils/scoring';
import MiniKeyboard from './MiniKeyboard';
import SongClear from './SongClear';

const FALL_SPEED = 200; // px per second
const HIT_LINE_RATIO = 0.78; // hit line at 78% down the canvas
const COLORS = {
  right: { fill: '#ff6b6b', glow: '#ff4444' },
  left: { fill: '#00e5ff', glow: '#0099ff' },
  hard: { fill: '#ffd700', glow: '#ffaa00' },
};
const JUDGMENT_COLORS = { perfect: '#ffd700', good: '#00e5ff', ok: '#aaa', miss: '#ff4444' };

export default function PlayScreen({ practiceMode = false }) {
  const { songId } = useParams();
  const navigate = useNavigate();
  const song = SONGS.find(s => s.id === songId);

  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, combo: 0, lives: 3 });
  const [judgmentDisplay, setJudgmentDisplay] = useState(null);
  const [gamePhase, setGamePhase] = useState('ready'); // ready | playing | finished
  const [result, setResult] = useState(null);
  const [litKeys, setLitKeys] = useState([]);
  const [activeKeys, setActiveKeys] = useState([]);
  const [practiceSpeed, setPracticeSpeed] = useState(1.0);
  const hitWindowRef = useRef(0.15);
  const finishedRef = useRef(false);

  // Compute the MIDI range of the song
  const midiMin = song ? Math.min(...song.notes.map(n => n.midi)) : 60;
  const midiMax = song ? Math.max(...song.notes.map(n => n.midi)) : 72;
  const rangeStart = Math.max(48, midiMin - 2);
  const rangeEnd = Math.min(84, midiMax + 2);

  // Initialize game state
  const initGameState = useCallback(() => {
    if (!song) return;
    const notes = song.notes.map((n, i) => ({
      ...n,
      id: i,
      state: 'pending', // pending | hit | miss
      judgment: null,
    }));
    gameStateRef.current = {
      notes,
      startTime: null,
      elapsed: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      hits: 0,
      misses: 0,
    };
    finishedRef.current = false;
  }, [song]);

  useEffect(() => {
    initGameState();
  }, [initGameState]);

  // Canvas rendering
  const drawFrame = useCallback((dt, now) => {
    const gs = gameStateRef.current;
    if (!gs || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const hitLineY = H * HIT_LINE_RATIO;
    const speed = FALL_SPEED * practiceSpeed;

    if (gs.startTime === null) gs.startTime = now;
    gs.elapsed = (now - gs.startTime) * practiceSpeed;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    const midiRange = midiMax - midiMin + 1;

    // Lane guides
    for (let m = midiMin; m <= midiMax; m++) {
      const semitone = m % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(semitone);
      const x = ((m - midiMin) / midiRange) * W;
      const laneW = W / midiRange;
      if (isBlack) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, 0, laneW, H);
      }
    }

    // Hit line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(W, hitLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw notes
    for (const note of gs.notes) {
      if (note.state === 'hit') continue;

      const noteY = hitLineY - (note.time - gs.elapsed) * speed;
      const noteEndY = noteY + note.duration * speed;

      // Auto-miss notes that passed too long ago
      if (note.state === 'pending' && gs.elapsed > note.time + hitWindowRef.current + 0.1) {
        note.state = 'miss';
        note.judgment = 'miss';
        gs.combo = 0;
        gs.misses++;
      }

      // Skip if far off screen
      if (noteEndY < -20 || noteY > H + 20) {
        continue;
      }

      const x = ((note.midi - midiMin) / midiRange) * W + 2;
      const laneW = Math.max(20, W / midiRange - 4);
      const noteH = Math.max(16, note.duration * speed);
      const y = noteY - noteH;

      const color = note.isHard ? COLORS.hard : COLORS[note.hand] ?? COLORS.right;

      // Glow effect
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color.fill;
      const radius = 6;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, laneW, noteH, radius);
      } else {
        ctx.rect(x, y, laneW, noteH);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Note label
      if (laneW > 24) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = `bold ${Math.min(11, laneW * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(midiToNoteName(note.midi).replace(/\d/, ''), x + laneW / 2, y + Math.min(14, noteH * 0.6));
      }

      // Hard note star
      if (note.isHard) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x + laneW / 2, y + noteH - 4);
      }
    }

    // HUD combo update
    if (gs.combo !== hud.combo || gs.score !== hud.score) {
      setHud({ score: gs.score, combo: gs.combo, lives: gs.lives });
    }

    // Check for song end
    if (!finishedRef.current) {
      const allDone = gs.notes.every(n => n.state !== 'pending');
      const lastNoteTime = song.notes[song.notes.length - 1]?.time ?? 0;
      if (allDone && gs.elapsed > lastNoteTime + 1.5) {
        finishedRef.current = true;
        const total = gs.notes.length;
        const accuracy = total > 0 ? (gs.hits / total) * 100 : 0;
        setResult({
          score: gs.score,
          accuracy,
          maxCombo: gs.maxCombo,
          hits: gs.hits,
          misses: gs.misses,
        });
        setGamePhase('finished');
      }
    }
  }, [song, midiMin, midiMax, practiceSpeed, hud.combo, hud.score]);

  const { start, stop } = useGameLoop(drawFrame);

  useEffect(() => {
    if (gamePhase === 'playing') {
      start();
    } else {
      stop();
    }
    return stop;
  }, [gamePhase]);

  // Stop mic when component unmounts
  useEffect(() => () => stopMic(), []);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Pitch detection handler
  const onNoteDetected = useCallback((midi, audioTime) => {
    const gs = gameStateRef.current;
    if (!gs || gs.startTime === null) return;
    const elapsed = gs.elapsed;

    // Find nearest pending note matching this midi
    let best = null;
    let bestDelta = Infinity;
    for (const note of gs.notes) {
      if (note.state !== 'pending') continue;
      if (note.midi !== midi) continue;
      const delta = elapsed - note.time;
      if (Math.abs(delta) < hitWindowRef.current && Math.abs(delta) < Math.abs(bestDelta)) {
        best = note;
        bestDelta = delta;
      }
    }

    if (best) {
      const judgment = getJudgment(bestDelta);
      best.state = 'hit';
      best.judgment = judgment;
      const pts = calcNoteScore(judgment, gs.combo, best.isHard);
      gs.score += pts;
      gs.combo++;
      gs.maxCombo = Math.max(gs.maxCombo, gs.combo);
      gs.hits++;
      setLitKeys(k => [...k.filter(m => m !== midi), midi]);
      setTimeout(() => setLitKeys(k => k.filter(m => m !== midi)), 200);
      setJudgmentDisplay(judgment.toUpperCase());
      setTimeout(() => setJudgmentDisplay(null), 600);
    }

    setActiveKeys([midi]);
    setTimeout(() => setActiveKeys([]), 300);
  }, []);

  const { micStatus, start: startMic, stop: stopMic } = usePitchDetection({ onNoteDetected });

  if (!song) {
    return (
      <div style={{ padding: 24, color: '#fff', textAlign: 'center' }}>
        <p>Song not found.</p>
        <button className="btn-secondary" onClick={() => navigate('/songs')} style={{ marginTop: 16 }}>Back to Songs</button>
      </div>
    );
  }

  if (gamePhase === 'finished' && result) {
    return (
      <SongClear
        song={song}
        result={result}
        onRetry={() => {
          initGameState();
          setGamePhase('ready');
          setResult(null);
          setHud({ score: 0, combo: 0, lives: 3 });
        }}
      />
    );
  }

  if (gamePhase === 'ready') {
    return (
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a1a, #1a0a2e)',
        padding: 24, textAlign: 'center',
      }}>
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 16, left: 16,
          background: 'none', border: 'none', color: '#8888aa', fontSize: 20, cursor: 'pointer',
        }}>←</button>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎹</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{song.title}</h2>
        <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 32 }}>
          {song.difficulty === 1 ? '⭐ Easy' : song.difficulty === 2 ? '⭐⭐ Medium' : '⭐⭐⭐ Hard'}
          {' · '}{song.notes.length} notes
        </div>
        <div style={{
          background: '#12122a', borderRadius: 12, padding: '12px 16px',
          marginBottom: 32, fontSize: 13, color: '#8888aa', maxWidth: 280,
        }}>
          🎤 Place your phone near the piano keys and play the notes as they fall!
        </div>
        <button className="btn-primary" style={{ maxWidth: 240 }}
          onClick={() => { startMic(); setGamePhase('playing'); }}>
          Tap to Start ▶
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a1a' }}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#0d0d20', borderBottom: '1px solid #1a1a3a',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#8888aa', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8888aa', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd700' }}>{hud.score.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#8888aa' }}>Combo</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: hud.combo >= 10 ? '#ff6b6b' : '#fff' }}>×{hud.combo}</div>
        </div>
      </div>

      {/* Note Highway Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Judgment popup */}
        {judgmentDisplay && (
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
            fontSize: 28, fontWeight: 900,
            color: JUDGMENT_COLORS[judgmentDisplay.toLowerCase()] ?? '#fff',
            textShadow: '0 0 12px currentColor',
            pointerEvents: 'none',
            animation: 'fadeUp 0.6s forwards',
          }}>{judgmentDisplay}</div>
        )}

        {/* Mic status indicator */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.7)', borderRadius: 20,
          padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: micStatus === 'listening' ? '#00ff88' : micStatus === 'denied' ? '#ff4444' : '#ffaa00',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'currentColor',
          }} />
          {micStatus === 'listening' ? 'Listening' : micStatus === 'denied' ? 'Mic denied' : 'Starting mic…'}
        </div>

        {/* Mic denied banner */}
        {micStatus === 'denied' && (
          <div style={{
            position: 'absolute', bottom: 80, left: 12, right: 12,
            background: 'rgba(255,60,60,0.9)', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, textAlign: 'center', color: '#fff',
          }}>
            Microphone blocked. Allow mic access in browser settings, then reload.
          </div>
        )}

        {/* Practice mode speed control */}
        {practiceMode && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 12, color: '#8888aa', marginBottom: 4 }}>Speed: {Math.round(practiceSpeed * 100)}%</div>
            <input type="range" min={0.5} max={1} step={0.25} value={practiceSpeed}
              onChange={e => setPracticeSpeed(Number(e.target.value))}
              style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Mini Keyboard */}
      <MiniKeyboard rangeStart={rangeStart} rangeEnd={rangeEnd} litKeys={litKeys} activeKeys={activeKeys} />
    </div>
  );
}
