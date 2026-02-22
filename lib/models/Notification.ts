import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId
    type: "task_assigned" | "announcement_created" | "message" | "group_added" | "system" | "letter_request" | "letter_response"
    title: string
    message: string
    relatedId?: mongoose.Types.ObjectId
    read: boolean
    createdAt: Date
}

const NotificationSchema: Schema = new Schema(
    {
        recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["task_assigned", "announcement_created", "message", "group_added", "system", "letter_request", "letter_response"], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        relatedId: { type: Schema.Types.ObjectId },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
)

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
