import mongoose from 'mongoose';
import Ambulance from '../models/Ambulance.js';
import Dispatch, { DISPATCH_STATUSES } from '../models/Dispatch.js';
import CaseSheet from '../models/CaseSheet.js';
import Hospital from '../models/Hospital.js';

export const findNearestHospital = async (location) => {
  const hospitals = await Hospital.find({ emergencyCapable: true });

  if (!hospitals || hospitals.length === 0) {
    return null;
  }

  if (!location || location.lat == null || location.lng == null) {
    return hospitals[0];
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  let nearestHospital = null;
  let minDistance = Infinity;

  for (const hosp of hospitals) {
    if (hosp.location?.lat != null && hosp.location?.lng != null) {
      const dLat = toRad(hosp.location.lat - location.lat);
      const dLng = toRad(hosp.location.lng - location.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(location.lat)) *
          Math.cos(toRad(hosp.location.lat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance) {
        minDistance = distance;
        nearestHospital = hosp;
      }
    }
  }

  return nearestHospital || hospitals[0];
};

export const getMyAmbulanceProfile = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email phone'
    );
    if (!ambulance) {
      return res.status(404).json({ message: 'No ambulance profile found for this account' });
    }
    res.json({ ambulance });
  } catch (err) {
    next(err);
  }
};

export const createDispatch = async (req, res, next) => {
  try {
    const { caseId, ambulanceId, notes } = req.body ?? {};

    if (!caseId || !mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ message: 'A valid caseId is required' });
    }

    const caseSheet = await CaseSheet.findById(caseId);
    if (!caseSheet) {
      return res.status(404).json({ message: 'CaseSheet not found' });
    }

    if (req.user.role === 'patient' && String(caseSheet.patientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only request dispatch for your own case' });
    }
    if (req.user.role === 'patient' && ambulanceId) {
      return res.status(400).json({ message: 'Ambulance assignment is managed by the dispatch service' });
    }

    if (caseSheet.dangerLevel !== 'high') {
      return res.status(400).json({
        message: `Ambulance dispatch requires dangerLevel "high" (current: "${caseSheet.dangerLevel}")`,
      });
    }

    const existing = await Dispatch.findOne({ caseId, status: { $in: ['dispatched', 'accepted'] } });
    if (existing) {
      const [ambulance, hospital] = await Promise.all([
        Ambulance.findById(existing.ambulanceId),
        existing.hospitalId ? Hospital.findById(existing.hospitalId) : null,
      ]);
      return res.json({ dispatch: existing, ambulance, hospital });
    }

    if (ambulanceId && !mongoose.isValidObjectId(ambulanceId)) {
      return res.status(400).json({ message: 'Invalid ambulanceId' });
    }
    const nearestHospital = await findNearestHospital(caseSheet.location);
    const ambulance = await Ambulance.findOneAndUpdate(
      { status: 'available', ...(ambulanceId ? { _id: ambulanceId } : {}) },
      { $set: { status: 'dispatched' } },
      { new: true }
    );
    if (!ambulance) {
      return res.status(409).json({
        message: 'No available ambulance unit. Call emergency services directly.',
      });
    }

    let dispatch;
    try {
      dispatch = await Dispatch.create({
        caseId: caseSheet._id,
        ambulanceId: ambulance._id,
        hospitalId: nearestHospital?._id ?? null,
        patientLocation: caseSheet.location,
        dangerLevel: caseSheet.dangerLevel,
        status: 'dispatched',
        notes: notes || 'Emergency dispatch requested for high-risk triage case',
      });
    } catch (err) {
      await Ambulance.updateOne({ _id: ambulance._id, status: 'dispatched' }, { $set: { status: 'available' } });
      if (err.code === 11000) return res.status(409).json({ message: 'This case already has an active dispatch. Refresh to see it.' });
      throw err;
    }

    caseSheet.status = 'emergency_alerted';
    await caseSheet.save();

    const io = req.app.get('io');
    const newDispatchPayload = {
      dispatchId: dispatch._id,
      caseId: caseSheet._id,
      patientLocation: caseSheet.location,
      dangerLevel: caseSheet.dangerLevel,
      createdAt: dispatch.createdAt,
      hospital: nearestHospital
        ? {
            _id: nearestHospital._id,
            name: nearestHospital.name,
            phone: nearestHospital.phone,
            location: nearestHospital.location,
          }
        : null,
      ambulance: {
        _id: ambulance._id,
        vehicleNumber: ambulance.vehicleNumber,
        stationName: ambulance.stationName,
      },
    };

    io?.to('ambulance').to(`user:${ambulance.userId}`).emit('ambulance:new-dispatch', newDispatchPayload);

    io?.to('doctors').emit('case:updated', {
      caseId: caseSheet._id,
      status: caseSheet.status,
      updatedAt: caseSheet.updatedAt,
    });

    res.status(201).json({
      dispatch,
      ambulance,
      hospital: nearestHospital,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', detail: err.message });
    }
    next(err);
  }
};

