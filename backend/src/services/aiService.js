// Structured mock that mirrors how a real LLM call would be shaped.
// Swap the internals of reviewApplication() with an Anthropic/OpenAI SDK call
// to go live — the interface and error handling remain identical.

const REQUIRED_DOCUMENTS = ['passport', 'transcript', 'english_test'];

const RISK_RULES = [
  {
    check: (app) => !app.studentInfo.dateOfBirth,
    message: 'Date of birth not provided — age verification cannot be completed',
  },
  {
    check: (app) => !app.intakeYear,
    message: 'Intake year not specified — enrollment timeline unclear',
  },
  {
    check: (app) =>
      app.documents.some((d) => d.type === 'english_test') &&
      app.course.toLowerCase().includes('law'),
    message: 'Law courses typically require higher English proficiency — verify test scores meet threshold',
  },
];

function buildPrompt(application) {
  // This is what you'd send to a real LLM API
  return `You are a university admissions QA reviewer for the GSP platform.

Application summary:
- Student: ${application.studentInfo.firstName} ${application.studentInfo.lastName}
- Nationality: ${application.studentInfo.nationality}
- Course: ${application.course} at ${application.university}
- Intake: ${application.intakeMonth ?? 'TBC'} ${application.intakeYear ?? 'TBC'}
- Documents uploaded: ${application.documents.map((d) => d.type).join(', ') || 'none'}
- Current stage: ${application.currentStage}

Required documents: ${REQUIRED_DOCUMENTS.join(', ')}

Task: Evaluate this application for readiness. Return a structured JSON assessment with:
{ missingDocuments, risks, incompatibilities, recommendation, confidence }`;
}

async function reviewApplication(application) {
  // Simulate network + LLM latency (800–1400ms)
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

  const uploadedTypes = new Set(application.documents.map((d) => d.type));
  const missingDocuments = REQUIRED_DOCUMENTS.filter((r) => !uploadedTypes.has(r));

  const risks = RISK_RULES.filter((rule) => rule.check(application)).map((rule) => rule.message);

  const incompatibilities = [];

  let recommendation;
  if (missingDocuments.length > 0) {
    recommendation = 'review_required';
  } else if (risks.length >= 2) {
    recommendation = 'review_required';
  } else {
    recommendation = 'proceed';
  }

  const confidence = missingDocuments.length === 0 && risks.length === 0 ? 0.92 : 0.67;

  return {
    missingDocuments,
    risks,
    incompatibilities,
    recommendation,
    confidence,
    model: 'mock-gsp-reviewer-v1',
    promptUsed: buildPrompt(application),
  };
}

module.exports = { reviewApplication, buildPrompt };
