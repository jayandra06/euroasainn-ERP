import mongoose, { Schema } from "mongoose";
import { PortalType } from "../../../../packages/shared/src/types/index.ts";
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: function () {
            return this.isNew;
        },
        select: false,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    portalType: {
        type: String,
        enum: Object.values(PortalType),
        required: true,
    },
    /** Readable role name like "CTO" */
    roleName: {
        type: String,
        default: "",
    },
    /** Internal casbin role key like "tech_cto" */
    role: {
        type: String,
        required: true, // 🔥 required for Casbin
    },
    roleId: {
        type: Schema.Types.ObjectId,
        ref: "Role",
    },
    /** 🔥 REQUIRED for g2(org → org) */
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
/**
 * Casbin subject
 * Example: user:65ab32e45f...
 */
UserSchema.virtual("casbinSubject").get(function () {
    return `user:${this._id.toString()}`;
});
/**
 * Casbin organization (used as r.org)
 */
UserSchema.virtual("casbinOrg").get(function () {
    return this.organizationId.toString();
});
/* -------------------- INDEXES -------------------- */
UserSchema.index({ email: 1, portalType: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ roleId: 1 });
UserSchema.index({ organizationId: 1, portalType: 1 });
export const User = mongoose.model("User", UserSchema);
//# sourceMappingURL=user.model.js.map