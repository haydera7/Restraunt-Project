import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './db.js';
import ingredientsRouter from './routes/ingredients.js';
import menuItemsRouter from './routes/menuItems.js';
import tallyRouter from './routes/tally.js';
import authRouter from './routes/auth.js';
import { authRequired } from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/ingredients', authRequired, ingredientsRouter);
app.use('/api/menu-items', authRequired, menuItemsRouter);
app.use('/api/tally', authRequired, tallyRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
