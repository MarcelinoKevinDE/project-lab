const express = require('express');
const router = express.Router();

router.get('/forgot-password', (req, res) => {
  res.send('Fitur forgot password belum diaktifkan penuh');
});

module.exports = router;
