import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface ITask extends Document {
    title: string
    description?: string
    assignees: mongoose.Types.ObjectId[]
    createdBy?: mongoose.Types.ObjectId
    status: "pending" | "in_progress" | "done"
    priority: "low" | "medium" | "high"
    startDate?: Date
    dueDate?: Date
    createdAt: Date
    updatedAt: Date
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            enum: ["pending", "in_progress", "done"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        startDate: { type: Date },
        dueDate: { type: Date },
    },
    { timestamps: true }
)

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema)
