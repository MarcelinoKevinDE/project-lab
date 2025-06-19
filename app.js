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

// Models
const Barang = require('./models/Barang');
const Peminjaman = require('./models/peminjaman');

// Gunakan routes
app.use('/', authRoutes);
app.use('/barang', isLoggedIn, barangRoutes);
app.use('/peminjaman', isLoggedIn, peminjamanRoutes);

// Halaman utama redirect ke login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Dashboard utama
app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', {
    username: req.user.username,
    role: req.user.role,
  });
});

// Route pencarian
app.get('/dashboard/search', isLoggedIn, async (req, res) => {
  const keyword = req.query.q || '';
  try {
    // Barang cocok
    const barangResult = await Barang.find({
      nama: { $regex: keyword, $options: 'i' }
    });

    // Semua data peminjaman (dengan barangDipinjam)
    const peminjamanAll = await Peminjaman.find().populate('barangDipinjam');

    // Filter berdasarkan nama peminjam atau nama barang
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
