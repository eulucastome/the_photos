import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("notes.db");

export function initDatabase() {
  // Melhora concorrência entre leitura e escrita
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
