import mongoose, { Schema, type Document } from "mongoose"

export interface ISystemExpenses extends Document {
  date: string
  staffSalary: number
  officeCosts: number
  maintenanceCosts: number
  workspaceUpgrade: number
  toolsUpgrade: number
  advertisingCosts: number
  digitalDevelopment: number
  paperworkCosts: number
  eventCosts: number
  createdAt: Date
  updatedAt: Date
}

const SystemExpensesSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    staffSalary: { type: Number, default: 0 },
    officeCosts: { type: Number, default: 0 },
    maintenanceCosts: { type: Number, default: 0 },
    workspaceUpgrade: { type: Number, default: 0 },
    toolsUpgrade: { type: Number, default: 0 },
    advertisingCosts: { type: Number, default: 0 },
    digitalDevelopment: { type: Number, default: 0 },
    paperworkCosts: { type: Number, default: 0 },
    eventCosts: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const SystemExpenses =
  mongoose.models.SystemExpenses || mongoose.model<ISystemExpenses>("SystemExpenses", SystemExpensesSchema)
