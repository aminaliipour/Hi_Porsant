import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered
import "./User"

export interface ILetterRequest extends Document {
    requester: mongoose.Types.ObjectId
    requestType: string
    title: string
    description?: string
    startDate?: Date
    endDate?: Date
    status: "pending" | "approved" | "rejected"
    reviewedBy?: mongoose.Types.ObjectId
    reviewedAt?: Date
    decisionNote?: string
    createdAt: Date
    updatedAt: Date
}

const LetterRequestSchema: Schema = new Schema(
    {
        requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
        requestType: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
        decisionNote: { type: String },
    },
    { timestamps: true }
)

export default mongoose.models.LetterRequest || mongoose.model<ILetterRequest>("LetterRequest", LetterRequestSchema)
