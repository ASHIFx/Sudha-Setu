import mongoose from 'mongoose';
import KnowledgeBase, { DANGER_LEVELS } from '../models/KnowledgeBase.js';

/* ------------------------------------------------------------------ */
/*  GET /api/kb?search=fever&dangerLevel=high&active=true&page=1      */
/* ------------------------------------------------------------------ */
export const listRules = async (req, res, next) => {
  try {
    const { search, dangerLevel, active } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const filter = {};

    // Text search across keyword triggers.
    if (search) {
      filter.keywordTriggers = { $regex: search.trim(), $options: 'i' };
    }

    if (dangerLevel && DANGER_LEVELS.includes(dangerLevel)) {
      filter.dangerClassification = dangerLevel;
    }

    // Default to active-only unless the caller explicitly asks for all.
    if (active !== 'all') {
      filter.active = active === 'false' ? false : true;
    }

    const [rules, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .sort({ dangerClassification: 1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('verifiedByDoctorId', 'name role')
        .lean(),
      KnowledgeBase.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      rules,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  GET /api/kb/:id                                                   */
/* ------------------------------------------------------------------ */
export const getRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid rule id' });
    }

    const rule = await KnowledgeBase.findById(id)
      .populate('verifiedByDoctorId', 'name role');

    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.json({ rule });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/*  POST /api/kb                                                      */
/*  Body: { keywordTriggers, dangerClassification, verifiedAdvice? }  */
/* ------------------------------------------------------------------ */
export const createRule = async (req, res, next) => {
  try {
    const {
      keywordTriggers,
      dangerClassification,
      verifiedAdvice,
      active,
    } = req.body ?? {};

    if (!keywordTriggers || !Array.isArray(keywordTriggers) || keywordTriggers.length === 0) {
      return res.status(400).json({ message: 'keywordTriggers (non-empty array) is required' });
    }

    if (!dangerClassification || !DANGER_LEVELS.includes(dangerClassification)) {
      return res.status(400).json({
        message: `dangerClassification is required and must be one of: ${DANGER_LEVELS.join(', ')}`,
      });
    }

    const rule = await KnowledgeBase.create({
      keywordTriggers,
      dangerClassification,
      verifiedAdvice: verifiedAdvice ?? {},
      // The creating doctor is the verifier.
      verifiedByDoctorId: req.user._id,
      active: active !== false,
    });

    res.status(201).json({ rule });
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
/*  PUT /api/kb/:id                                                   */
/* ------------------------------------------------------------------ */
export const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid rule id' });
    }

    const rule = await KnowledgeBase.findById(id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    const {
      keywordTriggers,
      dangerClassification,
      verifiedAdvice,
      active,
    } = req.body ?? {};

    if (keywordTriggers !== undefined) rule.keywordTriggers = keywordTriggers;
    if (dangerClassification !== undefined) {
      if (!DANGER_LEVELS.includes(dangerClassification)) {
        return res.status(400).json({
          message: `dangerClassification must be one of: ${DANGER_LEVELS.join(', ')}`,
        });
      }
      rule.dangerClassification = dangerClassification;
    }
    if (verifiedAdvice !== undefined) rule.verifiedAdvice = verifiedAdvice;
    if (active !== undefined) rule.active = active;

    // Re-attribute verification to the editing doctor.
    rule.verifiedByDoctorId = req.user._id;

    await rule.save();

    res.json({ rule });
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
/*  DELETE /api/kb/:id                                                */
/* ------------------------------------------------------------------ */
export const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid rule id' });
    }

    const rule = await KnowledgeBase.findByIdAndDelete(id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.json({ message: 'Rule deleted', id });
  } catch (err) {
    next(err);
  }
};
