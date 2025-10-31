import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

async function seedAdmin() {
  const connection = await mysql.createConnection({
    host: "31.97.91.252",
    port: 3306,
    user: "gilliard_imo2",
    password: "Yc4TaC2wOoCq",
    database: "gilliard_imo2",
  });

  try {
    const hashedPassword = "$2b$10$r5MfAfDA2NcjA.lrHGQZ.ejOyrWuS4M2ReEwzD.N7DO/DM0V7BbXG";
    const userId = randomUUID();
    
    await connection.execute(
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = ?",
      [userId, "admin", hashedPassword, hashedPassword]
    );

    console.log("✅ Admin user created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await connection.end();
  }
}

seedAdmin();
