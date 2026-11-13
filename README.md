# Sudha Setu (सुधा सेतु)
> Voice-Enabled Multilingual Ayurvedic Pre-Consultation & Triage Platform  
> Ministry of Ayush • SIH26047

---

## Quick Start (Local Development)

### 1. Prerequisites & Environment Setup
- Node.js (v20+)
- MongoDB instance (local or MongoDB Atlas connection string)

Copy environment templates:
```sh
# Backend config
cp backend/.env.example backend/.env
# Set MONGO_URI, JWT_SECRET (32+ chars), and optional GEMINI_API_KEY / BREVO_API_KEY
```

### 2. Seed Realistic Demo Data
Populate pre-verified doctors, patients, ambulances, hospitals, and clinical triage cases:
```sh
npm run seed:demo
```
*Outputs instant login credentials for Doctor, Patient, Ambulance, and Admin roles.*

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

---

## Docker Deployment (Single Container)
Builds the React frontend and serves it alongside the Express API and Socket.IO endpoint on port 5000:
```sh
docker compose up --build
```
Open `http://localhost:5000`.
