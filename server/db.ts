import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// Parse MySQL connection string or use individual env vars
function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'imobiliaria',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  };
}

let connection: mysql.Connection;
let db: ReturnType<typeof drizzle>;

async function initDatabase() {
  const config = getConnectionConfig();
  
  if (typeof config === 'string') {
    connection = await mysql.createConnection(config);
  } else {
    connection = await mysql.createConnection(config);
  }
  
  db = drizzle(connection, { schema, mode: 'default' });
  return { connection, db };
}

// Initialize database connection
const dbPromise = initDatabase();

export { connection, db, dbPromise };
