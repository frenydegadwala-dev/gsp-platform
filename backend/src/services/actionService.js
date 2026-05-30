const { CONTEXTUAL_ACTIONS, AGENT_ALLOWED_ACTIONS } = require('../config/actions');
const { TERMINAL_STAGES } = require('../config/stages');

function getAvailableActions(application, userRole) {
  const stage = application.currentStage;
  const isTerminal = TERMINAL_STAGES.has(stage);

  return Object.entries(CONTEXTUAL_ACTIONS)
    .filter(([key, action]) => {
      // Agents only get their narrow subset
      if (userRole === 'agent' && !AGENT_ALLOWED_ACTIONS.has(key)) return false;

      // Stage check — terminal stages never allow any action
      if (isTerminal) return false;
      if (action.availableStages !== '*' && !action.availableStages.includes(stage)) return false;

      // Role check
      if (action.availableRoles !== '*' && !action.availableRoles.includes(userRole)) return false;

      return true;
    })
    .map(([key, action]) => ({ key, label: action.label, isDestructive: action.isDestructive }));
}

module.exports = { getAvailableActions };
