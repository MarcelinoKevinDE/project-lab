const express = require('express');
const router = express.Router();

// Middleware untuk cek login (pakai passport)
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// GET: Halaman Pengaturan
router.get('/', isLoggedIn, (req, res) => {
  // Data user KA Lab yang ditampilkan di halaman pengaturan
  const user = {
    nama: 'Marcelino Kevin',
    email: 'kevinvionetta08@gmail.com',
    username: 'admin@Kevin',
    lab: 'Lab Ilmu Komputer',
    jumlahPengguna: 10,
    versi: 'vv1.2',
    terakhirUpdate: '15 Juni 2025'
  };

  res.render('pengaturan/index', { user });
});

module.exports = router;
