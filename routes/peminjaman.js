const express = require('express');
const router = express.Router();

const Peminjaman = require('../models/peminjaman');
const Barang = require('../models/Barang');

// Middleware: Cek admin
function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect('/login');
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  next();
}

// GET: Daftar semua peminjaman
router.get('/', isAdmin, async (req, res) => {
  try {
    const { nama, status, tanggalPinjam } = req.query;
    const filter = {};

    if (nama) filter.nama = { $regex: nama, $options: 'i' };
    if (status) filter.status = status;
    if (tanggalPinjam) {
      const awal = new Date(tanggalPinjam);
      const akhir = new Date(tanggalPinjam);
      akhir.setDate(akhir.getDate() + 1);
      filter.tanggalPinjam = { $gte: awal, $lt: akhir };
    }

    const peminjaman = await Peminjaman.find(filter).populate('barangDipinjam');
    res.render('peminjaman/index', { peminjaman, query: req.query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal mengambil data peminjaman');
  }
});

// GET: Form tambah peminjaman
router.get('/tambah', isAdmin, async (req, res) => {
  try {
    const barangs = await Barang.find();
    res.render('peminjaman/tambah', { barangs, error: null, oldInput: {} });
  } catch (err) {
    console.error(err);
    res.redirect('/peminjaman');
  }
});

// POST: Tambah peminjaman (default 1 item, stok real-time)
router.post('/tambah', isAdmin, async (req, res) => {
  const { nama, nim, tanggalPinjam, tanggalKembali, barangDipinjam } = req.body;
  const oldInput = { nama, nim, tanggalPinjam, tanggalKembali, barangDipinjam };

  try {
    if (!nama || !nim || !barangDipinjam) {
      throw new Error('Nama, NIM, dan barang wajib diisi');
    }

    const barang = await Barang.findById(barangDipinjam);
    if (!barang) throw new Error('Barang tidak ditemukan');

    // Hitung total yang sedang dipinjam
    const dipinjamData = await Peminjaman.aggregate([
      { $match: { barangDipinjam: barang._id, status: 'dipinjam' } },
      { $group: { _id: null, totalDipinjam: { $sum: "$jumlah" } } }
    ]);
    const totalDipinjam = dipinjamData[0]?.totalDipinjam || 0;
    const stokTersedia = barang.jumlah - totalDipinjam;

    if (stokTersedia < 1) {
      throw new Error(`Stok tidak mencukupi. Sisa tersedia: ${stokTersedia}`);
    }

    // Simpan peminjaman
    const peminjaman = new Peminjaman({
      nama: nama.trim(),
      nim: nim.trim(),
      tanggalPinjam: tanggalPinjam ? new Date(tanggalPinjam) : new Date(),
      tanggalKembali: tanggalKembali ? new Date(tanggalKembali) : null,
      barangDipinjam,
      jumlah: 1,
      status: 'dipinjam'
    });

    await peminjaman.save();
    res.redirect('/peminjaman');
  } catch (err) {
    console.error(err);
    const barangs = await Barang.find();
    res.render('peminjaman/tambah', { barangs, error: err.message, oldInput });
  }
});

// GET: Form edit peminjaman
router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const peminjaman = await Peminjaman.findById(req.params.id);
    const barangs = await Barang.find();
    if (!peminjaman) return res.redirect('/peminjaman');

    res.render('peminjaman/edit', { peminjaman, barangs, error: null, oldInput: null });
  } catch (err) {
    console.error(err);
    res.redirect('/peminjaman');
  }
});

// POST: Kembalikan barang
router.post('/kembalikan/:id', isAdmin, async (req, res) => {
  try {
    const peminjaman = await Peminjaman.findById(req.params.id);
    if (!peminjaman) return res.status(404).send('Data tidak ditemukan');

    if (peminjaman.status === 'dikembalikan') {
      return res.redirect('/peminjaman');
    }

    peminjaman.status = 'dikembalikan';
    peminjaman.tanggalKembali = new Date();
    await peminjaman.save();

    res.redirect('/peminjaman');
  } catch (err) {
    console.error('Gagal mengembalikan barang:', err);
    res.status(500).send('Gagal mengembalikan barang');
  }
});

// POST: Hapus peminjaman
router.post('/hapus/:id', isAdmin, async (req, res) => {
  try {
    const peminjaman = await Peminjaman.findById(req.params.id);
    if (!peminjaman) return res.status(404).send('Data tidak ditemukan');

    await Peminjaman.findByIdAndDelete(req.params.id);
    res.redirect('/peminjaman');
  } catch (err) {
    console.error('Gagal menghapus data peminjaman:', err);
    res.status(500).send('Gagal menghapus data');
  }
});

module.exports = router;
