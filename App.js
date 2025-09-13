const express = require('express');
const path = require('path');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;  
const session = require('express-session');
const mysql = require('mysql2');
const axios = require('axios');
const bcrypt = require('bcrypt');


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
  question TEXT,
  user_answer VARCHAR(255),
  is_correct BOOLEAN,
  correct_answer VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
});

const app = express();

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {

    const user = {
      id: profile.id,
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
  passport.authenticate('github', { scope: [ 'user:email' ] })
);

app.get('/auth/github/callback', (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      console.error('GitHub token error:', err);
      return res.status(500).send('Authentication failed. Please try again.');
    }
    if (!user) {
      console.warn('GitHub login failed:', info);
      return res.redirect('/?error=login_failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('GitHub login session error:', err);
        return res.status(500).send('Session error. Please try again.');
      }
      return res.redirect('/profile');
    });
  })(req, res, next);
});

// Google Strategy stays the same
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
function(accessToken, refreshToken, profile, done) {
  const user = {
    id: profile.id,
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

app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Google token error:', err);
      return res.status(500).send('Authentication failed. Please try again.');
    }
    if (!user) {
      console.warn('Google login failed:', info);
      return res.redirect('/?error=login_failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Google login session error:', err);
        return res.status(500).send('Session error. Please try again.');
      }
      return res.redirect('/profile');
    });
  })(req, res, next);
});

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'profile', 'index.html'));
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.json({ displayName: 'Guest' });
  res.json({ displayName: req.user.displayName });
});

app.get('/get-trivia', async (req, res) => {
  const amount = req.query.amount || 10;
  const params = [];
  params.push(`amount=${amount}`);
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
    console.log('Trivia API URL:', url);
    const response = await axios.get(url);
      res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/save-trivia-result', (req, res) => {
  const user_id = req.user ? req.user.id : null;
  const { question, correct_answer, user_answer, is_correct } = req.body;
    db.query(
    'INSERT INTO trivia_results (user_id, question, user_answer, correct_answer) VALUES (?, ?, ?, ?)',
    [user_id, question, user_answer, correct_answer],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.get('/api/my-trivia-results', (req, res) => {
  const user_id = req.user ? req.user.id : null;
  if (!user_id) return res.json([]);
  db.query(
    'SELECT question, user_answer, correct_answer, is_correct, created_at FROM trivia_results WHERE user_id = ? ORDER BY created_at DESC',
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

app.post('/logout', (req, res) => {
  if (req.user && req.user.id) {
    db.query('DELETE FROM users WHERE id = ?', [req.user.id], (err) => {
      if (err) console.error('Error deleting user:', err);
      req.logout(() => {
        req.session.destroy(() => {
          res.redirect('/');
        });
      });
    });
  } else {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect('/');
      });
    });
  }
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));