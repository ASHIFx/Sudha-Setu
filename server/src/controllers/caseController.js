import mongoose from 'mongoose';

import CaseSheet, { CASE_STATUSES } from '../models/CaseSheet.js';
import { analyzeSymptoms, statusForAssessment } from '../services/triageEngine.js';
import { generateCaseSheetPDF } from '../services/pdfService.js';

/** Doctor queue ordering: high danger first, then oldest waiting. */
const DANGER_SORT_WEIGHT = { high: 3, medium: 2, low: 1 };

const MAX_TEXT_LENGTH = 5000;

/**
 * POST /api/cases/intake
 * Body: { patientText, languageUsed?, symptoms?, ayurvedicMarkers?, location? }
 *
 * Runs triage on the patient's own words, persists the case sheet, and returns
 * the assessment. The patient is always taken from the authenticated token,
 * never from the request body, so one patient cannot file a case as another.
 */
export const intakeCase = async (req, res, next) => {
  try {
    const {
      patientText,
      languageUsed,
      symptoms,
      ayurvedicMarkers,
      location,
    } = req.body ?? {};

    if (typeof patientText !== 'string' || !patientText.trim()) {
      return res.status(400).json({ message: 'patientText is required' });
    }

    if (patientText.length > MAX_TEXT_LENGTH) {
      return res
        .status(400)
        .json({ message: `patientText must be ${MAX_TEXT_LENGTH} characters or fewer` });
    }

    const assessment = await analyzeSymptoms(patientText);
    const status = statusForAssessment(assessment);

    const caseSheet = await CaseSheet.create({
      patientId: req.user._id,
      languageUsed: languageUsed || req.user.languagePreference || 'auto',
      rawDialogue: [{ sender: 'patient', message: patientText.trim() }],
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      ayurvedicMarkers: ayurvedicMarkers ?? {},
      dangerLevel: assessment.dangerLevel,
      confidenceScore: assessment.confidenceScore,
      status,
      // Only meaningful for high-danger dispatch; omit the subdoc otherwise.
      location: location?.lat != null && location?.lng != null ? location : undefined,
    });

    // Notify the doctor dashboard so a waiting queue updates without polling.
    req.app.get('io')?.to('doctors').emit('case:new', {
      caseId: caseSheet._id,
      dangerLevel: caseSheet.dangerLevel,
      status: caseSheet.status,
      createdAt: caseSheet.createdAt,
    });

    res.status(201).json({
      caseId: caseSheet._id,
      dangerLevel: assessment.dangerLevel,
      confidenceScore: assessment.confidenceScore,
      status,
      // Present only for a confident low-danger case with doctor-signed advice.
      verifiedAdvice: assessment.verifiedAdvice,
      requiresHumanReview: assessment.requiresHumanReview,
      matchedKeywords: assessment.matchedKeywords,
      // The client uses this to trigger SOS mode: hospitals + ambulance alert.
      emergency: assessment.dangerLevel === 'high',
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message])
        ),
      });
    }
    next(err);
  }
};

/**
 * GET /api/cases/queue?status=&dangerLevel=&mine=true&page=1&limit=20
 *
 * The triage dashboard. Sorted by danger level descending, then oldest first,
 * so the sickest patient who has waited longest surfaces at the top.
 */
