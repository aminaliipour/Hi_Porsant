import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
    name: string
    nationalCode: string
    role: "admin" | "user"
    avatar?: string
    jobTitle?: string
    fatherName?: string
    phoneNumber?: string
    email?: string
    education?: string
    address?: string
    cardNumber?: string
    bankAccount?: string
    createdAt: Date
    updatedAt: Date
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        nationalCode: { type: String, required: true, unique: true },
        role: { type: String, enum: ["admin", "user"], default: "user" },
        avatar: { type: String },
        jobTitle: { type: String },
        fatherName: { type: String },
        phoneNumber: { type: String },
        email: { type: String },
        education: { type: String },
        address: { type: String },
        cardNumber: { type: String },
        bankAccount: { type: String },
    },
    { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
