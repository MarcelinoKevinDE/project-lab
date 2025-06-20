const express = require('express');
const router = express.Router();
const Barang = require('../models/Barang');
const Peminjaman = require('../models/Peminjam');

// Route dashboard utama
router.get('/dashboard', async (req, res) => {
  try {
    // Ambil semua barang
    const barangList = await Barang.find({});

    // Ambil semua peminjaman aktif
    const peminjamanAktif = await Peminjaman.find({ status: 'dipinjam' });

    // Hitung jumlah barang yang sedang dipinjam
    const jumlahDipinjamMap = {};
    for (const p of peminjamanAktif) {
      if (p.barangDipinjam) {
        const id = p.barangDipinjam.toString();
        jumlahDipinjamMap[id] = (jumlahDipinjamMap[id] || 0) + 1;
      }
    }

    // Hitung barang tersedia
    const adjustedBarang = barangList.map(b => {
      const dipinjam = jumlahDipinjamMap[b._id.toString()] || 0;
      return {
        ...b.toObject(),
        tersedia: Math.max(0, b.jumlah - dipinjam)
      };
    });

    // Render ke dashboard (ubah sesuai lokasi file EJS-mu)
    res.render('dashboard/index', {
      username: req.session.username || 'User',
      role: req.session.role || 'guest',
      barangList: adjustedBarang
    });

  } catch (err) {
    console.error('Gagal memuat dashboard:', err);
    res.status(500).send('Gagal memuat dashboard');
  }
});

module.exports = router;
