import mongoose, { Schema, type Document } from "mongoose"

export interface ITeamMember extends Document {
  fullName: string
  position: string
  fatherName: string
  nationalCode: string
  phoneNumber: string
  email?: string
  education?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

const TeamMemberSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    position: { type: String, required: true },
    fatherName: { type: String, required: true },
    nationalCode: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    education: { type: String },
    address: { type: String },
  },
  { timestamps: true },
)

export const TeamMember = mongoose.models.TeamMember || mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema)
