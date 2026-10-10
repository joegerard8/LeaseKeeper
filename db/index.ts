import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let sqlite: Database.Database | null = null;

// Reused across hot reloads in dev instead of opening a new file handle
// (and losing WAL state) on every module reload.
function getSqlite() {
  if (!sqlite) {
    const dbPath = path.join(process.cwd(), "local.db");
    sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
  }
  return sqlite;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}
