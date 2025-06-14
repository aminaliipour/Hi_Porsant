import mongoose, { Schema, type Document } from "mongoose"

export interface IGuestReferral extends Document {
  fullName: string
  referralFee: number
  description?: string
  dateAdded: string
  archiveId?: mongoose.Types.ObjectId // اضافه شد
  createdAt: Date
  updatedAt: Date
}

const GuestReferralSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    referralFee: { type: Number, default: 0 },
    description: { type: String },
    dateAdded: { type: String, required: true },
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive" }, // اضافه شد
  },
  { timestamps: true },
)

export const GuestReferral =
  mongoose.models.GuestReferral || mongoose.model<IGuestReferral>("GuestReferral", GuestReferralSchema)
