require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');

// Passport config
require('./config/passport');

const app = express();

// Koneksi MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// View engine dan static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware cek login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Import routes
const authRoutes = require('./routes/auth');
const barangRoutes = require('./routes/Barang');
const peminjamanRoutes = require('./routes/peminjaman');
const pengaturanRouter = require('./routes/pengaturan');
const forgotRoutes = require('./routes/forgot');

// Models
const Barang = require('./models/Barang');
const Peminjaman = require('./models/peminjaman');

// Gunakan routes
app.use('/', authRoutes);
app.use('/', forgotRoutes);
app.use('/barang', isLoggedIn, barangRoutes);
app.use('/peminjaman', isLoggedIn, peminjamanRoutes);
app.use('/pengaturan', isLoggedIn, pengaturanRouter);

// Halaman utama redirect ke login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Dashboard utama
app.get('/dashboard', isLoggedIn, async (req, res) => {
  try {
    const barangList = await Barang.find({});
    const peminjamanAktif = await Peminjaman.find({ status: 'dipinjam' });

    const jumlahDipinjamMap = {};
    peminjamanAktif.forEach(p => {
      if (p.barangDipinjam) {
        const id = p.barangDipinjam.toString();
        jumlahDipinjamMap[id] = (jumlahDipinjamMap[id] || 0) + 1;
      }
    });

    const adjustedBarang = barangList.map(b => {
      const dipinjam = jumlahDipinjamMap[b._id.toString()] || 0;
      return {
        ...b.toObject(),
        tersedia: Math.max(0, b.jumlah - dipinjam)
      };
    });

    const totalBarang = barangList.length;
    const totalTersedia = adjustedBarang.reduce((acc, b) => acc + b.tersedia, 0);
    const totalPeminjaman = peminjamanAktif.length;

    res.render('dashboard', {
      username: req.user.username,
      role: req.user.role,
      barangList: adjustedBarang,
      totalBarang,
      totalTersedia,
      totalPeminjaman
    });
  } catch (err) {
    console.error('❌ Gagal memuat dashboard:', err);
    res.status(500).send('Gagal memuat dashboard');
  }
});

// Route pencarian
app.get('/dashboard/search', isLoggedIn, async (req, res) => {
  const keyword = req.query.q || '';
  try {
    const barangResult = await Barang.find({
      nama: { $regex: keyword, $options: 'i' }
    });

    const peminjamanAll = await Peminjaman.find().populate('barangDipinjam');

    const peminjamResult = peminjamanAll.filter(p =>
      p.nama.toLowerCase().includes(keyword.toLowerCase()) ||
      (p.barangDipinjam && p.barangDipinjam.nama.toLowerCase().includes(keyword.toLowerCase()))
    );

    res.render('dashboard/search-result', {
      keyword,
      barangResult,
      peminjamResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan pada server');
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
