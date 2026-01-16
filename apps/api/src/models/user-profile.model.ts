import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  /** Link to the main User document (one-to-one) */
  userId: mongoose.Types.ObjectId;

  /** Employee Information */
  employeeId?: string;        // e.g., "EA-TECH-089"
  phone?: string;             // e.g., "+91 98765 43210"
  department?: string;        // e.g., "Technology"
  designation?: string;       // e.g., "Senior DevOps Engineer"
  location?: string;          // e.g., "Delhi HQ"

  /** Hierarchy */
  reportingTo?: mongoose.Types.ObjectId;  // References another User (manager)

  /** Audit */
  createdBy?: mongoose.Types.ObjectId;     // Who created this profile (optional but recommended)
  
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    /* 🔗 One-to-One link to User */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,                 // Ensures only one profile per user
      index: true,
    },

    /* 🆔 Employee Details */
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,              // Normalize to uppercase for consistency
      sparse: true,                 // Allows nulls but enforces uniqueness when present
      unique: true,                 // Prevents duplicate employee IDs
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      // Optional: add validation regex if needed later
      // match: /^\+?[1-9]\d{1,14}$/,
    },

    department: {
      type: String,
      trim: true,
      index: true,
    },

    designation: {
      type: String,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      trim: true,
      index: true,
    },

    /* 👤 Reporting Manager */
    reportingTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },

    /* ✍️ Created By (Admin who added the employee) */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,              // Optional, but useful for "Created By: Tech Admin"
      index: true,
    },
  },
  {
    timestamps: true,               // Automatically adds createdAt & updatedAt
  }
);

/* -------------------- COMPOUND INDEXES FOR COMMON QUERIES -------------------- */

// Most common filters in employee lists
UserProfileSchema.index({ department: 1, designation: 1 });
UserProfileSchema.index({ location: 1, department: 1 });
UserProfileSchema.index({ reportingTo: 1, department: 1 });

// For org chart / hierarchy queries
UserProfileSchema.index({ reportingTo: 1 });

// Full-text search on common fields (if you enable text index)
UserProfileSchema.index({
  employeeId: 'text',
  department: 'text',
  designation: 'text',
  location: 'text',
}, { default_language: 'english' });

/* -------------------- PRE-SAVE HOOK (Optional) -------------------- */

// Example: Prevent self-reporting or circular references (advanced)
UserProfileSchema.pre('save', async function (next) {
  if (this.isModified('reportingTo') && this.reportingTo) {
    if (this.reportingTo.toString() === this.userId.toString()) {
      return next(new Error('A user cannot report to themselves'));
    }
    // You can add cycle detection here if needed (more complex)
  }
  next();
});

/* -------------------- VIRTUALS (Optional but useful) -------------------- */

// Virtual to populate reporting manager name easily
UserProfileSchema.virtual('reportingManager', {
  ref: 'User',
  localField: 'reportingTo',
  foreignField: '_id',
  justOne: true,
});

// Virtual for creator name
UserProfileSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);