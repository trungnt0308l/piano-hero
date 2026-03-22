import { useState, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

/**
 * Returns { micStatus, start, stop }.
 * IMPORTANT: call start() directly inside an onClick handler — NOT from a useEffect.
 * Browsers block getUserMedia unless called synchronously from a user gesture.
 */
export function usePitchDetection({ onNoteDetected }) {
  const [micStatus, setMicStatus] = useState('idle'); // idle | listening | error | denied
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const onNoteDetectedRef = useRef(onNoteDetected);
  onNoteDetectedRef.current = onNoteDetected;

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    rafRef.current = null;
  }, []);

  // Call this DIRECTLY from an onClick — not from useEffect
  const start = useCallback(async () => {
    if (audioCtxRef.current) return; // already running
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buf);
        const [pitch, clarity] = detectorRef.current.findPitch(buf, ctx.sampleRate);
        if (clarity > 0.85 && pitch > 50 && pitch < 5000) {
          const midi = Math.round(12 * Math.log2(pitch / 440) + 69);
          if (midi >= 21 && midi <= 108) {
            onNoteDetectedRef.current?.(midi, ctx.currentTime);
          }
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicStatus('denied');
      } else {
        setMicStatus('error');
        console.error('Mic error:', e);
      }
    }
  }, []);

  return { micStatus, start, stop };
}
