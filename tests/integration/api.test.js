import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { startTestEnvironment, stopTestEnvironment, resetTestDatabase, config } from './setup.js';
import * as dotenv from 'dotenv';

const originalEnv = process.env;

jest.setTimeout(120000); 

describe('Todo API - Tests d\'intégration', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    try {
      await startTestEnvironment();
      process.env.DB_HOST = config.db.host;
      process.env.DB_PORT = config.db.port;
      process.env.DB_USER = config.db.user;
      process.env.DB_PASS = config.db.password;
      process.env.DB_NAME = config.db.database;
      
      app = express();
      app.use(express.json());
      
      const db = await import('../../src/db.js').then(module => module.default);
      
      console.log('Initialisation de la connexion à la base de données pour les tests...');
      await db.initialize();
      console.log('Connexion à la base de données initialisée avec succès.');
      
      const routesModule = await import('../../src/routes.js');
      const routes = routesModule.default;
      
      app.use('/tasks', routes);
      
      server = app.listen(config.api.port);
      
      console.log('✅ Environnement de test API démarré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage des tests:', error);
      throw error;
    }
  }, 120000);
  
  afterAll(async () => {
    console.log('🧹 Nettoyage de l\'environnement de test...');
    
    if (server) {
      server.close();
    }
    
    process.env = originalEnv;
    
    await stopTestEnvironment();
    
    console.log('✅ Environnement de test nettoyé avec succès');
  }, 60000);
  
  beforeEach(async () => {
    try {
      await resetTestDatabase();
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation de la base de données:', error);
      throw error;
    }
  });

  describe('GET /tasks', () => {
    test('devrait retourner toutes les tâches', async () => {
      const response = await request(app).get('/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('state');
    }, 15000);
  });
  
  describe('GET /tasks/:id', () => {
    test('devrait retourner une tâche spécifique avec un ID valide', async () => {
      const response = await request(app).get('/tasks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('description', 'Task 1 for integration tests');
      expect(response.body).toHaveProperty('state', 'todo');
    }, 15000);
    
    test('devrait retourner 404 pour un ID inexistant', async () => {
      const response = await request(app).get('/tasks/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    }, 15000);
  });

  describe('POST /tasks', () => {
    test('devrait créer une nouvelle tâche', async () => {
      const newTask = {
        description: 'New integration test task',
        state: 'todo'
      };
      
      const response = await request(app)
        .post('/tasks')
        .send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('description', newTask.description);
      expect(response.body).toHaveProperty('state', newTask.state);
      expect(response.body).toHaveProperty('created_at');
      
      const getAllResponse = await request(app).get('/tasks');
      expect(getAllResponse.body.length).toBe(4);
    }, 15000);
    
    test('devrait retourner 400 si la description est manquante', async () => {
      const invalidTask = {
        state: 'todo'
      };
      
      const response = await request(app)
        .post('/tasks')
        .send(invalidTask);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    }, 15000);
  });

  describe('PUT /tasks/:id', () => {
    test('devrait mettre à jour la description d\'une tâche', async () => {
      const updatedTask = {
        description: 'Updated integration test task'
      };
      
      const response = await request(app)
        .put('/tasks/1')
        .send(updatedTask);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('description', updatedTask.description);
    }, 15000);
    
    test('devrait mettre à jour l\'état d\'une tâche', async () => {
      const updatedTask = {
        state: 'done'
      };
      
      const response = await request(app)
        .put('/tasks/1')
        .send(updatedTask);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('state', updatedTask.state);
    }, 15000);
    
    test('devrait retourner 400 pour un état invalide', async () => {
      const invalidTask = {
        state: 'invalid_state'
      };
      
      const response = await request(app)
        .put('/tasks/1')
        .send(invalidTask);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    }, 15000);
    
    test('devrait retourner 404 pour un ID inexistant', async () => {
      const response = await request(app)
        .put('/tasks/999')
        .send({ description: 'This task does not exist' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    }, 15000);
  });

  describe('DELETE /tasks/:id', () => {
    test('devrait supprimer une tâche', async () => {
      const response = await request(app).delete('/tasks/1');
      
      expect(response.status).toBe(204);
      
      const getResponse = await request(app).get('/tasks/1');
      expect(getResponse.status).toBe(404);
    }, 15000);
    
    test('devrait retourner 404 pour un ID inexistant', async () => {
      const response = await request(app).delete('/tasks/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    }, 15000);
  });
});
