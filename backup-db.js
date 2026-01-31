const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connection URL from your lib/db.ts
const MONGODB_URI = "mongodb+srv://aminaliipour:7Fe12121@cluster0.ypjkwmj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const BACKUP_DIR = path.join(__dirname, 'backup_json');

async function backup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
        console.log(`Created backup directory: ${BACKUP_DIR}`);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`Exporting ${collectionName}...`);

            const collection = mongoose.connection.db.collection(collectionName);
            const data = await collection.find({}).toArray();

            const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved ${data.length} documents to ${filePath}`);
        }

        console.log('Backup completed successfully!');
    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

backup();
