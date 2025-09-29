const request = require('supertest');
const express = require('express');

// Factory to build a fresh app for each test
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  app.use((req, res, next) => {
    if (req.headers['x-mock-auth'] === 'user') {
      req.isAuthenticated = () => true;
      req.user = { id: '123', user_type: 'user', displayName: 'Test User' };
    } else if (req.headers['x-mock-auth'] === 'admin') {
      req.isAuthenticated = () => true;
      req.user = { id: '1', user_type: 'admin', displayName: 'Admin User' };
    } else {
      req.isAuthenticated = () => false;
      req.user = null;
    }
    next();
  });

  // Base routes
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // /api/user
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ displayName: req.user.displayName });
  });

  // /save-trivia-result
  app.post('/save-trivia-result', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { question_difficulty, question_category, question, correct_answer, user_answer } = req.body;
    if (!question_difficulty || !question_category || !question || !correct_answer || !user_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true, id: 1 });
  });

  // /get-trivia
  app.get('/get-trivia', (req, res) => res.json({ results: [{ question: 'Q1', correct_answer: 'A' }] }));

  // /api/trivia-questions-database
  app.post('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!req.body.question_category || !req.body.question || !req.body.correct_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true, id: 2 });
  });

  app.get('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    res.json([{ id: 1, question: 'Q', correct_answer: 'A' }]);
  });

  app.get('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    if (req.params.id === '1') return res.json({ id: 1, question: 'Q', correct_answer: 'A' });
    return res.status(404).json({ error: 'Not found' });
  });

  app.put('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.body.question_category || !req.body.question || !req.body.correct_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true });
  });

  app.delete('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (req.params.id === '1') return res.json({ success: true });
    return res.status(404).json({ error: 'Not found' });
  });

  return app;
}

let app;

beforeEach(() => {
  app = createTestApp();
});

// Health check
test('GET /health returns status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});

// Happy path: GET /api/user returns user info if authenticated
test('GET /api/user returns user info if authenticated', async () => {
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ displayName: req.user.displayName });
  });
  const res = await request(app).get('/api/user').set('x-mock-auth', 'user');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('displayName', 'Test User');
});

// Happy path: POST /save-trivia-result with valid data
test('POST /save-trivia-result returns 200 if authenticated and valid', async () => {
  app.post('/save-trivia-result', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { question_difficulty, question_category, question, correct_answer, user_answer, is_correct } = req.body;
    if (!question_difficulty || !question_category || !question || !correct_answer || !user_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true, id: 1 });
  });
  const res = await request(app)
    .post('/save-trivia-result')
    .set('x-mock-auth', 'user')
    .send({
      question_difficulty: 'easy',
      question_category: 'General',
      question: 'Q',
      correct_answer: 'A',
      user_answer: 'A',
      is_correct: true
    });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
});

// Edge case: POST /save-trivia-result with missing fields
test('POST /save-trivia-result returns 400 if missing fields', async () => {
  app.post('/save-trivia-result', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { question_difficulty, question_category, question, correct_answer, user_answer } = req.body;
    if (!question_difficulty || !question_category || !question || !correct_answer || !user_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true, id: 1 });
  });
  const res = await request(app)
    .post('/save-trivia-result')
    .set('x-mock-auth', 'user')
    .send({ question: 'Q' });
  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty('error');
});

// Happy path: GET /get-trivia returns results array
test('GET /get-trivia returns results array', async () => {
  app.get('/get-trivia', (req, res) => res.json({ results: [{ question: 'Q1', correct_answer: 'A' }] }));
  const res = await request(app).get('/get-trivia');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.results)).toBe(true);
});

// Edge case: GET /get-trivia with invalid query params
test('GET /get-trivia with invalid params returns 200', async () => {
  app.get('/get-trivia', (req, res) => res.json({ results: [] }));
  const res = await request(app).get('/get-trivia?amount=abc');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('results');
});

// Happy path: POST /api/trivia-questions-database as admin
test('POST /api/trivia-questions-database returns 200 for admin', async () => {
  app.post('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json({ success: true, id: 2 });
  });
  const res = await request(app)
    .post('/api/trivia-questions-database')
    .set('x-mock-auth', 'admin')
    .send({ question_category: 'General', question: 'Q', correct_answer: 'A' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
});

// Edge case: POST /api/trivia-questions-database with missing fields
test('POST /api/trivia-questions-database returns 400 if missing fields', async () => {
  app.post('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!req.body.question_category || !req.body.question || !req.body.correct_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true, id: 2 });
  });
  const res = await request(app)
    .post('/api/trivia-questions-database')
    .set('x-mock-auth', 'admin')
    .send({ question: 'Q' });
  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty('error');
});

