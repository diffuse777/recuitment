import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  registerNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  yearOfStudy: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  preferredClub: {
    type: String,
    enum: ['CYBERNERDS', 'OWASP'],
    required: true,
  },
  preferredDomain: {
    type: String,
    enum: ['Secretary', 'Web Development', 'Technical Team', 'Social Media', 'PR Team', 'Research Team', 'Event Management', 'Graphic Designer'],
    required: true,
  },
  hasProject: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  projectDescription: {
    type: String,
    default: '',
  },
  availableForInterview: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  resumeFileName: {
    type: String,
    default: '',
  },
  resumePath: {
    type: String,
    default: '',
  },
  // Stored in MongoDB so admins can always view it
  resumeData: {
    type: Buffer,
    select: false,
  },
  hasResume: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Under Review', 'Interview', 'Accepted', 'Rejected'],
    default: 'Under Review',
  }
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);
