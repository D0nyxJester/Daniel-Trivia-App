const express = require('express');
const path = require('path');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
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
  console.log('Connected to Amazon RDS.');
  // Create users table if not exists
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

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_liteprofile'],
},
function(accessToken, refreshToken, profile, done) {
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
    provider: profile.provider || 'linkedin'
  };
  db.query('REPLACE INTO users SET ?', user, (err) => {
    if (err) console.error('DB error:', err);
    return done(null, profile);
  });
}
));

app.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: true })
);

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

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

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.send(`Hello, ${req.user.displayName}`);
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));