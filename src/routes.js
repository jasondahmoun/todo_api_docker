import { Router } from 'express';
import db from './db.js';
const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const [result] = await db.query(
      'INSERT INTO tasks (description) VALUES (?)',
      [description]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      description, 
      state: 'todo',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, state } = req.body;
    
    if (!description && !state) {
      return res.status(400).json({ error: 'At least one field (description or state) is required' });
    }
    
    if (state && !['todo', 'doing', 'done'].includes(state)) {
      return res.status(400).json({ error: 'State must be one of: todo, doing, done' });
    }
    
    let sql = 'UPDATE tasks SET ';
    const params = [];
    
    if (description) {
      sql += 'description = ?';
      params.push(description);
      if (state) {
        sql += ', state = ?';
        params.push(state);
      }
    } else {
      sql += 'state = ?';
      params.push(state);
    }
    
    sql += ' WHERE id = ?';
    params.push(req.params.id);
    
    const [result] = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;