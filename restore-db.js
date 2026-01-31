const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Usage: node restore-db.js <MONGODB_URI>
// Or edit the value below
const DEFAULT_URI = "YOUR_NEW_CONNECTION_STRING_HERE";
const MONGODB_URI = process.argv[2] || process.env.NEW_MONGODB_URI || DEFAULT_URI;

const BACKUP_DIR = path.join(__dirname, 'backup_json');

// Helper to restore specific types (ObjectId, Date) from JSON strings
function reconstructTypes(doc) {
    for (const key in doc) {
        const value = doc[key];

        // Handle _id and fields ending in Id (references) like projectId, archiveId
        if ((key === '_id' || key.endsWith('Id')) && typeof value === 'string') {
            // Check if it's a valid ObjectId (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(value)) {
                doc[key] = new mongoose.Types.ObjectId(value);
            }
        }

        // Handle Dates (ISO 8601 format)
        // Matches YYYY-MM-DDTHH:mm:ss.sssZ structure
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
            doc[key] = new Date(value);
        }

        // Recursion for nested objects arrays
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                // We generally don't expect deep nesting of mixed types in arrays in this schema, 
                // but let's handle objects inside arrays
                value.forEach(item => {
                    if (typeof item === 'object' && item !== null) reconstructTypes(item);
                });
            } else {
                // Nested object
                // Skip converting BSON types if they appear? But here we have plain JSON.
                reconstructTypes(value);
            }
        }
    }
    return doc;
}

async function restore() {
    if (MONGODB_URI === "YOUR_NEW_CONNECTION_STRING_HERE") {
        console.error("Please provide a MongoDB Connection String!");
        console.error("Usage: node restore-db.js <CONNECTION_STRING>");
        console.error("Or set NEW_MONGODB_URI environment variable.");
        process.exit(1);
    }

    if (!fs.existsSync(BACKUP_DIR)) {
        console.error(`Backup directory not found: ${BACKUP_DIR}`);
        process.exit(1);
    }

    try {
        console.log(`Connecting to MongoDB...`);
        // Masking URI in logs for security if it contains password, 
        // but here we just connect.
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.json'));
        console.log(`Found ${files.length} backup files.`);

        for (const file of files) {
            const collectionName = path.basename(file, '.json');
            console.log(`\nProcessing ${collectionName}...`);

            const filePath = path.join(BACKUP_DIR, file);
            const rawData = fs.readFileSync(filePath, 'utf-8');

            try {
                const data = JSON.parse(rawData);

                if (!Array.isArray(data) || data.length === 0) {
                    console.log(`Skipping ${collectionName} (empty or invalid format)`);
                    continue;
                }

                // Reconstruct types
                console.log(`Reconstructing data types for ${data.length} documents...`);
                const docs = data.map(doc => reconstructTypes(doc));

                // Get collection reference
                const collection = mongoose.connection.db.collection(collectionName);

                // Optional: Clear existing data? 
                // A restore usually implies overwriting or filling a fresh DB.
                // We will insert. If duplicates exist, it will likely throw error on _id collision.
                // Let's drop the collection first to ensure clean restore.
                try {
                    // Check if collection exists
                    const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
                    if (collections.length > 0) {
                        console.log(`Dropping existing collection ${collectionName}...`);
                        await collection.drop();
                    }
                } catch (err) {
                    console.warn(`Warning dropping collection: ${err.message}`);
                }

                console.log(`Inserting ${docs.length} documents...`);
                await collection.insertMany(docs);
                console.log(`Successfully restored ${collectionName}`);

            } catch (err) {
                console.error(`Error processing ${file}:`, err.message);
            }
        }

        console.log('\nRestore completed successfully!');
    } catch (error) {
        console.error('Restore failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

restore();
