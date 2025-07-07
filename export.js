require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function exportCollection(collectionName, filename) {
    try {
        await client.connect();
        const db = client.db("labDB");
        const collection = db.collection(collectionName);

        const data = await collection.find().toArray();
        data.forEach(doc => {
            doc._id = doc._id.toString();
        });

        fs.writeFileSync(filename, JSON.stringify(data, null, 4), 'utf-8');
        console.log(`✅ ${collectionName} berhasil diexport ke ${filename}`);
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

// Ganti nama collection sesuai yang kamu pakai
exportCollection("barang", "barang.json");
exportCollection("barangs", "barangs.json");
exportCollection("peminjamen", "peminjamen.json");
exportCollection("peminjamans", "peminjamans.json");
exportCollection("sessions", "sessions.json");
exportCollection("users", "users.json");
