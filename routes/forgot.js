const express = require('express');
const router = express.Router();

// Tampilan form forgot password
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password'); // Pastikan file views/forgot-password.ejs sudah sesuai
});

// Proses reset password menggunakan username
router.post('/forgot-password', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.send('Username wajib diisi');
  }

  // Simulasi: nanti bisa cek username ke database dan kirim link reset
  console.log(`Permintaan reset password untuk username: ${username}`);

  res.send(`Instruksi reset password telah dikirim ke akun ${username}`);
});

module.exports = router;