export const getDoctorQueue = async (req, res, next) => {
  try {
    const { status, dangerLevel, mine } = req.query ?? {};

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const filter = {};

    if (status) {
      filter.status = { $in: String(status).split(',').map((s) => s.trim()) };
    } else {
      // Default view: everything still awaiting clinical action.
      filter.status = { $in: ['pending_doctor', 'in_consultation', 'emergency_alerted', 'escalated_human', 'queued_for_doctor'] };
    }

    if (dangerLevel) {
      filter.dangerLevel = { $in: String(dangerLevel).split(',').map((s) => s.trim()) };
    }

    // `mine=true` narrows to this doctor's own assigned cases.
    if (mine === 'true') {
      filter.assignedDoctorId = req.user._id;
    }

    const [cases, total] = await Promise.all([
      CaseSheet.aggregate([
        { $match: filter },
        { $addFields: { dangerRank: { $switch: {
          branches: Object.entries(DANGER_SORT_WEIGHT).map(([level, weight]) => ({
            case: { $eq: ['$dangerLevel', level] },
            then: weight,
          })),
          default: 0,
        } } } },
        { $sort: { dangerRank: -1, createdAt: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: {
          from: 'users',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient',
          pipeline: [{ $project: { name: 1, phone: 1, languagePreference: 1 } }],
        } },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        { $project: {
          patient: 1,
          assignedDoctorId: 1,
          dangerLevel: 1,
          status: 1,
          confidenceScore: 1,
          symptoms: 1,
          languageUsed: 1,
          location: 1,
          createdAt: 1,
          // The queue view doesn't need the full transcript, just the opener.
          firstMessage: { $first: '$rawDialogue.message' },
        } },
      ]),
      CaseSheet.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      cases,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cases/:id
 * A patient may read only their own case; doctors, support, and admin may read any.
 */
export const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid case id' });
    }

    const caseSheet = await CaseSheet.findById(id)
      .populate('patientId', 'name phone email abhaId languagePreference')
      .populate('assignedDoctorId', 'name role');

    if (!caseSheet) {
      return res.status(404).json({ message: 'Case sheet not found' });
    }

    const isOwner = String(caseSheet.patientId?._id ?? caseSheet.patientId) === String(req.user._id);
    const isClinician = ['doctor', 'support', 'admin'].includes(req.user.role);

    if (!isOwner && !isClinician) {
      return res.status(403).json({ message: 'Forbidden: this case belongs to another patient' });
    }

    res.json({ case: caseSheet });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  PATCH /api/cases/:id                                              */
/*  Body: { status?, assignedDoctorId?, doctorNotes?, prescription? } */
/* ------------------------------------------------------------------ */
/**
 * Allows a doctor or admin to update case fields: status, assignment,
 * notes, and prescriptions. Emits `case:updated` via Socket.IO.
 */
export const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid case id' });
    }

    const caseSheet = await CaseSheet.findById(id);
    if (!caseSheet) {
      return res.status(404).json({ message: 'Case sheet not found' });
    }

    const { status, assignedDoctorId, doctorNotes, prescription } = req.body ?? {};

    // ── Status ──
    if (status !== undefined) {
      if (!CASE_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${CASE_STATUSES.join(', ')}`,
        });
      }
      caseSheet.status = status;
    }

    // ── Assignment ──
    if (assignedDoctorId !== undefined) {
      if (assignedDoctorId === null) {
        caseSheet.assignedDoctorId = null;
      } else if (mongoose.isValidObjectId(assignedDoctorId)) {
        caseSheet.assignedDoctorId = assignedDoctorId;
      } else {
        return res.status(400).json({ message: 'Invalid assignedDoctorId' });
      }
    }

    // ── Doctor Notes ──
    if (doctorNotes !== undefined) {
      caseSheet.doctorNotes = doctorNotes;
    }

    // ── Prescription ──
    // Accept both existing schema format (medicineName) and task-spec format (medicine).
    if (prescription !== undefined) {
      if (!Array.isArray(prescription)) {
        return res.status(400).json({ message: 'prescription must be an array' });
      }
      caseSheet.prescription = prescription.map((rx) => ({
        medicineName: rx.medicineName || rx.medicine,
        dosage: rx.dosage,
        timing: rx.timing,
        duration: rx.duration,
        instructions: rx.instructions,
      }));
      // If adding prescriptions and no doctor is assigned, auto-assign the caller.
      if (caseSheet.prescription.length > 0 && !caseSheet.assignedDoctorId) {
        caseSheet.assignedDoctorId = req.user._id;
      }
    }

    await caseSheet.save();

    // Notify clients watching this case.
    req.app.get('io')?.to(`case:${id}`).emit('case:updated', {
      caseId: caseSheet._id,
      status: caseSheet.status,
      assignedDoctorId: caseSheet.assignedDoctorId,
      updatedAt: caseSheet.updatedAt,
    });

    // Also notify the doctor dashboard.
    req.app.get('io')?.to('doctors').emit('case:updated', {
      caseId: caseSheet._id,
      status: caseSheet.status,
      dangerLevel: caseSheet.dangerLevel,
    });

    res.json({ case: caseSheet });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message])
        ),
      });
    }
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  GET /api/cases/:id/pdf                                            */
/* ------------------------------------------------------------------ */
/**
 * Streams a PDF rendering of the case sheet directly to the client.
 */
export const getCasePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid case id' });
    }

    const caseSheet = await CaseSheet.findById(id)
      .populate('patientId', 'name phone email abhaId languagePreference')
      .populate('assignedDoctorId', 'name role');

    if (!caseSheet) {
      return res.status(404).json({ message: 'Case sheet not found' });
    }

    // Ownership check: patients see only their own; clinicians see any.
    const isOwner = String(caseSheet.patientId?._id ?? caseSheet.patientId) === String(req.user._id);
    const isClinician = ['doctor', 'support', 'admin'].includes(req.user.role);

    if (!isOwner && !isClinician) {
      return res.status(403).json({ message: 'Forbidden: this case belongs to another patient' });
    }

    const pdfDoc = generateCaseSheetPDF(caseSheet);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=case-${id}.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    next(err);
  }
};
