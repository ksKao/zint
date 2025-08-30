import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "../db/schema";

/**
 * Represents the result of a SELECT query.
 */
export type SelectQueryResult = {
  [key: string]: unknown;
};

/**
 * Loads the sqlite database via the Tauri Proxy.
 */
export const sqlite = await Database.load("sqlite:app.db");

/**
 * The drizzle database instance.
 */
export const db = drizzle<typeof schema>(
  async (sql, params, method) => {
    let rows: unknown = [];
    let results = [];

    // If the query is a SELECT, use the select method
    if (isSelectQuery(sql)) {
      rows = await sqlite.select(sql, params);
    } else {
      // Otherwise, use the execute method
      rows = await sqlite.execute(sql, params);
      return { rows: [] };
    }

    if (Array.isArray(rows)) {
      rows = rows.map((row) => {
        return Object.values(row);
      });
    }

    if (Array.isArray(rows))
      // If the method is "all", return all rows
      results = method === "all" ? rows : rows[0];

    return { rows: results };
  },
  // Pass the schema to the drizzle instance
  { schema: schema, logger: true },
);

/**
 * Checks if the given SQL query is a SELECT query.
 * @param sql The SQL query to check.
 * @returns True if the query is a SELECT query, false otherwise.
 */
function isSelectQuery(sql: string): boolean {
  const selectRegex = /^\s*SELECT\b/i;
  return selectRegex.test(sql);
}
