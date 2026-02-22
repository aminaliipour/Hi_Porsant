import mongoose, { Schema, type Document } from "mongoose"
import "./User"
import "./project-section.model"

export interface IContractingDetails extends Document {
  sectionId: mongoose.Types.ObjectId
  details: Record<string, {
    isActive: boolean
    assignedMemberId: mongoose.Types.ObjectId | null
  }>
  createdAt: Date
  updatedAt: Date
}

const DetailsItemSchema = new Schema({
  isActive: { type: Boolean, default: true },
  assignedMemberId: { type: Schema.Types.ObjectId, ref: "User", default: null }
})

const ContractingDetailsSchema: Schema = new Schema(
  {
    sectionId: { type: Schema.Types.ObjectId, ref: "ProjectSection", required: true },
    details: { type: Map, of: DetailsItemSchema, default: {} }
  },
  { timestamps: true },
)

export const ContractingDetails = mongoose.models.ContractingDetails || mongoose.model<IContractingDetails>("ContractingDetails", ContractingDetailsSchema)
