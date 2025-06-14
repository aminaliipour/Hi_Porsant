import mongoose, { Schema, type Document } from "mongoose"

export interface IArchive extends Document {
  name: string // مثلاً "خرداد 1404"
  month: number // ماه میلادی
  year: number // سال میلادی
  createdAt: Date
  updatedAt: Date
}

const ArchiveSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true },
)

export const Archive = mongoose.models.Archive || mongoose.model<IArchive>("Archive", ArchiveSchema)
