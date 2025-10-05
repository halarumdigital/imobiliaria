const mysql = require('mysql2/promise');

async function checkLeadsTable() {
  const connection = await mysql.createConnection({
    host: '31.97.91.252',
    user: 'gilliard_imobi',
    password: 'kNW70PtsOWMh',
    database: 'gilliard_imobi'
  });

  console.log('Connected to database');

  try {
    // Check if leads table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'leads'");
    console.log('Tables found:', tables);

    if (tables.length > 0) {
      console.log('✅ Leads table exists!');

      // Show table structure
      const [structure] = await connection.execute('DESCRIBE leads');
      console.log('Table structure:', structure);

      // Count records
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM leads');
      console.log('Number of records:', count[0].count);
    } else {
      console.log('❌ Leads table does not exist!');
    }
  } catch (error) {
    console.error('❌ Error checking leads table:', error);
  } finally {
    await connection.end();
  }
}

checkLeadsTable();