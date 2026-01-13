import mongoose, { Schema } from 'mongoose';
const RefreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
        expires: 0, // TTL index - auto delete expired tokens
    },
}, {
    timestamps: true,
});
RefreshTokenSchema.index({ userId: 1, expiresAt: 1 });
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
//# sourceMappingURL=refresh-token.model.js.map