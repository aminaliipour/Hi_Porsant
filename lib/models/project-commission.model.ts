import mongoose, { Schema, type Document } from "mongoose"

export interface IProjectCommission extends Document {
  projectId: mongoose.Types.ObjectId
  sectionName: string
  itemName?: string
  fieldName: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

const ProjectCommissionSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sectionName: { type: String, required: true },
    itemName: { type: String },
    fieldName: { type: String, required: true },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const ProjectCommission =
  mongoose.models.ProjectCommission || mongoose.model<IProjectCommission>("ProjectCommission", ProjectCommissionSchema)
