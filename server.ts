import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { handleAssistantChat } from './server/gemini.ts';
import { executeTool } from './server/tools.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// 1. Assistant Chat Endpoint
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, history = [], currentUser } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const userContext = currentUser || {
      role: 'student',
      student_id: 'STU-101',
      name: 'Alex Rivera',
      email: 'alex.rivera@college.edu',
      course: 'Computer Science, B.S.',
    };

    const result = await handleAssistantChat(message, history, userContext);
    const dbState = db.getFullState();

    res.json({
      text: result.text,
      toolLogs: result.toolLogs,
      dbState,
    });
  } catch (err: any) {
    console.error('Error in /api/assistant/chat:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Direct Tool Execution Endpoint (for testing or UI direct actions)
app.post('/api/tools/execute', (req, res) => {
  try {
    const { tool, args, currentUser } = req.body;
    const userContext = currentUser || {
      role: 'student',
      student_id: 'STU-101',
      name: 'Alex Rivera',
      email: 'alex.rivera@college.edu',
    };
    const result = executeTool(tool, args, userContext);
    const dbState = db.getFullState();
    res.json({ result, dbState });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Database State Endpoint
app.get('/api/database/state', (req, res) => {
  res.json(db.getFullState());
});

// 4. Reset Database to Seed State
app.post('/api/database/reset', (req, res) => {
  db.reset();
  res.json({ message: 'Database reset to initial state', state: db.getFullState() });
});

// 5. REST endpoints for UI operations
app.get('/api/database/users', (req, res) => {
  res.json({ users: db.getAllUsers() });
});

app.post('/api/registrations', (req, res) => {
  try {
    const { student_id, event_id } = req.body;
    if (!student_id || !event_id) {
      res.status(400).json({ error: 'student_id and event_id are required' });
      return;
    }
    const regRes = db.registerStudent(student_id, event_id);
    if (!regRes.success) {
      res.status(400).json({ error: regRes.error });
      return;
    }
    const calRes = db.createCalendarEvent(student_id, event_id);
    res.json({
      registration: regRes.registration,
      calendar: calRes,
      state: db.getFullState(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { role = 'admin' } = req.headers;
    if (role !== 'admin') {
      res.status(403).json({ error: 'Only administrators can create events' });
      return;
    }
    const createRes = db.createEvent(req.body);
    if (!createRes.success) {
      res.status(400).json({ error: createRes.error });
      return;
    }
    res.json({ event: createRes.event, state: db.getFullState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', (req, res) => {
  try {
    const { role = 'admin' } = req.headers;
    if (role !== 'admin') {
      res.status(403).json({ error: 'Only administrators can update events' });
      return;
    }
    const updated = db.updateEvent(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ event: updated, state: db.getFullState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', (req, res) => {
  try {
    const { role = 'admin' } = req.headers;
    if (role !== 'admin') {
      res.status(403).json({ error: 'Only administrators can delete events' });
      return;
    }
    const success = db.deleteEvent(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ success: true, state: db.getFullState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mount Vite or static dist
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`College Event Management server running on http://0.0.0.0:${port}`);
  });
}

setupServer();
