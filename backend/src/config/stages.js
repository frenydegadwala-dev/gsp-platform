const STAGES = {
  NEW_APP: 'new_app',
  QA_REVIEW: 'qa_review',
  APP_REVIEW: 'app_review',
  DECISION: 'decision',
  DEPOSIT: 'deposit',
  CAS_REVIEW: 'cas_review',
  ENROLMENT: 'enrolment',
  APP_REJECTED: 'app_rejected',
  CLOSED_LOST: 'closed_lost',
  OFFER_EXISTS: 'offer_exists',
};

const TERMINAL_STAGES = new Set([
  STAGES.APP_REJECTED,
  STAGES.CLOSED_LOST,
  STAGES.ENROLMENT,
]);

// Stages where AI review is auto-triggered on entry
const AI_REVIEW_STAGES = new Set([STAGES.QA_REVIEW, STAGES.APP_REVIEW]);

const TRANSITIONS = {
  [STAGES.NEW_APP]: {
    next: [STAGES.QA_REVIEW, STAGES.OFFER_EXISTS, STAGES.CLOSED_LOST],
    allowedRoles: ['counsellor'],
    rules: [],
  },
  [STAGES.OFFER_EXISTS]: {
    next: [STAGES.APP_REVIEW, STAGES.CLOSED_LOST],
    allowedRoles: ['counsellor'],
    rules: [],
  },
  [STAGES.QA_REVIEW]: {
    next: [STAGES.APP_REVIEW, STAGES.APP_REJECTED, STAGES.CLOSED_LOST],
    allowedRoles: ['qa_officer'],
    rules: ['requiredDocumentsUploaded'],
  },
  [STAGES.APP_REVIEW]: {
    next: [STAGES.DECISION, STAGES.APP_REJECTED, STAGES.CLOSED_LOST],
    allowedRoles: ['admission_officer'],
    rules: ['hasReviewNote'],
  },
  [STAGES.DECISION]: {
    next: [STAGES.DEPOSIT, STAGES.CLOSED_LOST],
    allowedRoles: ['admission_officer'],
    rules: [],
  },
  [STAGES.DEPOSIT]: {
    next: [STAGES.CAS_REVIEW, STAGES.CLOSED_LOST],
    allowedRoles: ['counsellor', 'admission_officer'],
    rules: [],
  },
  [STAGES.CAS_REVIEW]: {
    next: [STAGES.ENROLMENT, STAGES.CLOSED_LOST],
    allowedRoles: ['visa_officer'],
    rules: [],
  },
  [STAGES.APP_REJECTED]: { next: [], allowedRoles: [], rules: [] },
  [STAGES.CLOSED_LOST]: { next: [], allowedRoles: [], rules: [] },
  [STAGES.ENROLMENT]: { next: [], allowedRoles: [], rules: [] },
};

const STAGE_LABELS = {
  [STAGES.NEW_APP]: 'New Application',
  [STAGES.QA_REVIEW]: 'QA Review',
  [STAGES.APP_REVIEW]: 'App Review',
  [STAGES.DECISION]: 'Decision',
  [STAGES.DEPOSIT]: 'Deposit',
  [STAGES.CAS_REVIEW]: 'CAS Review',
  [STAGES.ENROLMENT]: 'Enrolment',
  [STAGES.APP_REJECTED]: 'Application Rejected',
  [STAGES.CLOSED_LOST]: 'Closed Lost',
  [STAGES.OFFER_EXISTS]: 'Offer Exists',
};

module.exports = { STAGES, TRANSITIONS, TERMINAL_STAGES, AI_REVIEW_STAGES, STAGE_LABELS };
