import mongoose from 'mongoose';

import CaseSheet from '../models/CaseSheet.js';
import { analyzeSymptoms, statusForAssessment } from '../services/triageEngine.js';
import { generateCaseSheetPDF } from '../services/pdfService.js';

const MAX_TEXT_LENGTH = 5000;

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
      location: location?.lat != null && location?.lng != null ? location : undefined,
    });

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
      verifiedAdvice: assessment.verifiedAdvice,
      requiresHumanReview: assessment.requiresHumanReview,
      matchedKeywords: assessment.matchedKeywords,
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

export const prescribeCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid case id' });
    }

    const caseSheet = await CaseSheet.findById(id);
    if (!caseSheet) {
      return res.status(404).json({ message: 'Case sheet not found' });
    }

    const { status, doctorNotes, ayurvedicMarkers, prescription } = req.body ?? {};

    if (status !== undefined) {
      const allowedStatuses = ['in_consultation', 'resolved_selfcare'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
        });
      }
      caseSheet.status = status;
    }

    if (doctorNotes !== undefined) {
      if (typeof doctorNotes !== 'string') {
        return res.status(400).json({ message: 'doctorNotes must be a string' });
      }
      caseSheet.doctorNotes = doctorNotes;
    }

    if (ayurvedicMarkers !== undefined) {
      if (typeof ayurvedicMarkers !== 'object' || ayurvedicMarkers === null || Array.isArray(ayurvedicMarkers)) {
        return res.status(400).json({ message: 'ayurvedicMarkers must be an object' });
      }
      caseSheet.ayurvedicMarkers = {
        ...(caseSheet.ayurvedicMarkers?.toObject ? caseSheet.ayurvedicMarkers.toObject() : caseSheet.ayurvedicMarkers),
        ...ayurvedicMarkers,
      };
    }

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
    }

    if (!caseSheet.assignedDoctorId) {
      caseSheet.assignedDoctorId = req.user._id;
    }

    await caseSheet.save();

    await caseSheet.populate([
      { path: 'patientId', select: 'name phone email abhaId languagePreference' },
      { path: 'assignedDoctorId', select: 'name role' },
    ]);

    req.app.get('io')?.to(`case:${id}`).emit('case:updated', {
      caseId: caseSheet._id,
      status: caseSheet.status,
      assignedDoctorId: caseSheet.assignedDoctorId,
      updatedAt: caseSheet.updatedAt,
    });

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

    const isOwner = String(caseSheet.patientId?._id ?? caseSheet.patientId) === String(req.user._id);
    const isClinician = ['doctor', 'support', 'admin'].includes(req.user.role);

    if (!isOwner && !isClinician) {
      return res.status(403).json({ message: 'Forbidden: this case belongs to another patient' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="case-${id}.pdf"`);

    generateCaseSheetPDF(caseSheet, res);
  } catch (err) {
    next(err);
  }
};
