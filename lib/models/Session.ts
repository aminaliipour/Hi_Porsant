import mongoose, { Schema, Document } from "mongoose"
// Import User model to ensure it's registered before Session uses it in populate
import "./User"

export interface ISession extends Document {
    token: string
    userId: mongoose.Types.ObjectId
    expiresAt: Date
    createdAt: Date
}

const SessionSchema: Schema = new Schema(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
)

// Index for automatic expiration
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema)
