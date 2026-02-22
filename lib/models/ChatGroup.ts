import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface IChatGroup extends Document {
    name: string
    description?: string
    image?: string
    admin: mongoose.Types.ObjectId
    members: mongoose.Types.ObjectId[]
    createdAt: Date
    updatedAt: Date
}

const ChatGroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        image: { type: String },
        admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
        members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
)

export default mongoose.models.ChatGroup || mongoose.model<IChatGroup>("ChatGroup", ChatGroupSchema)
