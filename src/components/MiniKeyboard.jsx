import { useMemo } from 'react';

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_KEYS = [1, 3, null, 6, 8, 10]; // C# D# - F# G# A#

export function midiToKeyInfo(midi) {
  const semitone = midi % 12;
  const isBlack = [1, 3, 6, 8, 10].includes(semitone);
  return { isBlack };
}

export default function MiniKeyboard({ rangeStart = 60, rangeEnd = 72, activeKeys = [], litKeys = [] }) {
  // Generate key list for visible range
  const keys = useMemo(() => {
    const out = [];
    for (let m = rangeStart; m <= rangeEnd; m++) {
      const s = m % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(s);
      out.push({ midi: m, isBlack });
    }
    return out;
  }, [rangeStart, rangeEnd]);

  const whiteKeys = keys.filter(k => !k.isBlack);
  const totalWhite = whiteKeys.length;

  return (
    <div style={{
      position: 'relative',
      height: 70,
      background: '#111',
      borderTop: '2px solid #333',
      overflow: 'hidden',
    }}>
      {whiteKeys.map((k, i) => {
        const isActive = activeKeys.includes(k.midi);
        const isLit = litKeys.includes(k.midi);
        return (
          <div key={k.midi} style={{
            position: 'absolute',
            left: `${(i / totalWhite) * 100}%`,
            width: `${100 / totalWhite}%`,
            height: '100%',
            background: isLit ? '#00e5ff' : isActive ? '#aaa' : '#fff',
            border: '1px solid #333',
            borderRadius: '0 0 4px 4px',
            transition: 'background 0.05s',
            boxSizing: 'border-box',
          }} />
        );
      })}
      {keys.filter(k => k.isBlack).map((k) => {
        // Find position relative to white keys
        const prevWhite = whiteKeys.filter(w => w.midi < k.midi);
        const idx = prevWhite.length;
        const isLit = litKeys.includes(k.midi);
        const isActive = activeKeys.includes(k.midi);
        return (
          <div key={k.midi} style={{
            position: 'absolute',
            left: `${((idx - 0.3) / totalWhite) * 100}%`,
            width: `${(0.6 / totalWhite) * 100}%`,
            height: '60%',
            background: isLit ? '#ff6b6b' : isActive ? '#555' : '#222',
            borderRadius: '0 0 3px 3px',
            zIndex: 2,
            transition: 'background 0.05s',
          }} />
        );
      })}
    </div>
  );
}
