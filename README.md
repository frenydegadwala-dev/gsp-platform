# GSP Platform

A student application management system for universities. Staff (agents, counsellors, QA officers, admission officers, visa officers, enrolment officers) can create, track, and action student applications through a multi-stage workflow.

---

## What you need before starting

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

That's it. Everything else (Node.js, MongoDB, Angular) runs inside Docker.

---

## How to run

**1. Clone the repo**
```bash
git clone <repo-url>
cd gsp-platform
```

**2. Start everything**
```bash
docker compose up -d
```

This starts three containers — the database, the backend API, and the frontend.

**3. Seed the demo users** *(first time only)*
```bash
docker compose run --rm seed
```

**4. Open the app**

Go to [http://localhost:4200](http://localhost:4200) in your browser.

---

## Demo login credentials

| Role | Email | Password |
|---|---|---|
| Agent | agent@gsp.com | password123 |
| Counsellor | counsellor@gsp.com | password123 |
| QA Officer | qa@gsp.com | password123 |
| Admission Officer | admissions@gsp.com | password123 |
| Visa Officer | visa@gsp.com | password123 |
| Enrolment Officer | enrolment@gsp.com | password123 |

---

## How to stop

```bash
docker compose down
```

To also delete the database:
```bash
docker compose down -v
```

---

## Project structure

```
gsp-platform/
├── backend/      # Node.js / Express API  (port 3000)
├── frontend/     # Angular app            (port 4200)
└── docker-compose.yml
```

---

## Running locally without Docker (optional)

You'll need Node.js 20+ and a running MongoDB instance.

**Backend**
```bash
cd backend
npm install
# create a .env file — see backend/.env for the variables needed
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
ng serve
```

Then open [http://localhost:4200](http://localhost:4200).
