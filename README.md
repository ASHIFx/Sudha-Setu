# Sudha Setu (सुधा सेतु)
> Voice-Enabled Multilingual Ayurvedic Pre-Consultation & Triage Platform  
> Ministry of Ayush • SIH26047

---

## Quick Start (Local Development)

### 1. Prerequisites & Environment Setup
- Node.js 22+
- MongoDB instance (local or MongoDB Atlas connection string)

Copy environment templates:
```sh
# Backend config
cp backend/.env.example backend/.env
# Set MONGO_URI, JWT_SECRET (32+ chars), and optional GEMINI_API_KEY / BREVO_API_KEY
```

On Windows PowerShell, use `Copy-Item backend/.env.example backend/.env`.
Install both applications from the project root with `npm run setup`.
MongoDB must be running at `MONGO_URI`. Neither the dev server nor the Docker container starts a database.
Use a separate database for demo data. Generate a random JWT secret, for example:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste that value into `JWT_SECRET` in `backend/.env`.
For actual email delivery, set both `BREVO_API_KEY` and the verified sender `EMAIL_USER`.
Without email configuration, development codes appear in the backend terminal; production email requests fail if delivery fails.
AI chat and extraction require `GEMINI_API_KEY` and a `GEMINI_MODEL` available to your account.
Without AI, matching knowledge-base rules still work and unknown symptoms go to doctor review.

### 2. Seed Realistic Demo Data
Populate pre-verified doctors, patients, ambulances, hospitals, and clinical triage cases:
```sh
npm run seed:demo
npm run seed:kb
```
*Outputs instant login credentials for Doctor, Patient, Ambulance, and Admin roles.*

`seed:demo` resets only its named demo accounts and their related records. `seed:kb` adds missing sample rules and prototype accounts while preserving existing cases and rules. Both commands are disabled in production. Seeded medical content and hospital details are demonstration data, not clinically validated protocols or live facility information.

### 3. Run Both Servers Locally
Start both backend (Port 5000) and frontend (Port 5173) with a single command from root:
```sh
npm run dev
```

Or run in separate terminal tabs:
```sh
# Terminal 1: Backend API & Socket Server (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Vite App (Port 5173)
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

For a local production build, run `npm run build` followed by `npm start`, then open `http://localhost:5000`. Set `CLIENT_ORIGINS` and `CLIENT_URL` to your actual browser origin. Production cookies require HTTPS.

Run `npm test` for regression tests. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the assessment, fixes, and remaining release requirements.

---

## Docker Deployment (Single Container)
Builds the React frontend and serves it alongside the Express API and Socket.IO endpoint on port 5000:
```sh
docker compose up --build
```
Open `http://localhost:5000`.
