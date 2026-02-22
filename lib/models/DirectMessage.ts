import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface IDirectMessage extends Document {
    sender: mongoose.Types.ObjectId
    receiver: mongoose.Types.ObjectId
    content: string
    type: "text" | "file" | "image"
    fileUrl?: string
    readBy: mongoose.Types.ObjectId[]
    createdAt: Date
}

const DirectMessageSchema: Schema = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ["text", "file", "image"], default: "text" },
        fileUrl: { type: String },
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
)

export default mongoose.models.DirectMessage || mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema)
