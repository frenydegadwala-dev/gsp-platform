const path = require('path');
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Application = require('../models/Application');
const { authenticate } = require('../middleware/auth');
const workflowService = require('../services/workflowService');
const actionService = require('../services/actionService');
const aiService = require('../services/aiService');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.use(authenticate);

// ── List ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'agent' ? { agentId: req.user._id } : {};
    const apps = await Application.find(filter)
      .populate('agentId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 });

    res.json(apps);
  } catch (err) {
    next(err);
  }
});

// ── Create ────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('studentInfo.firstName').notEmpty().trim(),
    body('studentInfo.lastName').notEmpty().trim(),
    body('studentInfo.email').isEmail().normalizeEmail(),
    body('studentInfo.nationality').notEmpty().trim(),
    body('course').notEmpty().trim(),
    body('university').notEmpty().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Only agents and counsellors can create applications
    if (!['agent', 'counsellor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only agents and counsellors can create applications' });
    }

    try {
      const app = new Application({
        ...req.body,
        agentId: req.user._id,
        stageHistory: [{ stage: 'new_app', movedBy: req.user._id, note: 'Application created' }],
      });
      await app.save();
      res.status(201).json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Get one ───────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('agentId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('stageHistory.movedBy', 'name role')
      .populate('documents.uploadedBy', 'name')
      .populate('notes.createdBy', 'name role')
      .populate('tasks.createdBy', 'name');

    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Agents can only see their own
    if (req.user.role === 'agent' && String(app.agentId._id) !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter out internal notes for agents
    const response = app.toObject();
    if (req.user.role === 'agent') {
      response.notes = response.notes.filter((n) => !n.isInternal);
      response.aiAssessments = []; // agents don't see AI assessments
    }

    // Attach computed fields
    response.availableTransitions = workflowService.getAvailableTransitions(app, req.user.role);
    response.availableActions = actionService.getAvailableActions(app, req.user.role);

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ── Transition ────────────────────────────────────────────────────────────────
router.post('/:id/transition', async (req, res, next) => {
  try {
    const { toStage, note } = req.body;
    if (!toStage) return res.status(400).json({ error: 'toStage is required' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (req.user.role === 'agent' && String(app.agentId) !== req.user._id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await workflowService.applyTransition(app, toStage, req.user, note);

    res.json({ message: `Transitioned to ${toStage}`, currentStage: app.currentStage });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message, ...err });
    next(err);
  }
});

// ── Available actions ─────────────────────────────────────────────────────────
router.get('/:id/available-actions', async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    res.json(actionService.getAvailableActions(app, req.user.role));
  } catch (err) {
    next(err);
  }
});

// ── Contextual actions ────────────────────────────────────────────────────────
router.post('/:id/actions/add_note', async (req, res, next) => {
  try {
    const { content, isInternal = true } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.notes.push({ content, createdBy: req.user._id, isInternal: req.user.role !== 'agent' ? isInternal : false });
    await app.save();
    res.json({ message: 'Note added' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/actions/add_attachment', upload.single('file'), async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (req.user.role === 'agent' && String(app.agentId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const url = `/uploads/${req.file.filename}`;
    app.documents.push({ type, filename: req.file.originalname, url, uploadedBy: req.user._id });
    await app.save();
    res.json({ message: 'Document attached', documents: app.documents });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/actions/add_task', async (req, res, next) => {
  try {
    const { title, dueDate } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (req.user.role === 'agent') return res.status(403).json({ error: 'Agents cannot add tasks' });

    app.tasks.push({ title, dueDate, createdBy: req.user._id });
    await app.save();
    res.json({ message: 'Task added' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/actions/set_review_note', async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'note is required' });
    if (req.user.role !== 'admission_officer') {
      return res.status(403).json({ error: 'Only admission officers can set review notes' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.reviewNote = note;
    await app.save();
    res.json({ message: 'Review note saved' });
  } catch (err) {
    next(err);
  }
});

// ── Defer ─────────────────────────────────────────────────────────────────────
router.post('/:id/actions/defer', async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const allowed = ['counsellor', 'qa_officer', 'admission_officer'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.notes.push({ content: `Deferred${reason ? ': ' + reason : ''}`, createdBy: req.user._id, isInternal: true });
    await app.save();
    res.json({ message: 'Application deferred' });
  } catch (err) { next(err); }
});

// ── Change course ─────────────────────────────────────────────────────────────
router.post('/:id/actions/change_course', async (req, res, next) => {
  try {
    const { course, university } = req.body;
    if (!course && !university) return res.status(400).json({ error: 'course or university is required' });
    if (req.user.role !== 'counsellor') return res.status(403).json({ error: 'Only counsellors can change course' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (course) app.course = course;
    if (university) app.university = university;
    await app.save();
    res.json({ message: 'Course updated', course: app.course, university: app.university });
  } catch (err) { next(err); }
});

// ── Withdraw ──────────────────────────────────────────────────────────────────
router.post('/:id/actions/withdraw', async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    if (req.user.role !== 'counsellor') return res.status(403).json({ error: 'Only counsellors can withdraw applications' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (['app_rejected', 'closed_lost', 'enrolment'].includes(app.currentStage)) {
      return res.status(422).json({ error: 'Application is already in a terminal state' });
    }

    app.stageHistory.push({ stage: 'closed_lost', movedBy: req.user._id, note: reason || 'Application withdrawn' });
    app.currentStage = 'closed_lost';
    await app.save();
    res.json({ message: 'Application withdrawn' });
  } catch (err) { next(err); }
});

// ── Cancel ────────────────────────────────────────────────────────────────────
router.post('/:id/actions/cancel', async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const allowed = ['counsellor', 'qa_officer'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (['app_rejected', 'closed_lost', 'enrolment'].includes(app.currentStage)) {
      return res.status(422).json({ error: 'Application is already in a terminal state' });
    }

    app.stageHistory.push({ stage: 'closed_lost', movedBy: req.user._id, note: reason || 'Application cancelled' });
    app.currentStage = 'closed_lost';
    await app.save();
    res.json({ message: 'Application cancelled' });
  } catch (err) { next(err); }
});

// ── Refund ────────────────────────────────────────────────────────────────────
router.post('/:id/actions/refund', async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    if (req.user.role !== 'admission_officer') return res.status(403).json({ error: 'Only admission officers can issue refunds' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.notes.push({ content: `Refund issued${reason ? ': ' + reason : ''}`, createdBy: req.user._id, isInternal: true });
    await app.save();
    res.json({ message: 'Refund recorded' });
  } catch (err) { next(err); }
});

// ── Drop out ──────────────────────────────────────────────────────────────────
router.post('/:id/actions/drop_out', async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    if (req.user.role !== 'enrolment_officer') return res.status(403).json({ error: 'Only enrolment officers can record drop outs' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.notes.push({ content: `Student dropped out${reason ? ': ' + reason : ''}`, createdBy: req.user._id, isInternal: true });
    await app.save();
    res.json({ message: 'Drop out recorded' });
  } catch (err) { next(err); }
});

// ── AI review (on-demand) ─────────────────────────────────────────────────────
router.get('/:id/ai-review', async (req, res, next) => {
  try {
    if (req.user.role === 'agent') return res.status(403).json({ error: 'Access denied' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const assessment = await aiService.reviewApplication(app);

    // Persist it
    app.aiAssessments.push({ stage: app.currentStage, ...assessment });
    await app.save();

    res.json(assessment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
