import express from 'express';
import routes from './routes.js';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/tasks', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API ready on port ${PORT}`)
);