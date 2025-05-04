import mongoose, { Schema, type Document } from "mongoose"

export interface IEmployeeSalary extends Document {
  employeeId: mongoose.Types.ObjectId
  baseSalary: number
  additions: number
  deductions: number
  date: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeSalarySchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "TeamMember", required: true },
    baseSalary: { type: Number, default: 0 },
    additions: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true },
)

export const EmployeeSalary =
  mongoose.models.EmployeeSalary || mongoose.model<IEmployeeSalary>("EmployeeSalary", EmployeeSalarySchema)
