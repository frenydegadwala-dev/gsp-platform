# StudyNow Ltd — Technical Assessment Breakdown
**Role:** CRM & Automation Developer — GSP Platform  
**Deadline:** 5 days from receiving the brief  
**Time Budget:** ~4–5 hours  

---

## What Is This?

StudyNow Ltd runs a platform called **GSP (Global Students Pathway)** — a system that tracks international student applications from first enquiry all the way through to university enrolment.

You need to build a **mini working prototype** of that system to prove you understand workflow systems, can write clean backend code, and know how to integrate AI in a practical way.

---

## Tech Stack (Non-Negotiable)

| Layer     | Technology  |
|-----------|-------------|
| Runtime   | Node.js     |
| API       | Express.js  |
| Database  | MongoDB     |
| Frontend  | Any (Angular preferred, plain HTML fine) |

---

## The Application Pipeline

Think of this as a **conveyor belt** — a student's application moves forward through checkpoints. You only need to implement **6–7 stages** (not all 11).

### Recommended Pipeline:

```
New App → QA Review → App Review → Decision → Deposit → CAS Review → Enrolment
```

| # | Stage         | What Happens                                          |
|---|---------------|-------------------------------------------------------|
| 1 | New App       | Application created (by internal user or agent)       |
| 2 | QA Review     | Documents and data are checked for completeness       |
| 3 | App Review    | Admission Officer reviews the actual application      |
| 4 | Decision      | University's acceptance/rejection is recorded         |
| 5 | Deposit       | Student pays their deposit                            |
| 6 | CAS Review    | UK visa paperwork (CAS letter) is reviewed            |
| 7 | Enrolment     | Student is officially enrolled                        |

### Dead-End States (Terminal/Branch):

| State        | When It Applies                                        |
|--------------|--------------------------------------------------------|
| App Rejected | Only reachable from QA Review or App Review            |
| Closed Lost  | Reachable from multiple stages (withdrawal, cancel…)   |
| Offer Exists | Entry point for students who already have a uni offer  |

**Rule:** No skipping stages. Forward only. No going backwards except via explicit contextual actions.

---

## Roles & What They Can Do

| Role               | Owns These Stages                    | Can See Internal Transitions? |
|--------------------|--------------------------------------|-------------------------------|
| Agent (external)   | Submit new apps only                 | No                            |
| Counsellor         | New App creation & management        | Yes                           |
| QA Officer         | QA Review                            | Yes                           |
| Admission Officer  | App Review, Decision                 | Yes                           |
| Visa Officer       | Visa Pending, Visa Decision          | Yes                           |
| Enrolment Officer  | Enrolment                            | Yes                           |

### Agent Restrictions (Critical):
An Agent can:
- Submit a new application
- Upload documents
- Add notes
- View status of their own applications

An Agent **cannot**:
- Trigger any stage transitions
- See internal review processes
- Access other agents' applications

---

## The 6 Required Features

### 1a. Workflow Engine & Stage Transitions
- Model the lifecycle as a **state machine**
- Each app has a `currentStage` field
- Transitions must be **explicit** — enforce the order, no skipping
- Only forward progression (except terminal exits)

### 1b. Conditional Stage Rules (Business Rules)
Implement **at least 2 rules** that block a transition if conditions aren't met.

Examples:
- Cannot move `QA Review → App Review` unless all required documents are uploaded
- Cannot move to `Decision` unless the Admission Officer has recorded a review note

The point: show that transition logic is **enforced by the system**, not assumed.

### 1c. Role-Based Permissions
- At least **3 roles** implemented
- Each role can only trigger transitions relevant to their scope
- Agent boundary must be enforced (see above)

### 1d. Contextual Actions
These are **not stage transitions** — they are special actions that appear/disappear based on current stage + user role.

| Action        | When Available                          |
|---------------|-----------------------------------------|
| Add Note      | Always (non-destructive)                |
| Add Attachment| Always (non-destructive)                |
| Add Task      | Always (non-destructive)                |
| Defer         | Various stages (pauses the application) |
| Change Course | Various stages (may trigger re-review)  |
| Withdraw      | Specific stages                         |
| Cancel        | Specific stages                         |
| Refund        | Only **after** Deposit                  |
| Drop Out      | Only **after** Enrolment                |

Logic: `getAvailableActions(application, userRole)` → returns list of allowed actions.

### 1e. AI-Assisted Review
When an application enters **QA Review** or **App Review**, the system should:
1. Evaluate the uploaded documents against course/university requirements
2. Return a **structured readiness assessment** flagging:
   - Missing documents
   - Potential incompatibilities
   - Risks
3. Surface this to the reviewing officer **before** they begin manual review

**Real API or Mock — both accepted.** If mocking:
- Show how you'd structure the prompt
- Show the API call with error handling, timeouts, and latency simulation
- Show how you parse and present the response

Key principle: **AI is advisory, not authoritative.** The officer makes the final call.

### 1f. REST API + Demo Interface

**API (Primary Deliverable):**
- Express.js REST API
- Clear endpoints, proper HTTP status codes
- Input validation and meaningful error responses
- Every feature must be testable via **Postman or curl** without the frontend

**Demo Interface (Secondary):**
- Basic HTML or Angular UI
- Non-technical interviewer must be able to:
  - Create an application
  - Progress it through stages
  - See actions blocked when rules aren't met
  - Switch roles and see different access
  - View the AI assessment output

---

## Live Interview (Part 2) — What They'll Ask

You'll share your screen and walk through the running prototype. Expect them to:
- Try to **break the rules** (e.g., skip a stage, act as an Agent and access internal data)
- Ask how your state machine works
- Ask how you'd add 3 new stages tomorrow (extensibility)
- Ask about your AI prompt design and how you'd swap LLM providers
- Ask about code quality, edge cases, tests

---

## Evaluation Criteria

| Dimension            | What They Want to See                                                    |
|----------------------|--------------------------------------------------------------------------|
| Workflow Thinking    | Stages, rules, transitions modelled cleanly. Branching handled well.     |
| Automation Instinct  | Event-driven thinking. Edge cases considered.                            |
| AI Practicality      | Real LLM integration mindset. AI supports humans, doesn't replace them.  |
| System Ownership     | Extensible, maintainable code. Thinks about what breaks on change.       |
| Communication        | Can explain decisions to non-technical people. Asks good questions.      |

---

## Submission Checklist

- [ ] Git repository (GitHub / GitLab / Bitbucket)
- [ ] `README.md` with local setup instructions
- [ ] README section: which AI tools you used and how
- [ ] README section: what you cut (if any scope was dropped) and why
- [ ] API fully testable via Postman/curl
- [ ] Demo interface runnable locally
- [ ] At least 3 roles implemented
- [ ] At least 2 conditional stage rules enforced
- [ ] Contextual actions system working
- [ ] AI review integration (real or mocked) at QA/App Review stages

---

## Key Decisions to Make Before Coding

1. **State machine approach** — string enum in MongoDB or a separate `stages` config object?
2. **Role enforcement** — middleware-level or service-level?
3. **Contextual actions** — hardcoded map or rule engine?
4. **AI integration** — real Claude/OpenAI call or structured mock?
5. **Frontend** — plain HTML (faster) or Angular (bonus points)?

---

## Notes

- Do **not** over-invest. 4–5 hours max.
- Backend quality > UI polish.
- A working prototype with enforced rules beats a pretty UI with broken logic.
- If you cut scope, be explicit about it in the README — that transparency is part of what they evaluate.
