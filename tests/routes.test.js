import { jest } from '@jest/globals';
import { Router } from 'express';
import request from 'supertest';
import express from 'express';

jest.unstable_mockModule('../src/db.js', () => import('./db.mock.js'));

describe('Todo API Routes', () => {
  let app;
  let routes;
  let mockDb;

  beforeEach(async () => {
    jest.resetModules();
    
    mockDb = (await import('./db.mock.js')).default;
    routes = (await import('../src/routes.js')).default;
    
    app = express();
    app.use(express.json());
    app.use('/tasks', routes);
    
    await mockDb.query('RESET_MOCK_DB');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    test('devrait retourner toutes les tâches', async () => {
      const response = await request(app).get('/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].id).toBe(1);
      expect(response.body[1].id).toBe(2);
      expect(response.body[2].id).toBe(3);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM tasks');
    });

    test('devrait gérer les erreurs de base de données', async () => {
      mockDb.query.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app).get('/tasks');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch tasks');
    });
  });

  describe('GET /tasks/:id', () => {
    test('devrait retourner une tâche spécifique avec un ID valide', async () => {
      const response = await request(app).get('/tasks/2');
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(2);
      expect(response.body.description).toBe('Task 2');
      expect(response.body.state).toBe('doing');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE id = ?',
        ['2']
      );
    });

    test('devrait retourner 404 pour un ID inexistant', async () => {
      mockDb.query.mockImplementationOnce(() => [[], []]);
      
      const response = await request(app).get('/tasks/999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('devrait gérer les erreurs de base de données', async () => {
      mockDb.query.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app).get('/tasks/1');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch task');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('devrait mettre à jour la description d\'une tâche', async () => {
      const response = await request(app)
        .put('/tasks/1')
        .send({ description: 'Updated Task 1' });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.description).toBe('Updated Task 1');
      expect(response.body.state).toBe('todo');
    });

    test('devrait mettre à jour l\'état d\'une tâche', async () => {
      const response = await request(app)
        .put('/tasks/1')
        .send({ state: 'doing' });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.state).toBe('doing');
    });

    test('devrait mettre à jour la description et l\'état d\'une tâche', async () => {
      const response = await request(app)
        .put('/tasks/1')
        .send({ 
          description: 'Completely Updated Task', 
          state: 'done'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.description).toBe('Completely Updated Task');
      expect(response.body.state).toBe('done');
    });

    test('devrait retourner 400 si aucun champ n\'est fourni', async () => {
      const response = await request(app)
        .put('/tasks/1')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('At least one field (description or state) is required');
    });

    test('devrait retourner 400 pour un état invalide', async () => {
      const response = await request(app)
        .put('/tasks/1')
        .send({ state: 'invalid_state' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('State must be one of: todo, doing, done');
    });

    test('devrait retourner 404 pour un ID inexistant', async () => {
      mockDb.query.mockImplementationOnce(() => [{ affectedRows: 0 }]);
      
      const response = await request(app)
        .put('/tasks/999')
        .send({ description: 'Updated Task' });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('devrait gérer les erreurs de base de données', async () => {
      mockDb.query.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const response = await request(app)
        .put('/tasks/1')
        .send({ description: 'Updated Task' });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update task');
    });
  });
});
