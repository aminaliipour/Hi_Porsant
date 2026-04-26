import mongoose, { Schema, type Document } from "mongoose"

export interface IProjectTax extends Document {
  projectId: mongoose.Types.ObjectId
  taxPercentage: number
  totalIncome: number
  lastCalculatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ProjectTaxSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    taxPercentage: { type: Number, required: true, min: 0, max: 100 },
    totalIncome: { type: Number, required: true, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const ProjectTax = mongoose.models.ProjectTax || mongoose.model<IProjectTax>("ProjectTax", ProjectTaxSchema)