import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

let pool;

const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

pool = createPool();

const ensureDatabase = async () => {
  const dbName = process.env.DB_NAME || 'todos';
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Base de données '${dbName}' vérifiée/créée avec succès`);
    
    await pool.query(`USE \`${dbName}\``);
    console.log(`✅ Utilisation de la base de données '${dbName}'`);
    
    return true;
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification/création de la base de données '${dbName}':`, err);
    throw err;
  }
};

const reconnect = async () => {
  if (pool) {
    await pool.end().catch(err => console.error('Erreur lors de la fermeture de la pool:', err));
  }
  
  pool = createPool();
  
  await ensureDatabase();
  try {
    await pool.query('SELECT 1');
    console.log('✅ Reconnexion à la base de données réussie');
    return true;
  } catch (err) {
    console.error('❌ Échec de la reconnexion à la base de données:', err);
    throw err;
  }
};

const initialize = async () => {
  try {
    await ensureDatabase();
    return true;
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
    return false;
  }
};

export default {
  query: (sql, params) => pool.query(sql, params),
  reconnect,
  initialize
};
