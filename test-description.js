const mongoose = require('mongoose');

const EmployeeSalarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  baseSalary: { type: Number, default: 0 },
  additions: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  description: { type: String, default: "" },
  date: { type: String, required: true },
  archiveId: { type: mongoose.Schema.Types.ObjectId }
}, { 
  timestamps: true,
  strict: false
});

const TestEmployeeSalary = mongoose.model('TestEmployeeSalary2', EmployeeSalarySchema);

console.log('Schema paths:', Object.keys(TestEmployeeSalary.schema.paths));
console.log('Description field:', TestEmployeeSalary.schema.paths.description);

// Test creating a document
const testDoc = new TestEmployeeSalary({
  employeeId: new mongoose.Types.ObjectId(),
  baseSalary: 100000,
  description: "Test description",
  date: "2025-08-10"
});

console.log('Test document description:', testDoc.description);
