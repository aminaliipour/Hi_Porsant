import mongoose, { Schema, type Document } from "mongoose"

export interface ISystemPercentages extends Document {
  خرید: number
  همکاری: number
  فروش: number
  طراحی: number
  پیمانکاری: number
  مشاوره: number
  createdAt: Date
  updatedAt: Date
}

const SystemPercentagesSchema: Schema = new Schema(
  {
    خرید: { type: Number, default: 0 },
    همکاری: { type: Number, default: 0 },
    فروش: { type: Number, default: 0 },
    طراحی: { type: Number, default: 0 },
    پیمانکاری: { type: Number, default: 0 },
    مشاوره: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const SystemPercentages =
  mongoose.models.SystemPercentages || mongoose.model<ISystemPercentages>("SystemPercentages", SystemPercentagesSchema)
