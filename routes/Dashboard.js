const express = require('express');
const router = express.Router();
const Barang = require('../models/Barang');
const Peminjaman = require('../models/Peminjam');

// Route pencarian dari dashboard
router.get('/dashboard/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    // Cari barang berdasarkan nama yang mengandung keyword
    const barangResult = await Barang.find({
      nama: { $regex: q, $options: 'i' }
    });

    // Ambil semua ID dari barang yang ditemukan
    const barangIds = barangResult.map(b => b._id);

    // Ambil data peminjaman yang terkait dengan barang yang ditemukan
    const peminjamResult = await Peminjaman.find({
      barangDipinjam: { $in: barangIds }
    }).populate('barangDipinjam');

    // Kirim hasil pencarian ke view EJS
    res.render('dashboard/search-result', {
      keyword: q,
      barangResult,
      peminjamResult
    });
  } catch (err) {
    console.error('Error saat pencarian:', err);
    res.status(500).send('Terjadi kesalahan saat pencarian.');
  }
});

module.exports = router;
