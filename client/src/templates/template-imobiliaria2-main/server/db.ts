import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.warn("Could not load .env file");
}

const connection = mysql.createPool({
  host: process.env.MYSQL_HOST || "31.97.91.252",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "gilliard_imo2",
  password: process.env.MYSQL_PASSWORD || "Yc4TaC2wOoCq",
  database: process.env.MYSQL_DATABASE || "gilliard_imo2",
});

export const db = drizzle(connection, { schema, mode: "default" });
