import mongoose, { Schema, type Document } from "mongoose"
import "./project.model"
import "./archive.model"

export interface IProjectIncome extends Document {
  projectId: mongoose.Types.ObjectId
  purchaseProfit: number
  designProfit: number
  collaborationProfit: number
  contractingProfit: number
  salesProfit: number
  consultationProfit: number
  details: Record<string, any>
  calculationType?: Record<string, 'variable' | 'fixed'>
  fixedValues?: Record<string, number>
  itemCalculationType?: Record<string, 'variable' | 'fixed'>
  itemFixedValues?: Record<string, number>
  // مقادیر خام (قبل از کسر درصد سیستم)
  rawPurchaseProfit: number
  rawDesignProfit: number
  rawCollaborationProfit: number
  rawContractingProfit: number
  rawSalesProfit: number
  rawConsultationProfit: number
  totalIncome: number
  totalRawIncome: number // مجموع مقادیر خام
  totalSystemShare: number // مجموع سهم سیستم
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
    calculationType: { type: Schema.Types.Mixed, default: {} },
    fixedValues: { type: Schema.Types.Mixed, default: {} },
    itemCalculationType: { type: Schema.Types.Mixed, default: {} },
    itemFixedValues: { type: Schema.Types.Mixed, default: {} },
    // مقادیر خام (قبل از کسر درصد سیستم)
    rawPurchaseProfit: { type: Number, default: 0 },
    rawDesignProfit: { type: Number, default: 0 },
    rawCollaborationProfit: { type: Number, default: 0 },
    rawContractingProfit: { type: Number, default: 0 },
    rawSalesProfit: { type: Number, default: 0 },
    rawConsultationProfit: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    totalRawIncome: { type: Number, default: 0 },
    totalSystemShare: { type: Number, default: 0 },
    taxShare: { type: Number, default: 0 },
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive", required: false },
  },
  { timestamps: true },
)

// محاسبه مجموع درآمد قبل از ذخیره
ProjectIncomeSchema.pre("save", function (next) {
  const doc = this as unknown as IProjectIncome
  
  // مجموع درآمد نهایی (پس از کسر درصد سیستم) - سهم دفتر
  doc.totalIncome =
    doc.purchaseProfit +
    doc.designProfit +
    doc.collaborationProfit +
    doc.contractingProfit +
    doc.salesProfit +
    doc.consultationProfit
    
  // مجموع درآمد خام (قبل از کسر درصد سیستم)
  doc.totalRawIncome =
    doc.rawPurchaseProfit +
    doc.rawDesignProfit +
    doc.rawCollaborationProfit +
    doc.rawContractingProfit +
    doc.rawSalesProfit +
    doc.rawConsultationProfit
    
  // محاسبه مجموع سهم سیستم
  doc.totalSystemShare = doc.totalRawIncome - doc.totalIncome
  
  next()
})

export const ProjectIncome =
  mongoose.models.ProjectIncome || mongoose.model<IProjectIncome>("ProjectIncome", ProjectIncomeSchema)

// Clear cache for development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.ProjectIncome
}
