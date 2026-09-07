import mongoose from 'mongoose';
import { DANGER_LEVELS } from './KnowledgeBase.js';

export const CASE_STATUSES = [
  'resolved_selfcare',
  'pending_doctor',
  'in_consultation',
  'escalated_human',
  'emergency_alerted',
  // Doctor workflow additions
  'pending_support',
  'queued_for_doctor',
  'completed',
];

export const DIALOGUE_SENDERS = ['patient', 'bot', 'doctor', 'support'];

/** One turn of the pre-consultation conversation, kept verbatim for audit. */
const dialogueTurnSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: DIALOGUE_SENDERS, required: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const symptomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    duration: { type: String, trim: true },
    severity: { type: Number, min: 1, max: 10 },
  },
  { _id: false }
);

const ayurvedicMarkersSchema = new mongoose.Schema(
  {
    suspectedPrakriti: {
      type: String,
      enum: ['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'tridosha', 'unknown'],
      default: 'unknown',
    },
    agniStatus: {
      type: String,
      enum: ['sama', 'vishama', 'tikshna', 'manda', 'unknown'],
      default: 'unknown',
    },
    dietHabits: { type: String, trim: true },
    sleepPattern: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    timing: { type: String, trim: true },
    duration: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

/** Captured for high-danger cases so hospitals and ambulances can be dispatched. */
const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true },
  },
  { _id: false }
);

const caseSheetSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'patientId is required'],
      index: true,
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    languageUsed: { type: String, trim: true, lowercase: true, default: 'auto' },
    rawDialogue: { type: [dialogueTurnSchema], default: [] },
    symptoms: { type: [symptomSchema], default: [] },
    ayurvedicMarkers: { type: ayurvedicMarkersSchema, default: () => ({}) },
    dangerLevel: {
      type: String,
      enum: DANGER_LEVELS,
      required: [true, 'dangerLevel is required'],
      index: true,
    },
    // 0..1 confidence of the triage classification; low values should be
    // routed to a human rather than answered automatically.
    confidenceScore: { type: Number, default: 1.0, min: 0, max: 1 },
    status: {
      type: String,
      enum: CASE_STATUSES,
      default: 'pending_doctor',
      index: true,
    },
    doctorNotes: { type: String, trim: true },
    prescription: { type: [prescriptionItemSchema], default: [] },
    location: { type: locationSchema, default: undefined },
  },
  { timestamps: true }
);

// Doctor's queue: oldest pending case for an assignee first.
caseSheetSchema.index({ assignedDoctorId: 1, status: 1, createdAt: 1 });
// Patient history, newest first.
caseSheetSchema.index({ patientId: 1, createdAt: -1 });

// A prescription is a clinical act; it must be attributable to a doctor.
// Mongoose 9 does not pass `next` to document middleware -- returning is enough.
caseSheetSchema.pre('validate', function requireDoctorForPrescription() {
  if (this.prescription?.length > 0 && !this.assignedDoctorId) {
    this.invalidate(
      'assignedDoctorId',
      'A prescription requires an assigned doctor'
    );
  }
});

const CaseSheet = mongoose.model('CaseSheet', caseSheetSchema);

export default CaseSheet;
