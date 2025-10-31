import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} = process.env;

if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  throw new Error("MySQL credentials not found in .env file");
}

const poolConnection = mysql.createPool({
  host: MYSQL_HOST,
  port: parseInt(MYSQL_PORT || "3306", 10),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export async function initDatabase() {
  try {
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user'
      )
    `);
    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    console.log("Note: If you see 'Access denied', the MySQL user may not have CREATE privileges.");
    console.log("The application will try to continue, but user operations may fail if the table doesn't exist.");
  }
}

export { poolConnection };
