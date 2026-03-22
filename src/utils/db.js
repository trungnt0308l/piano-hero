import { openDB } from 'idb';

const DB_NAME = 'pianohero';
const DB_VERSION = 1;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('scores')) {
        db.createObjectStore('scores', { keyPath: 'songId' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    }
  });
}

export async function getProfile() {
  const db = await getDB();
  return (await db.get('profile', 'user')) ?? {
    id: 'user',
    name: '',
    avatar: '🐱',
    xp: 0,
    level: 1,
    streak: 0,
    lastPlayDate: null,
    achievements: [],
    onboarded: false,
  };
}

export async function saveProfile(profile) {
  const db = await getDB();
  await db.put('profile', { ...profile, id: 'user' });
}

export async function getSongScore(songId) {
  const db = await getDB();
  return db.get('scores', songId);
}

export async function saveSongScore(songId, data) {
  const db = await getDB();
  const existing = await db.get('scores', songId);
  if (!existing || data.score > existing.score) {
    await db.put('scores', { songId, ...data });
  }
}

export async function getAllScores() {
  const db = await getDB();
  return db.getAll('scores');
}

export async function getSetting(key, defaultVal) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row ? row.value : defaultVal;
}

export async function saveSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}
