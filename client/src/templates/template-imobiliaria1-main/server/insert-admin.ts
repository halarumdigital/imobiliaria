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

async function insertAdmin() {
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
    const adminUsername = "admin";
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();

    console.log("Checking if admin user already exists...");
    const [existingUsers] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [adminUsername]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log("⚠ Admin user already exists");
    } else {
      console.log("Creating admin user...");
      await connection.query(
        "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
        [adminId, adminUsername, hashedPassword, "admin"]
      );
      console.log("✓ Admin user created successfully");
      console.log("\n=== CREDENCIAIS DO ADMINISTRADOR ===");
      console.log("  Usuário: admin");
      console.log("  Senha: admin123");
      console.log("=====================================");
      console.log("  IMPORTANTE: Altere esta senha após o primeiro login!");
    }
  } catch (error: any) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      console.error("\n✗ Erro: A tabela 'users' não existe!");
      console.error("Execute o arquivo 'create-table.sql' no seu banco de dados MySQL primeiro.");
    } else {
      console.error("Error inserting admin:", error.message);
    }
    throw error;
  } finally {
    await connection.end();
  }
}

insertAdmin()
  .then(() => {
    console.log("\n✓ Processo concluído com sucesso");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Processo falhou");
    process.exit(1);
  });