export const listDispatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      if (!DISPATCH_STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: `status must be one of: ${DISPATCH_STATUSES.join(', ')}` });
      }
      filter.status = status;
    }

    if (req.user.role === 'ambulance') {
      const myProfile = await Ambulance.findOne({ userId: req.user._id });
      if (!myProfile) return res.status(403).json({ message: 'No ambulance profile found for this account' });
      filter.ambulanceId = myProfile._id;
    }

    const dispatches = await Dispatch.find(filter)
      .populate('caseId')
      .populate({
        path: 'ambulanceId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('hospitalId')
      .sort({ createdAt: -1 });

    res.json({ dispatches });
  } catch (err) {
    next(err);
  }
};

export const updateDispatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid dispatch id' });
    }

    if (!status || !DISPATCH_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status is required and must be one of: ${DISPATCH_STATUSES.join(', ')}`,
      });
    }

    const dispatch = await Dispatch.findById(id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not found' });
    }

    if (req.user.role === 'ambulance') {
      const profile = await Ambulance.findOne({ userId: req.user._id });
      if (!profile || String(profile._id) !== String(dispatch.ambulanceId)) {
        return res.status(403).json({ message: 'This dispatch is assigned to another crew' });
      }
    }
    const transitions = { dispatched: ['accepted', 'cancelled'], accepted: ['completed', 'cancelled'] };
    if (!transitions[dispatch.status]?.includes(status)) {
      return res.status(409).json({ message: `Cannot change ${dispatch.status} dispatch to ${status}` });
    }
    const previousStatus = dispatch.status;
    const updated = await Dispatch.findOneAndUpdate(
      { _id: id, status: previousStatus },
      { $set: { status, ...(notes ? { notes } : {}) } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ message: 'Dispatch changed. Refresh before trying again.' });
    dispatch.status = updated.status;
    dispatch.updatedAt = updated.updatedAt;
    if (notes) dispatch.notes = notes;

    let ambulance;
    if (dispatch.ambulanceId) {
      ambulance = await Ambulance.findById(dispatch.ambulanceId);
      if (ambulance) {
        if (status === 'completed' || status === 'cancelled') {
          ambulance.status = 'available';
        } else if (status === 'accepted') {
          ambulance.status = 'busy';
        } else if (status === 'dispatched') {
          ambulance.status = 'dispatched';
        }
        await ambulance.save();
      }
    }

    const io = req.app.get('io');
    const statusUpdatePayload = {
      dispatchId: dispatch._id,
      status: dispatch.status,
      updatedAt: dispatch.updatedAt,
    };

    io?.to('ambulance').to(`user:${ambulance?.userId}`).emit('ambulance:status-update', statusUpdatePayload);

    res.json({ dispatch });
  } catch (err) {
    next(err);
  }
};

export const listAvailableAmbulances = async (req, res, next) => {
  try {
    const ambulances = await Ambulance.find({ status: 'available' }).populate(
      'userId',
      'name email phone'
    );
    res.json({ ambulances });
  } catch (err) {
    next(err);
  }
};
