const { TRANSITIONS, TERMINAL_STAGES, AI_REVIEW_STAGES } = require('../config/stages');
const aiService = require('./aiService');

// Business rule validators — keyed by rule name in TRANSITIONS config
const RULES = {
  requiredDocumentsUploaded(application) {
    const required = ['passport', 'transcript', 'english_test'];
    const uploaded = new Set(application.documents.map((d) => d.type));
    const missing = required.filter((r) => !uploaded.has(r));
    if (missing.length > 0) {
      throw Object.assign(new Error(`Missing required documents: ${missing.join(', ')}`), {
        status: 422,
        rule: 'requiredDocumentsUploaded',
        missingDocuments: missing,
      });
    }
  },

  hasReviewNote(application) {
    if (!application.reviewNote || application.reviewNote.trim().length < 10) {
      throw Object.assign(
        new Error('A review note of at least 10 characters is required before progressing to Decision'),
        { status: 422, rule: 'hasReviewNote' }
      );
    }
  },
};

function validateTransition(application, toStage, userRole) {
  const currentStage = application.currentStage;

  if (TERMINAL_STAGES.has(currentStage)) {
    throw Object.assign(new Error(`Application is in a terminal state: ${currentStage}`), {
      status: 422,
    });
  }

  const config = TRANSITIONS[currentStage];
  if (!config) {
    throw Object.assign(new Error(`No transition config found for stage: ${currentStage}`), {
      status: 500,
    });
  }

  if (!config.next.includes(toStage)) {
    throw Object.assign(
      new Error(`Cannot transition from '${currentStage}' to '${toStage}'`),
      { status: 422, allowedNext: config.next }
    );
  }

  // Agents can never trigger transitions
  if (userRole === 'agent') {
    throw Object.assign(new Error('Agents are not permitted to trigger stage transitions'), {
      status: 403,
    });
  }

  if (!config.allowedRoles.includes(userRole)) {
    throw Object.assign(
      new Error(`Your role '${userRole}' cannot transition '${currentStage}' → '${toStage}'`),
      { status: 403, allowedRoles: config.allowedRoles }
    );
  }

  for (const ruleName of config.rules) {
    RULES[ruleName](application);
  }
}

async function applyTransition(application, toStage, user, note = '') {
  validateTransition(application, toStage, user.role);

  application.stageHistory.push({
    stage: toStage,
    movedBy: user._id,
    note,
  });
  application.currentStage = toStage;

  await application.save();

  // Trigger AI assessment asynchronously — don't block the response
  if (AI_REVIEW_STAGES.has(toStage)) {
    aiService
      .reviewApplication(application)
      .then(async (assessment) => {
        application.aiAssessments.push({ stage: toStage, ...assessment });
        await application.save();
      })
      .catch((err) => console.error('AI assessment failed:', err.message));
  }

  return application;
}

function getAvailableTransitions(application, userRole) {
  const currentStage = application.currentStage;
  if (TERMINAL_STAGES.has(currentStage)) return [];
  if (userRole === 'agent') return [];

  const config = TRANSITIONS[currentStage];
  if (!config || !config.allowedRoles.includes(userRole)) return [];

  return config.next;
}

module.exports = { validateTransition, applyTransition, getAvailableTransitions };
