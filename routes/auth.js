const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');

// Halaman login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Proses login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.render('login', { error: 'Username atau password salah.' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect('/home'); // Revisi: redirect ke halaman Home
    });
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// Halaman registrasi
router.get('/register', (req, res) => {
  res.render('register');
});

// Proses registrasi
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.redirect('/login');
});

module.exports = router;
