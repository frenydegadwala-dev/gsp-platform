const mongoose = require('mongoose');
const { STAGES } = require('../config/stages');

const stageHistorySchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['passport', 'transcript', 'english_test', 'personal_statement', 'reference', 'other'],
      required: true,
    },
    filename: { type: String, required: true },
    url: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isInternal: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const aiAssessmentSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    missingDocuments: [String],
    risks: [String],
    incompatibilities: [String],
    recommendation: { type: String, enum: ['proceed', 'review_required', 'reject'], required: true },
    confidence: { type: Number, min: 0, max: 1 },
    rawResponse: { type: mongoose.Schema.Types.Mixed },
    model: { type: String },
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    studentInfo: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      nationality: { type: String, required: true },
      dateOfBirth: { type: Date },
    },
    course: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },
    intakeYear: { type: Number },
    intakeMonth: { type: String },

    currentStage: {
      type: String,
      enum: Object.values(STAGES),
      default: STAGES.NEW_APP,
      required: true,
    },

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    reviewNote: { type: String, default: '' },

    stageHistory: [stageHistorySchema],
    documents: [documentSchema],
    notes: [noteSchema],
    tasks: [taskSchema],
    aiAssessments: [aiAssessmentSchema],
  },
  { timestamps: true }
);

applicationSchema.virtual('studentFullName').get(function () {
  return `${this.studentInfo.firstName} ${this.studentInfo.lastName}`;
});

module.exports = mongoose.model('Application', applicationSchema);
