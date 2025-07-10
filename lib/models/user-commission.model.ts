import mongoose, { Schema, type Document } from "mongoose"

export interface IUserCommission extends Document {
  userId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  sectionName: string
  itemName?: string
  fieldName: string
  income: number
  weight: number
  systemPercent: number
  commission: number
  isActive: boolean // وضعیت فعال/غیرفعال پورسانت
  archiveId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const UserCommissionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "TeamMember", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sectionName: { type: String, required: true },
    itemName: { type: String },
    fieldName: { type: String, required: true },
    income: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    systemPercent: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, // پیش‌فرض فعال
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive" },
  },
  { timestamps: true },
)

// ایندکس منحصر به فرد برای جلوگیری از تکرار
UserCommissionSchema.index({
  userId: 1,
  projectId: 1,
  sectionName: 1,
  itemName: 1,
  fieldName: 1,
  archiveId: 1
}, { unique: true })

export const UserCommission =
  mongoose.models.UserCommission || mongoose.model<IUserCommission>("UserCommission", UserCommissionSchema)
