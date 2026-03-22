export function getJudgment(timingDelta) {
  const abs = Math.abs(timingDelta);
  if (abs <= 0.1)  return 'perfect';
  if (abs <= 0.2)  return 'good';
  if (abs <= 0.3)  return 'ok';
  return 'miss';
}

export function getBaseScore(judgment) {
  return { perfect: 300, good: 200, ok: 100, miss: 0 }[judgment] ?? 0;
}

export function getComboMultiplier(combo) {
  if (combo >= 50) return 4;
  if (combo >= 25) return 3;
  if (combo >= 10) return 2;
  return 1;
}

export function calcNoteScore(judgment, combo, isHard = false) {
  const base = getBaseScore(judgment);
  const mult = getComboMultiplier(combo);
  const hardBonus = (isHard && judgment !== 'miss') ? 100 : 0;
  return base * mult + hardBonus;
}

export function calcStars(accuracy) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return 1;
  return 0;
}

export function calcXP(stars, difficulty) {
  return stars * difficulty * 50;
}
