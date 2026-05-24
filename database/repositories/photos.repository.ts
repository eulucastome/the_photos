import * as SQLite from 'expo-sqlite';

export interface Photo {
  id: number; title: string; image_uri: string; latitude: number | null; longitude: number | null; created_at: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;
const getDb = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('galeria.db');
  }
  return dbInstance;
};

export const initDatabase = async () => {
  const db = await getDb();
  await db.execAsync(`CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, image_uri TEXT NOT NULL, latitude REAL, longitude REAL, created_at TEXT NOT NULL);`);
};

export const insertPhoto = async (title: string, uri: string, lat: number | null, lon: number | null) => {
  const db = await getDb();
  await db.runAsync('INSERT INTO photos (title, image_uri, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?);', [title, uri, lat, lon, new Date().toISOString()]);
};

export const fetchPhotos = async (): Promise<Photo[]> => {
  const db = await getDb();
  return db.getAllAsync<Photo>('SELECT * FROM photos ORDER BY id DESC;');
};

export const deletePhoto = async (id: number) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM photos WHERE id = ?;', [id]);
};