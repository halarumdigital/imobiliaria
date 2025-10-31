import { config } from "dotenv";
config();

import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
} = process.env;

async function setupAdmin() {
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error("MySQL credentials not found in .env file");
  }

  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT || "3306", 10),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  });

  try {
    console.log("Creating users table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user'
      )
    `);
    console.log("✓ Users table created successfully");

    const adminUsername = "admin";
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();

    const [existingUsers] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [adminUsername]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log("⚠ Admin user already exists");
    } else {
      await connection.query(
        "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
        [adminId, adminUsername, hashedPassword, "admin"]
      );
      console.log("✓ Admin user created successfully");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("  IMPORTANT: Change this password in production!");
    }
  } catch (error: any) {
    console.error("Error setting up admin:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

setupAdmin()
  .then(() => {
    console.log("\n✓ Setup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Setup failed:", error);
    process.exit(1);
  });
