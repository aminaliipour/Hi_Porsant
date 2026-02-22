import mongoose, { Schema, Document } from "mongoose"
// Import referenced models to ensure they're registered
import "./User"
import "./ChatGroup"

export interface IChatGroupTask extends Document {
    chatGroup: mongoose.Types.ObjectId
    title: string
    description?: string
    assignedTo: mongoose.Types.ObjectId
    createdBy: mongoose.Types.ObjectId
    dueDate?: Date
    priority?: "high" | "medium" | "low"
    status: "pending" | "done"
    createdAt: Date
    updatedAt: Date
}

const ChatGroupTaskSchema: Schema = new Schema(
    {
        chatGroup: { type: Schema.Types.ObjectId, ref: "ChatGroup", required: true },
        title: { type: String, required: true },
        description: { type: String },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        dueDate: { type: Date },
        priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
        status: { type: String, enum: ["pending", "done"], default: "pending" },
    },
    { timestamps: true }
)

export default mongoose.models.ChatGroupTask || mongoose.model<IChatGroupTask>("ChatGroupTask", ChatGroupTaskSchema)
