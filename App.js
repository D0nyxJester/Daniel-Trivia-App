const express = require('express');
const path = require('path');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const mysql = require('mysql2');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');
const apicache = require('apicache');
let cache = apicache.middleware;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySql Database.');
  // Create users table if it doesn't exist
  db.query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL DEFAULT 'user',
    displayName VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    provider VARCHAR(50)
  )`);
  // Create trivia_results table if it doesn't exist
  db.query(`CREATE TABLE IF NOT EXISTS trivia_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  question_difficulty VARCHAR(40),
  question_category VARCHAR(100),
  question TEXT,
  correct_answer VARCHAR(255),
  user_answer VARCHAR(255),
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
});


const app = express();
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
module.exports = app;

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || `http://localhost:3000/auth/github/callback`
},
  function (accessToken, refreshToken, profile, done) {

    const user = {
      id: profile.id,
      user_type: 'user',
      displayName: profile.displayName || profile.username,
      email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
      provider: profile.provider || 'github'
    };
    db.query('REPLACE INTO users SET ?', user, (err) => {
      if (err) console.error('DB error:', err);
      return done(null, profile);
    });
  }
));

// GitHub routes
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub callback
app.get('/auth/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      console.error('GitHub token error:', err);
      return res.status(500).send('Authentication failed. Please try again.');
    }
    if (!user) {
      console.warn('GitHub login failed:', info);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=login_failed`);
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('GitHub login session error:', err);
        return res.status(500).send('Session error. Please try again.');
      }
      return res.redirect(process.env.FRONTEND_URL);
    });
  })(req, res, next);
});

// Google Strategy stays the same
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:3000/auth/google/callback`
},
  function (accessToken, refreshToken, profile, done) {
    const user = {
      id: profile.id,
      user_type: 'user',
      displayName: profile.displayName,
      email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
      provider: profile.provider || 'google'
    };
    db.query('REPLACE INTO users SET ?', user, (err) => {
      if (err) console.error('DB error:', err);
      return done(null, profile);
    });
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Google token error:', err);
      return res.status(500).send('Authentication failed. Please try again.');
    }
    if (!user) {
      console.warn('Google login failed:', info);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=login_failed`);
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Google login session error:', err);
        return res.status(500).send('Session error. Please try again.');
      }
      return res.redirect(process.env.FRONTEND_URL);
    });
  })(req, res, next);
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}
// Middleware to check for specific user roles
function requireRole(...roles) {
  return function (req, res, next) {
    if (req.isAuthenticated() && roles.includes(req.user.user_type)) {
      return next();
    }
    res.status(403).json({ error: 'Forbidden' });
  };
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trivia API',
      version: '1.0.0',
      description: 'API documentation for Trivia App',
    },
  },
  apis: ['./App.js'], // Path to your API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/get-trivia', async (req, res) => {
  const questionAmount = 1; // Always fetch 1 question at a time
  const params = [];
  params.push(`amount=${questionAmount}`);
  if (req.query.category && req.query.category !== 'any') {
    params.push(`category=${req.query.category}`);
  }
  if (req.query.difficulty && req.query.difficulty !== 'any') {
    params.push(`difficulty=${req.query.difficulty}`);
  }
  if (req.query.type && req.query.type !== 'any') {
    params.push(`type=${req.query.type}`);
  }
  const url = `https://opentdb.com/api.php?${params.join('&')}`;
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save trivia result from frontend
app.post('/save-trivia-result', ensureAuthenticated, (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const { question_difficulty, question_category, question, correct_answer, user_answer, is_correct } = req.body;
  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });
  db.query(
    'INSERT INTO trivia_results (user_id, question_difficulty, question_category, question, correct_answer, user_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, question_difficulty, question_category, question, correct_answer, user_answer, is_correct],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.post('/save-trivia-answer', ensureAuthenticated, (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const { question_difficulty, question_category, question, correct_answer, user_answer, is_correct } = req.body;

  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  db.query(
    'INSERT INTO trivia_results (user_id, question_difficulty, question_category, question, correct_answer, user_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_id, question_difficulty, question_category, question, correct_answer, user_answer, is_correct],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Limit to 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
// Apply to all API routes
app.use('/api/', apiLimiter);

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({
    error: 'Not authenticated',
    code: 401,
    message: 'User is not logged in',
    help: 'Please log in via Google or GitHub'
  });
  res.json({ displayName: req.user.displayName });
});

app.get('/api/my-trivia-results', ensureAuthenticated, (req, res) => {
  const user_id = req.user ? req.user.id : null;
  if (!user_id) return res.json([]);
  db.query(
    'SELECT id, question_difficulty, question_category, question, correct_answer, user_answer, is_correct, created_at FROM trivia_results WHERE user_id = ? ORDER BY created_at DESC',
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});
app.delete('/api/my-trivia-results/:id', ensureAuthenticated, (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const result_id = req.params.id;

  if (!user_id) return res.status(401).json({ error: 'Not authenticated' });

  // Only allow users to delete their own results
  db.query(
    'DELETE FROM trivia_results WHERE id = ? AND user_id = ?',
    [result_id, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Result not found or not authorized' });
      }
      res.json({ success: true, message: 'Result deleted successfully' });
    }
  );
});

// RESTful CRUD endpoints for trivia questions
/**
 * @swagger
 * /api/trivia-questions-database:
 *   post:
 *     summary: Add a new trivia question
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_category:
 *                 type: string
 *               question:
 *                 type: string
 *               correct_answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// CREATE (Add a new trivia question)
app.post('/api/trivia-questions-database', ensureAuthenticated, requireRole('admin', 'user'), (req, res) => {
  const { question_category, question, correct_answer } = req.body;
  const user_id = req.user ? req.user.id : null;
  db.query(
    'INSERT INTO trivia_results (user_id, question_category, question, correct_answer) VALUES (?, ?, ?, ?)',
    [user_id, question_category, question, correct_answer],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// READ (Get all trivia questions)
/**
 * @swagger
 * /api/trivia-questions-database:
 *   get:
 *     summary: Get all trivia questions
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   question_category:
 *                     type: string
 *                   question:
 *                     type: string
 *                   correct_answer:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
app.get('/api/trivia-questions-database', cache('5 minutes'), ensureAuthenticated, (req, res) => {
  db.query('SELECT id, question_category, question, correct_answer FROM trivia_results', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// READ (Get one trivia question by ID)
/**
 * @swagger
 * /api/trivia-questions-database/{id}:
 *   get:
 *     summary: Get a trivia question by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 question_category:
 *                   type: string
 *                 question:
 *                   type: string
 *                 correct_answer:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/api/trivia-questions-database/:id', ensureAuthenticated, (req, res) => {
  db.query('SELECT id, question_category, question, correct_answer FROM trivia_results WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// UPDATE (Change a trivia question)
/**
 * @swagger
 * /api/trivia-questions-database/{id}:
 *   put:
 *     summary: Update a trivia question
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_category:
 *                 type: string
 *               question:
 *                 type: string
 *               correct_answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.put('/api/trivia-questions-database/:id', ensureAuthenticated, (req, res) => {
  const { question_category, question, correct_answer } = req.body;
  db.query(
    'UPDATE trivia_results SET question_category = ?, question = ?, correct_answer = ? WHERE id = ?',
    [question_category, question, correct_answer, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE (Remove a trivia question)
/**
 * @swagger
 * /api/trivia-questions/{id}:
 *   delete:
 *     summary: Delete a trivia question
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.delete('/api/trivia-questions-database/:id', ensureAuthenticated, requireRole('admin'), (req, res) => {
  db.query('DELETE FROM trivia_results WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect(process.env.FRONTEND_URL);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
