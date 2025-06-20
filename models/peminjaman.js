const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const peminjamanSchema = new Schema({
  nama: {
    type: String,
    required: true,
    trim: true
  },
  nim: { // diganti dari kontak
    type: String,
    required: true,
    trim: true
  },
  tanggalPinjam: {
    type: Date,
    default: Date.now
  },
  tanggalKembali: {
    type: Date
  },
  barangDipinjam: {
    type: Schema.Types.ObjectId,
    ref: 'Barang',
    required: true
  },
  status: {
    type: String,
    enum: ['dipinjam', 'dikembalikan'],
    default: 'dipinjam'
  }
});

module.exports = mongoose.model('Peminjaman', peminjamanSchema);
