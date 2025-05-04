import mongoose, { Schema, type Document } from "mongoose"

export interface IProject extends Document {
  name: string
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
)

export const Project = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema)
