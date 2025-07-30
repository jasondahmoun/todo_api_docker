import { jest } from '@jest/globals';

const mockTasks = [
  { 
    id: 1, 
    description: 'Task 1', 
    state: 'todo',
    created_at: new Date('2025-07-20T10:00:00Z')
  },
  { 
    id: 2, 
    description: 'Task 2', 
    state: 'doing',
    created_at: new Date('2025-07-21T10:00:00Z')
  },
  { 
    id: 3, 
    description: 'Task 3', 
    state: 'done',
    created_at: new Date('2025-07-22T10:00:00Z')
  }
];

let nextId = 4;
let tasks = [...mockTasks];

const db = {
  query: jest.fn().mockImplementation((sql, params) => {
    if (sql.includes('RESET_MOCK_DB')) {
      tasks = [...mockTasks];
      return [{ affectedRows: mockTasks.length }];
    }
    
    if (sql === 'SELECT * FROM tasks') {
      return [tasks, []];
    }
    
    if (sql === 'SELECT * FROM tasks WHERE id = ?') {
      const id = parseInt(params[0]);
      const task = tasks.find(t => t.id === id);
      return [[task || []], []];
    }
    
    if (sql.includes('INSERT INTO tasks')) {
      const description = params[0];
      const newTask = { 
        id: nextId++, 
        description, 
        state: 'todo',
        created_at: new Date()
      };
      tasks.push(newTask);
      return [{ insertId: newTask.id }];
    }
    
    if (sql.startsWith('UPDATE tasks SET')) {
      const id = parseInt(params[params.length - 1]);
      const taskIndex = tasks.findIndex(t => t.id === id);
      
      if (taskIndex === -1) {
        return [{ affectedRows: 0 }];
      }
      
      if (sql.includes('description = ?') && sql.includes('state = ?')) {
        tasks[taskIndex] = { 
          ...tasks[taskIndex], 
          description: params[0],
          state: params[1]
        };
      } else if (sql.includes('description = ?')) {
        tasks[taskIndex] = { 
          ...tasks[taskIndex], 
          description: params[0]
        };
      } else if (sql.includes('state = ?')) {
        tasks[taskIndex] = { 
          ...tasks[taskIndex], 
          state: params[0]
        };
      }
      
      return [{ affectedRows: 1 }];
    }
    
    if (sql === 'DELETE FROM tasks WHERE id = ?') {
      const id = parseInt(params[0]);
      const initialLength = tasks.length;
      tasks = tasks.filter(t => t.id !== id);
      
      return [{ affectedRows: initialLength - tasks.length }];
    }
    
    return [[], []];
  })
};

export default db;
