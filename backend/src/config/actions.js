const { STAGES } = require('./stages');

// '*' means available at all non-terminal stages / all roles
const CONTEXTUAL_ACTIONS = {
  add_note: {
    label: 'Add Note',
    availableStages: '*',
    availableRoles: '*',
    isDestructive: false,
  },
  add_attachment: {
    label: 'Add Attachment',
    availableStages: '*',
    availableRoles: '*',
    isDestructive: false,
  },
  add_task: {
    label: 'Add Task',
    availableStages: '*',
    availableRoles: '*',
    isDestructive: false,
  },
  defer: {
    label: 'Defer',
    availableStages: [STAGES.QA_REVIEW, STAGES.APP_REVIEW, STAGES.DECISION],
    availableRoles: ['counsellor', 'qa_officer', 'admission_officer'],
    isDestructive: false,
  },
  change_course: {
    label: 'Change Course',
    availableStages: [STAGES.NEW_APP, STAGES.QA_REVIEW, STAGES.APP_REVIEW],
    availableRoles: ['counsellor'],
    isDestructive: false,
  },
  withdraw: {
    label: 'Withdraw',
    availableStages: [STAGES.NEW_APP, STAGES.QA_REVIEW, STAGES.APP_REVIEW, STAGES.DECISION],
    availableRoles: ['counsellor'],
    isDestructive: true,
  },
  cancel: {
    label: 'Cancel',
    availableStages: [STAGES.NEW_APP, STAGES.QA_REVIEW],
    availableRoles: ['counsellor', 'qa_officer'],
    isDestructive: true,
  },
  refund: {
    label: 'Refund',
    availableStages: [STAGES.DEPOSIT, STAGES.CAS_REVIEW, STAGES.ENROLMENT],
    availableRoles: ['admission_officer'],
    isDestructive: true,
  },
  drop_out: {
    label: 'Drop Out',
    availableStages: [STAGES.ENROLMENT],
    availableRoles: ['enrolment_officer'],
    isDestructive: true,
  },
};

// Agent-visible subset only (non-destructive, non-internal)
const AGENT_ALLOWED_ACTIONS = new Set(['add_note', 'add_attachment']);

module.exports = { CONTEXTUAL_ACTIONS, AGENT_ALLOWED_ACTIONS };
