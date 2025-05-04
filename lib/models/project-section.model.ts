import mongoose, { Schema, type Document } from "mongoose"

export interface IProjectSection extends Document {
  projectId: mongoose.Types.ObjectId
  sectionName: string
  assignedMemberId?: mongoose.Types.ObjectId
  assignedMembers: Record<string, mongoose.Types.ObjectId>
  isActive: boolean // اضافه کردن فیلد فعال بودن بخش
  createdAt: Date
  updatedAt: Date
}

const ProjectSectionSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    sectionName: { type: String, required: true },
    assignedMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    assignedMembers: { type: Map, of: Schema.Types.ObjectId, default: {} },
    isActive: { type: Boolean, default: true }, // اضافه کردن فیلد فعال بودن بخش
  },
  { timestamps: true },
)

export const ProjectSection =
  mongoose.models.ProjectSection || mongoose.model<IProjectSection>("ProjectSection", ProjectSectionSchema)
