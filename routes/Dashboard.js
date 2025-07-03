const express = require('express');
const router = express.Router();
const Barang = require('../models/Barang');
const Peminjaman = require('../models/peminjaman');

// Middleware Autentikasi
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Route Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const barangList = await Barang.find({});
    const peminjamanAktif = await Peminjaman.find({ status: 'dipinjam' }).populate('barangDipinjam');

    // Hitung jumlah barang dipinjam per barang
    const jumlahDipinjamMap = {};
    peminjamanAktif.forEach(p => {
      if (p.barangDipinjam && p.barangDipinjam._id) {
        const id = p.barangDipinjam._id.toString();
        jumlahDipinjamMap[id] = (jumlahDipinjamMap[id] || 0) + (p.jumlah || 0);
      }
    });

    // Persiapan data barang untuk tampilan
    const barangListWithStats = barangList.map(barang => {
      const dipinjam = jumlahDipinjamMap[barang._id.toString()] || 0;
      const tersedia = Math.max(0, barang.jumlah - dipinjam);
      const persentase = barang.jumlah > 0 ? Math.round((tersedia / barang.jumlah) * 100) : 0;

      return {
        ...barang.toObject(),
        tersedia,
        dipinjam,
        persentase
      };
    });

    // Kirim data ke tampilan dashboard.ejs
    res.render('dashboard', {
      username: req.user ? req.user.username : 'User',
      role: req.user ? req.user.role : 'guest',
      barangList: barangListWithStats,
      totalBarang: barangList.length,
      totalTersedia: barangListWithStats.reduce((sum, barang) => sum + barang.tersedia, 0),
      totalPeminjaman: peminjamanAktif.length
    });

  } catch (err) {
    console.error('❌ Gagal memuat dashboard:', err.message);
    res.status(500).send('Gagal memuat dashboard');
  }
});

module.exports = router;
