import mongoose, { Schema, type Document } from "mongoose"
import "./archive.model"

export interface IProject extends Document {
  name: string
  archiveId?: mongoose.Types.ObjectId
  useCustomTaadol?: boolean
  customTaadolPercentages?: {
    خرید: number
    همکاری: number
    فروش: number
    طراحی: number
    پیمانکاری: number
    مشاوره: number
  }
  customSectionWeights?: Array<{
    sectionName: string
    fieldName: string
    weight: number
  }>
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive", required: false },
    useCustomTaadol: { type: Boolean, default: false },
    customTaadolPercentages: {
      type: {
        خرید: { type: Number, default: 0 },
        همکاری: { type: Number, default: 0 },
        فروش: { type: Number, default: 0 },
        طراحی: { type: Number, default: 0 },
        پیمانکاری: { type: Number, default: 0 },
        مشاوره: { type: Number, default: 0 },
      },
      default: {
        خرید: 0,
        همکاری: 0,
        فروش: 0,
        طراحی: 0,
        پیمانکاری: 0,
        مشاوره: 0,
      }
    },
    customSectionWeights: {
      type: [{
        sectionName: { type: String, required: true },
        fieldName: { type: String, required: true },
        weight: { type: Number, default: 0 }
      }],
      default: []
    }
  },
  { timestamps: true },
)

export const Project = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
