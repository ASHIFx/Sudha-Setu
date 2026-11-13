# Project assessment

This is a substantial working prototype, not a complete clinical production service. The code includes patient registration and email verification, multilingual browser speech, symptom intake, a rule engine, doctor queues and prescriptions, PDF export, role administration, directories, Gemini chat endpoints, and database-backed ambulance dispatch records.

## Fixed in this review

- Patients can request SOS dispatch for their own high-risk case. Other patients’ cases remain inaccessible.
- Dispatch lists, status changes, and live notifications are scoped to the assigned crew; administrators retain oversight.
- Vehicle reservation is atomic and only available vehicles can be assigned. A partial unique index prevents multiple active dispatches per case; repeated requests return an existing dispatch. Failed creation releases the reservation, and completed/cancelled runs cannot be reopened.
- Emergency keyword checks run before mild rule matches. Negation no longer matches parts of ordinary words, and repeated keyword occurrences are examined.
- Unknown symptoms without a usable AI assessment go to human review. Generated AI advice is no longer represented as clinician-verified advice, and explicit human-review requirements cannot be bypassed by a high confidence score.
- Invalid model output falls back instead of failing database validation. Chat, assessment, and extraction use a configurable model.
- Refresh tokens cannot be used as API/socket access tokens. Object-valued credentials are rejected, and an invalid new password no longer consumes its reset code. Existing sessions must log in again after this token-format change.
- The SOS screen reports request failure and removes the artificial countdown and unconfirmed arrival claims. Review-queue messages no longer promise an acknowledged doctor response.
- Fixed ambulance navigation loops, authentication initialization redirects, and local logout state after a failed request.
- Knowledge-base seeding preserves existing cases and rules. Demo dispatch cleanup uses actual case/ambulance identifiers. Production seeding is blocked.
- Added setup/test/start commands, ignored generated dependencies and secrets, and made local production startup serve the frontend build.
- Updated vulnerable dependencies and replaced the development watcher with Node’s built-in watcher.

## Still required before a real release

1. **Runtime configuration and integration verification.** No `backend/.env`, running MongoDB, Docker installation, or service credentials were available in this workspace during review. Configure MongoDB, JWT signing, verified email delivery, and the intended Gemini model. Test registration, email verification, password reset, doctor prescription/PDF, socket reconnects, and dispatch completion against a real test database and browsers.
2. **Clinical validation.** The rule engine and English emergency keyword guard are not a validated diagnostic or emergency detection system. Multilingual clinical accuracy, negation, complex descriptions, voice transcription, and sample remedies need qualified clinical review and a representative evaluation set. Browser speech support varies. PDF export uses Helvetica and does not yet provide reliable Indic-script rendering.
3. **Real emergency operations.** Dispatch creates records and sends app notifications. There is no integration with emergency-service call centres, live ambulance GPS, confirmed hospital capacity, or an assured crew response. Database/notification failures, abandoned reservations after process crashes, and multi-step dispatch updates need operational recovery before use with real patients.
4. **Verified directory data.** Doctor degrees, consultation prices, location and hours currently include hardcoded values; hospital models and directory responses also include invented defaults. Replace these with verified fields and distinguish unknown values. Seeded facility records are examples.
5. **Product features beyond the prototype.** Chat has server endpoints but no patient chat interface. Appointment booking, follow-up scheduling, clinician acknowledgement/assignment controls, patient dispatch tracking, and live hospital availability are not complete workflows. ABHA is stored as text, without identity verification or an ABDM integration.
6. **Production controls.** Define consent, retention/deletion, audit records, backups, monitoring, and recovery for patient data. Verify authorization and browser session behavior in the actual HTTPS deployment. Do not expose demo accounts in production.
7. **Existing database migration.** Before deploying the active-dispatch unique index, inspect and reconcile any existing duplicate active dispatches. The index requires MongoDB 6+ for its partial `$in` filter. Take a backup before running any seed or migration command against an existing database.

## Verification scope

Regression tests exercise the actual controllers and services with isolated database mocks, plus a server smoke test without MongoDB. A passing build/test suite does not establish clinical accuracy, live third-party delivery, or full database integration. Dependency audit results are point-in-time checks, not a security certification.

Results from this review: 19 tests passed; production frontend build passed; initial component rendering passed for the landing page, login, registration, patient intake, and the doctor, ambulance and admin dashboards. These render checks do not run browser interactions. Both installed dependency trees reported zero known vulnerabilities after updates. Browser interactions, real database flows, email delivery, Gemini responses, and Docker deployment remain unverified. Run `npm run build` to regenerate the frontend output before `npm start`; checked-in generated assets were left unchanged.
