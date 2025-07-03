const express = require('express');
const router = express.Router();
const Barang = require('../models/Barang');

// Middleware untuk cek login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// GET: Daftar barang
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const barangs = await Barang.find();
    const role = req.user?.role || 'user';
    res.render('barang/index', { barangs, role });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal mengambil data barang');
  }
});

// GET: Form tambah barang
router.get('/tambah', isLoggedIn, async (req, res) => {
  try {
    const barangs = await Barang.find();
    const role = req.user?.role || 'user';
    res.render('barang/tambah', {
      barangs,
      error: null,
      oldInput: {},
      role
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal memuat form tambah barang');
  }
});

// POST: Tambah barang
router.post('/tambah', isLoggedIn, async (req, res) => {
  const { nama, jumlah, keterangan } = req.body;
  const oldInput = { nama, jumlah, keterangan };
  const role = req.user?.role || 'user';

  if (!nama || !jumlah || isNaN(jumlah)) {
    return res.render('barang/tambah', {
      error: 'Nama dan jumlah valid wajib diisi',
      barangs: [],
      oldInput,
      role
    });
  }

  try {
    const barang = new Barang({
      nama: nama.trim(),
      jumlah: parseInt(jumlah),
      keterangan: keterangan?.trim() || ''
    });
    await barang.save();
    res.redirect('/barang');
  } catch (err) {
    console.error(err);
    res.render('barang/tambah', {
      error: 'Gagal menambah barang',
      barangs: [],
      oldInput,
      role
    });
  }
});

// GET: Form edit barang
router.get('/edit/:id', isLoggedIn, async (req, res) => {
  try {
    const barang = await Barang.findById(req.params.id);
    const barangs = await Barang.find();
    const role = req.user?.role || 'user';

    if (!barang) return res.redirect('/barang');

    res.render('barang/edit', {
      barang,
      barangs,
      error: null,
      role
    });
  } catch (err) {
    console.error(err);
    res.redirect('/barang');
  }
});

// POST: Edit barang
router.post('/edit/:id', isLoggedIn, async (req, res) => {
  const { nama, jumlah, keterangan } = req.body;
  const role = req.user?.role || 'user';

  try {
    await Barang.findByIdAndUpdate(req.params.id, {
      nama: nama.trim(),
      jumlah: parseInt(jumlah),
      keterangan: keterangan?.trim() || ''
    });
    res.redirect('/barang');
  } catch (err) {
    console.error(err);
    res.render('barang/edit', {
      barang: { _id: req.params.id, nama, jumlah, keterangan },
      barangs: [],
      error: 'Gagal mengedit barang',
      role
    });
  }
});

// POST: Hapus barang
router.post('/hapus/:id', isLoggedIn, async (req, res) => {
  try {
    await Barang.findByIdAndDelete(req.params.id);
    res.redirect('/barang');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal menghapus barang');
  }
});

module.exports = router;
