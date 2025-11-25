const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'evoting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com banco de dados estabelecida');
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com banco de dados:', err.message || err);
    return false;
  }
}

if (require.main === module) {
  // Permite executar `node backend/config/db.js` para testar conexão
  testConnection().then(ok => process.exit(ok ? 0 : 1));
}

module.exports = pool;