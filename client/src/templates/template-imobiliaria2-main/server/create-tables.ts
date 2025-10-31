import mysql from "mysql2/promise";

async function createTables() {
  const connection = await mysql.createConnection({
    host: "31.97.91.252",
    port: 3306,
    user: "gilliard_imo2",
    password: "Yc4TaC2wOoCq",
    database: "gilliard_imo2",
  });

  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("✓ Table 'users' created");

    // Create properties table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        price INT NOT NULL,
        price_type VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        featured INT NOT NULL DEFAULT 0,
        location VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        beds INT NOT NULL,
        baths INT NOT NULL,
        sqft INT NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(1000) NOT NULL,
        images TEXT NOT NULL,
        amenities TEXT NOT NULL
      )
    `);
    console.log("✓ Table 'properties' created");

    console.log("\n✅ All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
}

createTables();
