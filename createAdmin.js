const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  
  const username = 'admin';
  const plainPassword = 'admin123'; // ganti sesuai keinginan
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const adminUser = new User({
    username,
    password: hashedPassword,
    role
  });

  await adminUser.save();
  console.log('Admin user created');
  mongoose.disconnect();
})
.catch(err => {
  console.error(err);
});
