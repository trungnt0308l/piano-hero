// MIDI parsing utilities

export function midiNoteToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function frequencyToMidiNote(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

export function midiNoteToName(midiNote) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const name = noteNames[midiNote % 12];
  return `${name}${octave}`;
}

export function isBlackKey(midiNote) {
  const semitone = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(semitone);
}

export function parseMidiTracks(midiData) {
  // Parse @tonejs/midi Midi object into our note format
  const notes = [];
  midiData.tracks.forEach((track, trackIdx) => {
    track.notes.forEach(note => {
      notes.push({
        time: note.time,
        duration: note.duration,
        midi: note.midi,
        hand: trackIdx === 0 ? 'right' : 'left',
        velocity: note.velocity,
      });
    });
  });
  return notes.sort((a, b) => a.time - b.time);
}
