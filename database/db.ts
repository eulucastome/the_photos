import * as SQLite from 'expo-sqlite';

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync('galeria.db');
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_uri TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL
    );
  `);
};