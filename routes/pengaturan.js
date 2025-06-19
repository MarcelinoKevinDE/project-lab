// routes/pengaturan.js
const express = require('express');
const router = express.Router();

// middleware jika perlu login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.get('/', isLoggedIn, (req, res) => {
  res.render('pengaturan/index'); // pastikan view-nya ada: views/pengaturan/index.ejs
});

module.exports = router;
