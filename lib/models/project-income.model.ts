import mongoose, { Schema, type Document } from "mongoose"

export interface IProjectIncome extends Document {
  projectId: mongoose.Types.ObjectId
  purchaseProfit: number
  designProfit: number
  collaborationProfit: number
  contractingProfit: number
  salesProfit: number
  consultationProfit: number
  details: Record<string, any>
  totalIncome: number
  taxShare: number
  createdAt: Date
  updatedAt: Date
}

const ProjectIncomeSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    purchaseProfit: { type: Number, default: 0 },
    designProfit: { type: Number, default: 0 },
    collaborationProfit: { type: Number, default: 0 },
    contractingProfit: { type: Number, default: 0 },
    salesProfit: { type: Number, default: 0 },
    consultationProfit: { type: Number, default: 0 },
    details: { type: Map, of: Schema.Types.Mixed, default: {} },
    totalIncome: { type: Number, default: 0 },
    taxShare: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// محاسبه مجموع درآمد قبل از ذخیره
ProjectIncomeSchema.pre("save", function (next) {
  this.totalIncome =
    this.purchaseProfit +
    this.designProfit +
    this.collaborationProfit +
    this.contractingProfit +
    this.salesProfit +
    this.consultationProfit
  next()
})

export const ProjectIncome =
  mongoose.models.ProjectIncome || mongoose.model<IProjectIncome>("ProjectIncome", ProjectIncomeSchema)
