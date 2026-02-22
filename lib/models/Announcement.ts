import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface IAnnouncement extends Document {
    title: string
    content: string
    sender: mongoose.Types.ObjectId
    targetAudience: "all" | mongoose.Types.ObjectId[]
    createdAt: Date
    updatedAt: Date
}

const AnnouncementSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetAudience: {
            type: Schema.Types.Mixed, // Can be "all" or an array of User IDs
            default: "all",
        },
    },
    { timestamps: true }
)

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema)
