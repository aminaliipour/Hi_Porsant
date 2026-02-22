import mongoose, { Schema, Document } from "mongoose"
// Import referenced models to ensure they're registered
import "./User"
import "./ChatGroup"

export interface IGroupMessage extends Document {
    chatGroup: mongoose.Types.ObjectId
    sender: mongoose.Types.ObjectId
    content: string
    type: "text" | "file" | "image"
    fileUrl?: string
    readBy: mongoose.Types.ObjectId[]
    createdAt: Date
}

const GroupMessageSchema: Schema = new Schema(
    {
        chatGroup: { type: Schema.Types.ObjectId, ref: "ChatGroup", required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ["text", "file", "image"], default: "text" },
        fileUrl: { type: String },
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
)

export default mongoose.models.GroupMessage || mongoose.model<IGroupMessage>("GroupMessage", GroupMessageSchema)
