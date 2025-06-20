const express = require('express');
const router = express.Router();
const Barang = require('../models/Barang');
const Peminjaman = require('../models/Peminjam');

// Route pencarian dari dashboard
router.get('/dashboard/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    // Cari semua barang sesuai keyword
    const barangResult = await Barang.find({
      nama: { $regex: q, $options: 'i' }
    });

    const barangIds = barangResult.map(b => b._id);

    // Ambil semua peminjaman AKTIF (status: dipinjam) untuk barang-barang tersebut
    const peminjamResult = await Peminjaman.find({
      barangDipinjam: { $in: barangIds }
    }).populate('barangDipinjam');

    // Hitung jumlah barang yang sedang dipinjam (status dipinjam saja)
    const jumlahDipinjamMap = {};
    peminjamResult.forEach(p => {
      if (p.status === 'dipinjam' && p.barangDipinjam?._id) {
        const id = p.barangDipinjam._id.toString();
        jumlahDipinjamMap[id] = (jumlahDipinjamMap[id] || 0) + 1;
      }
    });

    // Kurangi jumlah untuk ditampilkan di view
    const barangResultAdjusted = barangResult.map(barang => {
      const dipinjam = jumlahDipinjamMap[barang._id.toString()] || 0;
      return {
        ...barang.toObject(),
        jumlah: Math.max(0, barang.jumlah - dipinjam)
      };
    });

    res.render('dashboard/search-result', {
      keyword: q,
      barangResult: barangResultAdjusted,
      peminjamResult
    });

  } catch (err) {
    console.error('Error saat pencarian:', err);
    res.status(500).send('Terjadi kesalahan saat pencarian.');
  }
});

module.exports = router;
