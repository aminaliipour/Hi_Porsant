import mongoose, { Schema, type Document } from "mongoose"

export interface IPurchaseDetails extends Document {
  sectionId: mongoose.Types.ObjectId
  itemName: string
  details: Record<string, { value: any; isActive: boolean }>
  assignedMemberId?: mongoose.Types.ObjectId
  assignedMembers: Record<string, mongoose.Types.ObjectId>
  createdAt: Date
  updatedAt: Date
}

const PurchaseDetailsSchema: Schema = new Schema(
  {
    sectionId: { type: Schema.Types.ObjectId, ref: "ProjectSection", required: true },
    itemName: { type: String, required: true },
    details: { type: Map, of: new Schema({ value: Schema.Types.Mixed, isActive: { type: Boolean, default: true } }), default: {} },
    assignedMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    assignedMembers: { type: Map, of: Schema.Types.ObjectId, default: {} },
  },
  { timestamps: true },
)

export const PurchaseDetails =
  mongoose.models.PurchaseDetails || mongoose.model<IPurchaseDetails>("PurchaseDetails", PurchaseDetailsSchema)
