import mongoose, { Schema, type Document } from "mongoose"
import "./User"
import "./archive.model"

export interface IEmployeeSalary extends Document {
  employeeId: mongoose.Types.ObjectId
  baseSalary: number
  additions: Array<{ title: string, amount: number }>
  deductions: Array<{ title: string, amount: number }>
  taxDeduction?: number // کسر 7% مالیات اضافه شد
  description?: string // فیلد توضیحات اضافه شد
  isPorsanti?: boolean // حالت پورسانتی
  salary1?: number // حقوق اول (133911989 منهای 7%)
  salary2?: number // حقوق دوم (مابه‌التفاوت درآمد)
  salary1Base?: number // مبلغ حقوق پایه برای محاسبه پورسانتی (هر شخص مبلغ خودش را دارد)
  insuranceDeduction?: boolean // کسر بیمه 7% - true یعنی کسر میشود
  date: string
  archiveId?: mongoose.Types.ObjectId // اضافه شد
  createdAt: Date
  updatedAt: Date
}

const EmployeeSalarySchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    baseSalary: { type: Number, default: 0 },
    additions: {
      type: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true }
      }],
      default: []
    },
    deductions: {
      type: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true }
      }],
      default: []
    },
    taxDeduction: { type: Number, default: 0 }, // کسر 7% مالیات اضافه شد
    description: { type: String, default: "" }, // فیلد توضیحات - حذف required: false
    isPorsanti: { type: Boolean, default: false }, // حالت پورسانتی
    salary1: { type: Number, default: 0 }, // حقوق اول
    salary2: { type: Number, default: 0 }, // حقوق دوم
    salary1Base: { type: Number, default: 133911989 }, // مبلغ حقوق پایه برای محاسبه پورسانتی
    insuranceDeduction: { type: Boolean, default: true }, // کسر بیمه
    date: { type: String, required: true },
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive" }, // اضافه شد
  },
  {
    timestamps: true,
    strict: false // اجازه فیلدهای اضافی
  },
)

export const EmployeeSalary =
  mongoose.models.EmployeeSalary || mongoose.model<IEmployeeSalary>("EmployeeSalary", EmployeeSalarySchema)
