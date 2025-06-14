import mongoose, { Schema, type Document } from "mongoose"

export interface IProject extends Document {
  name: string
  archiveId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    archiveId: { type: Schema.Types.ObjectId, ref: "Archive", required: false },
  },
  { timestamps: true },
)

export const Project = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
