const { MongoClient } = require('mongodb');

async function testMongoDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const collection = db.collection('projectincomes');

    // یافتن رکوردهای موجود
    const records = await collection.find({}).toArray();
    console.log("Found records:", records.length);

    if (records.length > 0) {
      const firstRecord = records[0];
      console.log("First record fields:");
      console.log("- itemCalculationType:", firstRecord.itemCalculationType);
      console.log("- itemFixedValues:", firstRecord.itemFixedValues);
      console.log("- calculationType:", firstRecord.calculationType);
      console.log("- fixedValues:", firstRecord.fixedValues);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

testMongoDB();
