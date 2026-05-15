import { db } from "../db";

export type NoteType = {
  id?: number;
  title: string;
  text: string;
  created_at?: string;
};

export default class NotesRepository {
  public create(note: NoteType) {
    const stmt = db.prepareSync(`
            INSERT INTO note (
                title,
                text,
                created_at
            )
            VALUES (
                $title,
                $text, 
                $created_at
            )
  `);

    try {
      return stmt.executeSync({
        $title: note.title,
        $text: note.text,
        $created_at: new Date().toISOString(),
      });
    } catch (e) {
      throw e;
    } finally {
      stmt.finalizeSync();
    }
  }

  getAll() {
    return db.getAllSync<{
      id: number;
      title: string;
      text: string;
      created_at: string;
    }>(`
    SELECT id, title, text, created_at
    FROM note
    ORDER BY created_at DESC
  `);
  }
}
