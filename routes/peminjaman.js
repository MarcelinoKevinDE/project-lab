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

// GET: Daftar semua peminjaman dengan filter
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

// GET: Form tambah
router.get('/tambah', isAdmin, async (req, res) => {
  try {
    const barangs = await Barang.find();
    res.render('peminjaman/tambah', { barangs, error: null, oldInput: {} });
  } catch (err) {
    console.error(err);
    res.redirect('/peminjaman');
  }
});

// POST: Tambah peminjaman
router.post('/tambah', isAdmin, async (req, res) => {
  const { nama, kontak, tanggalPinjam, tanggalKembali, barangDipinjam } = req.body;
  const oldInput = { nama, kontak, tanggalPinjam, tanggalKembali, barangDipinjam };

  try {
    if (!nama || !kontak || !barangDipinjam) {
      throw new Error('Nama, kontak, dan barang wajib diisi');
    }

    const barang = await Barang.findById(barangDipinjam);
    if (!barang || barang.jumlah <= 0) {
      throw new Error('Barang tidak tersedia atau stok habis');
    }

    const peminjaman = new Peminjaman({
      nama: nama.trim(),
      kontak: kontak.trim(),
      tanggalPinjam: tanggalPinjam ? new Date(tanggalPinjam) : new Date(),
      tanggalKembali: tanggalKembali ? new Date(tanggalKembali) : null,
      barangDipinjam,
      status: 'dipinjam'
    });

    await peminjaman.save();

    barang.jumlah -= 1;
    await barang.save();

    res.redirect('/peminjaman');
  } catch (err) {
    console.error(err);
    const barangs = await Barang.find();
    res.render('peminjaman/tambah', { barangs, error: err.message, oldInput });
  }
});

// GET: Form edit
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

// POST: Update peminjaman
router.post('/edit/:id', isAdmin, async (req, res) => {
  const { nama, kontak, tanggalPinjam, tanggalKembali, barangDipinjam, status } = req.body;

  try {
    const peminjaman = await Peminjaman.findById(req.params.id);
    if (!peminjaman) return res.redirect('/peminjaman');

    // Jika barang berubah
    if (peminjaman.barangDipinjam.toString() !== barangDipinjam) {
      const barangLama = await Barang.findById(peminjaman.barangDipinjam);
      const barangBaru = await Barang.findById(barangDipinjam);

      if (barangLama) barangLama.jumlah += 1;
      if (barangBaru && barangBaru.jumlah > 0) {
        barangBaru.jumlah -= 1;
      } else {
        throw new Error('Barang pengganti tidak tersedia');
      }

      await barangLama?.save();
      await barangBaru?.save();
    }

    // Jika status berubah
    if (peminjaman.status !== status) {
      const barang = await Barang.findById(barangDipinjam);
      if (barang) {
        if (status === 'dikembalikan' && peminjaman.status === 'dipinjam') {
          barang.jumlah += 1;
        } else if (status === 'dipinjam' && peminjaman.status === 'dikembalikan' && barang.jumlah > 0) {
          barang.jumlah -= 1;
        }
        await barang.save();
      }
    }

    await Peminjaman.findByIdAndUpdate(req.params.id, {
      nama: nama.trim(),
      kontak: kontak.trim(),
      tanggalPinjam: tanggalPinjam ? new Date(tanggalPinjam) : peminjaman.tanggalPinjam,
      tanggalKembali: tanggalKembali ? new Date(tanggalKembali) : peminjaman.tanggalKembali,
      barangDipinjam,
      status
    });

    res.redirect('/peminjaman');
  } catch (err) {
    console.error(err);
    const barangs = await Barang.find();
    res.render('peminjaman/edit', {
      peminjaman: req.body,
      barangs,
      error: err.message,
      oldInput: req.body
    });
  }
});

// POST: Kembalikan barang
router.post('/kembalikan/:id', isAdmin, async (req, res) => {
  try {
    const peminjaman = await Peminjaman.findByIdAndUpdate(
      req.params.id,
      {
        status: 'dikembalikan',
        tanggalKembali: new Date()
      },
      { new: true }
    );

    const barang = await Barang.findById(peminjaman.barangDipinjam);
    if (barang) {
      barang.jumlah += 1;
      await barang.save();
    }

    res.redirect('/peminjaman');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal mengembalikan barang');
  }
});

// POST: Hapus peminjaman
router.post('/hapus/:id', isAdmin, async (req, res) => {
  try {
    const peminjaman = await Peminjaman.findById(req.params.id);
    if (!peminjaman) return res.redirect('/peminjaman');

    // Kembalikan stok jika belum dikembalikan
    if (peminjaman.status === 'dipinjam') {
      const barang = await Barang.findById(peminjaman.barangDipinjam);
      if (barang) {
        barang.jumlah += 1;
        await barang.save();
      }
    }

    await Peminjaman.findByIdAndDelete(req.params.id);
    res.redirect('/peminjaman');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal menghapus peminjaman');
  }
});

module.exports = router;
