const mongoose = require('mongoose');

const barangSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  jumlah: { type: Number, required: true, min: 0 },
  keterangan: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model('Barang', barangSchema);
