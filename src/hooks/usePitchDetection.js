import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

export function usePitchDetection({ onNoteDetected, enabled = true }) {
  const [micStatus, setMicStatus] = useState('idle'); // idle | listening | error | denied
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      const buf = new Float32Array(analyser.fftSize);

      setMicStatus('listening');

      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        const [pitch, clarity] = detectorRef.current.findPitch(buf, ctx.sampleRate);
        // Lower threshold (0.85) to work better with phone mics further from the piano
        if (clarity > 0.85 && pitch > 50 && pitch < 5000) {
          const midi = Math.round(12 * Math.log2(pitch / 440) + 69);
          if (midi >= 21 && midi <= 108) { // valid piano range
            onNoteDetected?.(midi, ctx.currentTime);
          }
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (e) {
      setMicStatus(e.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  }, [onNoteDetected]);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
      setMicStatus('idle');
    }
    return stop;
  }, [enabled, start, stop]);

  return { micStatus, start, stop };
}
