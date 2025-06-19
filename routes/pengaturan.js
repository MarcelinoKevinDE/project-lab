const express = require('express');
const router = express.Router();

// Middleware untuk cek login (jika perlu)
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// GET: Halaman Pengaturan
router.get('/', isLoggedIn, (req, res) => {
  // Kirim data dummy KA Lab (bisa diganti dari database)
  const user = {
    nama: 'ZA ZA',
    email: 'za@example.com',
    username: 'zalab',
    lab: 'Lab Kimia Analitik',
    jumlahPengguna: 10,
    versi: 'v1.2',
    terakhirUpdate: '15 Juni 2025'
  };

  res.render('pengaturan/index', { user });
});

module.exports = router;
