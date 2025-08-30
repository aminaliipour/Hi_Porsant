const { MongoClient } = require('mongodb');

// اتصال به MongoDB
const uri = "mongodb+srv://aminaliipour:7Fe12121@cluster0.ypjkwmj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateSalaryData() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db("test"); // MongoDB Atlas default database
    const collection = db.collection('employeesalaries');
    
    // یافتن تمام رکوردهایی که additions یا deductions عدد هستند
    const records = await collection.find({
      $or: [
        { additions: { $type: "number" } },
        { deductions: { $type: "number" } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${records.length} records to migrate`);
    
    if (records.length === 0) {
      console.log("ℹ️ No records need migration");
      return;
    }
    
    let updatedCount = 0;
    
    for (const record of records) {
      const updates = {};
      
      // تبدیل additions از عدد به آرایه
      if (typeof record.additions === 'number') {
        if (record.additions > 0) {
          updates.additions = [{
            title: "اضافات قبلی",
            amount: record.additions
          }];
          console.log(`📈 Converting additions for ${record.employeeName}: ${record.additions} -> array`);
        } else {
          updates.additions = [];
        }
      }
      
      // تبدیل deductions از عدد به آرایه
      if (typeof record.deductions === 'number') {
        if (record.deductions > 0) {
          updates.deductions = [{
            title: "کسورات قبلی",
            amount: record.deductions
          }];
          console.log(`📉 Converting deductions for ${record.employeeName}: ${record.deductions} -> array`);
        } else {
          updates.deductions = [];
        }
      }
      
      // اعمال تغییرات
      if (Object.keys(updates).length > 0) {
        await collection.updateOne(
          { _id: record._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`✅ Updated record for ${record.employeeName}`);
      }
    }
    
    console.log(`🎉 Migration completed successfully! Updated ${updatedCount} records.`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

migrateSalaryData();
