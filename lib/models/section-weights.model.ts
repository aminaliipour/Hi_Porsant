import mongoose, { Schema, type Document } from "mongoose"

export interface ISectionWeights extends Document {
  sectionName: string
  fieldName: string
  weight: number
  createdAt: Date
  updatedAt: Date
}

const SectionWeightsSchema: Schema = new Schema(
  {
    sectionName: { type: String, required: true },
    fieldName: { type: String, required: true },
    weight: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// ایجاد یک ایندکس ترکیبی برای جلوگیری از تکرار
SectionWeightsSchema.index({ sectionName: 1, fieldName: 1 }, { unique: true })

export const SectionWeights =
  mongoose.models.SectionWeights || mongoose.model<ISectionWeights>("SectionWeights", SectionWeightsSchema)
