const express = require('express');
const path = require('path');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;  
const session = require('express-session');
const mysql = require('mysql2');

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
  console.log('Connected to Database.');
  db.query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    displayName VARCHAR(255),
    email VARCHAR(255),
    provider VARCHAR(50)
  )`);
});

const app = express();

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

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
  res.send(`Hello ${req.user.displayName}, welcome to my website!`);
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));