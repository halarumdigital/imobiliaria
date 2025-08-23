import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && !process.env.MYSQL_DATABASE) {
  throw new Error("DATABASE_URL or MYSQL_DATABASE must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: process.env.DATABASE_URL ? {
    url: process.env.DATABASE_URL,
  } : {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'imobiliaria',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  },
});
