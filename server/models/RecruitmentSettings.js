import mongoose from 'mongoose';

const STATUS = ['not_started', 'open', 'closed'];

const recruitmentSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
    },
    opensAt: {
      type: Date,
      default: null,
    },
    closesAt: {
      type: Date,
      default: null,
    },
    // Admin-configured status; effective status also respects dates
    status: {
      type: String,
      enum: STATUS,
      default: 'not_started',
    },
  },
  { timestamps: true }
);

export const RECRUITMENT_STATUSES = STATUS;
export default mongoose.model('RecruitmentSettings', recruitmentSettingsSchema);
