import { exec } from 'child_process';
import util from 'util';
import mysql from 'mysql2/promise';

const execAsync = util.promisify(exec);

export const config = {
  db: {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'password',
    database: 'todos_test'
  },
  api: {
    port: 3001
  }
};

export let connection = null;

async function isMySQLReady() {
  try {
    const tempConnection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: 5000 
    });
    await tempConnection.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function initializeDatabase() {
  try {
    console.log('Début de l\'initialisation de la base de données...');
    
    console.log('Tentative de connexion à MySQL sans spécifier de base de données...');
    const tempConn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: 10000 
    });
    
    console.log(`Création de la base de données ${config.db.database} si elle n\'existe pas...`);
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
    console.log('Base de données créée ou déjà existante.');
    
    await tempConn.query(`USE \`${config.db.database}\``);
    
    console.log('Suppression de la table tasks si elle existe...');
    await tempConn.query('DROP TABLE IF EXISTS tasks');
    
    console.log('Création de la table tasks...');
    await tempConn.query(`
      CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        state ENUM('todo', 'doing', 'done') DEFAULT 'todo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table tasks créée avec succès.');
    
    console.log('Insertion des données de test...');
    await tempConn.query(`
      INSERT INTO tasks (description, state) VALUES 
      ('Task 1 for integration tests', 'todo'),
      ('Task 2 for integration tests', 'doing'),
      ('Task 3 for integration tests', 'done')
    `);
    console.log('Données de test insérées avec succès.');
    
    connection = tempConn;
    
    console.log('Initialisation de la base de données terminée avec succès.');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

export async function startTestEnvironment() {
  try {
    console.log('Démarrage de l\'environnement de test...');
    
    console.log('Démarrage des conteneurs avec docker-compose...');
    await execAsync('docker-compose -f docker-compose.test.yml up -d');
    console.log('Conteneurs démarrés.');
    
    console.log('Attente de la disponibilité de MySQL...');
    let ready = false;
    let attempts = 0;
    const maxAttempts = 30; 
    
    while (!ready && attempts < maxAttempts) {
      attempts++;
      console.log(`Tentative ${attempts}/${maxAttempts} de connexion à MySQL...`);
      ready = await isMySQLReady();
      
      if (!ready) {
        console.log(`MySQL n'est pas encore prêt. Nouvelle tentative dans 2 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!ready) {
      throw new Error(`MySQL n'est pas disponible après ${maxAttempts} tentatives.`);
    }
    
    console.log('MySQL est prêt.');
    
    await initializeDatabase();
    
    console.log('✅ Environnement de test démarré avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de l\'environnement de test:', error);
    throw error;
  }
}

export async function stopTestEnvironment() {
  try {
    console.log('Arrêt de l\'environnement de test...');
    
    if (connection) {
      await connection.end();
      connection = null;
    }
    
    await execAsync('docker-compose -f docker-compose.test.yml down');
    
    console.log('Environnement de test arrêté');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt de l\'environnement de test:', error);
    throw error;
  }
}


export async function resetTestDatabase() {
  try {
    console.log('Réinitialisation de la base de données...');
    
    if (!connection) {
      console.log('Aucune connexion existante, création d\'une nouvelle connexion...');
      connection = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        connectTimeout: 10000
      });
    }
    
    console.log('Suppression des données existantes...');
    await connection.query('DELETE FROM tasks');
    
    console.log('Réinitialisation de l\'auto-increment...');
    await connection.query('ALTER TABLE tasks AUTO_INCREMENT = 1');
    
    console.log('Insertion des nouvelles données de test...');
    await connection.query(`
      INSERT INTO tasks (description, state) VALUES 
      ('Task 1 for integration tests', 'todo'),
      ('Task 2 for integration tests', 'doing'),
      ('Task 3 for integration tests', 'done')
    `);
    
    console.log('✅ Base de données réinitialisée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation de la base de données:', error);
    throw error;
  }
}