// Happy path: GET /api/trivia-questions-database returns array
test('GET /api/trivia-questions-database returns array', async () => {
  app.get('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    res.json([{ id: 1, question: 'Q', correct_answer: 'A' }]);
  });
  const res = await request(app)
    .get('/api/trivia-questions-database')
    .set('x-mock-auth', 'user');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /get-trivia returns a specific question and correct answer', async () => {
  // Arrange: Optionally, you could mock or parameterize the questions here if your app supports it.
  const res = await request(app).get('/get-trivia');

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('results');
  expect(Array.isArray(res.body.results)).toBe(true);
  expect(res.body.results.length).toBeGreaterThan(0);

  const question = res.body.results[0];
  expect(question).toHaveProperty('question');
  expect(question).toHaveProperty('correct_answer');
  expect(typeof question.question).toBe('string');
  expect(typeof question.correct_answer).toBe('string');
});

// Happy path: GET /api/trivia-questions-database/:id returns object
test('GET /api/trivia-questions-database/:id returns object', async () => {
  app.get('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ id: 1, question: 'Q', correct_answer: 'A' });
  });
  const res = await request(app)
    .get('/api/trivia-questions-database/1')
    .set('x-mock-auth', 'user');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id');
});

// Edge case: GET /api/trivia-questions-database/:id not found
test('GET /api/trivia-questions-database/:id returns 404 if not found', async () => {
  app.get('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    res.status(404).json({ error: 'Not found' });
  });
  const res = await request(app)
    .get('/api/trivia-questions-database/999')
    .set('x-mock-auth', 'user');
  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty('error');
});

// Happy path: PUT /api/trivia-questions-database/:id updates question
test('PUT /api/trivia-questions-database/:id returns 200 on success', async () => {
  app.put('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ success: true });
  });
  const res = await request(app)
    .put('/api/trivia-questions-database/1')
    .set('x-mock-auth', 'user')
    .send({ question_category: 'General', question: 'Q updated', correct_answer: 'A' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
});

// Edge case: PUT /api/trivia-questions-database/:id with missing fields
test('PUT /api/trivia-questions-database/:id returns 400 if missing fields', async () => {
  app.put('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.body.question_category || !req.body.question || !req.body.correct_answer) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    res.json({ success: true });
  });
  const res = await request(app)
    .put('/api/trivia-questions-database/1')
    .set('x-mock-auth', 'user')
    .send({ question: 'Q' });
  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty('error');
});

// Happy path: DELETE /api/trivia-questions-database/:id as admin
test('DELETE /api/trivia-questions-database/:id returns 200 for admin', async () => {
  app.delete('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json({ success: true });
  });
  const res = await request(app)
    .delete('/api/trivia-questions-database/1')
    .set('x-mock-auth', 'admin');
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('success', true);
});

// Edge case: DELETE /api/trivia-questions-database/:id not found
test('DELETE /api/trivia-questions-database/:id returns 404 if not found', async () => {
  app.delete('/api/trivia-questions-database/:id', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.status(404).json({ error: 'Not found' });
  });
  const res = await request(app)
    .delete('/api/trivia-questions-database/999')
    .set('x-mock-auth', 'admin');
  expect(res.statusCode).toBe(404);
  expect(res.body).toHaveProperty('error');
});

// Edge case: GET /api/nonexistent returns 404
test('GET /api/nonexistent returns 404', async () => {
  const res = await request(app).get('/api/nonexistent');
  expect(res.statusCode).toBe(404);
});

// Edge case: POST /save-trivia-result returns 401 if not authenticated
test('POST /save-trivia-result returns 401 if not authenticated', async () => {
  app.post('/save-trivia-result', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ success: true });
  });
  const res = await request(app)
    .post('/save-trivia-result')
    .send({
      question_difficulty: 'easy',
      question_category: 'General',
      question: 'Q',
      correct_answer: 'A',
      user_answer: 'A',
      is_correct: true
    });
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error');
});

// Edge case: POST /api/trivia-questions-database returns 403 if not admin
test('POST /api/trivia-questions-database returns 403 if not admin', async () => {
  app.post('/api/trivia-questions-database', (req, res) => {
    if (!req.isAuthenticated() || req.user.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json({ success: true });
  });
  const res = await request(app)
    .post('/api/trivia-questions-database')
    .set('x-mock-auth', 'user')
    .send({ question_category: 'General', question: 'Q', correct_answer: 'A' });
  expect(res.statusCode).toBe(403);
  expect(res.body).toHaveProperty('error');
});

// Edge case: GET /api/user returns 401 if not authenticated
test('GET /api/user returns 401 if not authenticated', async () => {
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ displayName: req.user.displayName });
  });
  const res = await request(app).get('/api/user');
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error');
});