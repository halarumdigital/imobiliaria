import { getStorage } from '../server/storage.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const storage = getStorage();
  await storage.init();

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'imobiliaria',
  });

  try {
    console.log('Starting migration...');

    // Adicionar campo amenities
    await connection.execute(`
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS amenities JSON DEFAULT ('[]')
    `);
    console.log('✓ Added amenities column');

    // Remover campos obsoletos
    try {
      await connection.execute(`ALTER TABLE properties DROP COLUMN has_service_area`);
      console.log('✓ Dropped has_service_area column');
    } catch (error) {
      console.log('- has_service_area column does not exist (or already dropped)');
    }

    try {
      await connection.execute(`ALTER TABLE properties DROP COLUMN has_social_bathroom`);
      console.log('✓ Dropped has_social_bathroom column');
    } catch (error) {
      console.log('- has_social_bathroom column does not exist (or already dropped)');
    }

    try {
      await connection.execute(`ALTER TABLE properties DROP COLUMN has_tv_room`);
      console.log('✓ Dropped has_tv_room column');
    } catch (error) {
      console.log('- has_tv_room column does not exist (or already dropped)');
    }

    // Atualizar valores NULL
    await connection.execute(`
      UPDATE properties
      SET amenities = '[]'
      WHERE amenities IS NULL
    `);
    console.log('✓ Updated NULL amenities to empty arrays');

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

runMigration();