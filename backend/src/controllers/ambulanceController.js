import mongoose from 'mongoose';
import Ambulance from '../models/Ambulance.js';
import Dispatch, { DISPATCH_STATUSES } from '../models/Dispatch.js';
import CaseSheet from '../models/CaseSheet.js';
import Hospital from '../models/Hospital.js';

/**
 * Finds the nearest hospital to the given coordinates by querying the Hospital collection.
 */
export const findNearestHospital = async (location) => {
  // Query the Hospital collection
  let hospitals = await Hospital.find({ emergencyCapable: true });
  if (!hospitals || hospitals.length === 0) {
    hospitals = await Hospital.find();
  }

  if (!hospitals || hospitals.length === 0) {
    return null;
  }

  if (!location || location.lat == null || location.lng == null) {
    return hospitals[0];
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
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

    if (caseSheet.dangerLevel !== 'high') {
      return res.status(400).json({
        message: `Ambulance dispatch requires dangerLevel "high" (current: "${caseSheet.dangerLevel}")`,
      });
    }

    let ambulance = null;
    if (ambulanceId) {
      if (!mongoose.isValidObjectId(ambulanceId)) {
        return res.status(400).json({ message: 'Invalid ambulanceId' });
      }
      ambulance = await Ambulance.findById(ambulanceId);
      if (!ambulance) {
        return res.status(404).json({ message: 'Specified ambulance not found' });
      }
    } else {
      // Find an available ambulance
      ambulance = await Ambulance.findOne({ status: 'available' });
      if (!ambulance) {
        // Fall back to any ambulance if none marked available
        ambulance = await Ambulance.findOne();
      }
    }

    if (!ambulance) {
      return res.status(404).json({
        message: 'No ambulance units are registered in the system to dispatch',
      });
    }

    // Query Hospital collection for nearest hospital
    const nearestHospital = await findNearestHospital(caseSheet.location);

    const dispatch = await Dispatch.create({
      caseId: caseSheet._id,
      ambulanceId: ambulance._id,
      hospitalId: nearestHospital?._id ?? null,
      patientLocation: caseSheet.location,
      dangerLevel: caseSheet.dangerLevel,
      status: 'dispatched',
      notes: notes || 'Emergency dispatch requested for high-risk triage case',
    });

    // Update ambulance status
    ambulance.status = 'dispatched';
    await ambulance.save();

    // Update case sheet status
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

    io?.to('ambulance').emit('ambulance:new-dispatch', newDispatchPayload);

    // Also notify doctor room of status update
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

    // If ambulance user, filter by their ambulance profile unless they want all
    if (req.user.role === 'ambulance') {
      const myProfile = await Ambulance.findOne({ userId: req.user._id });
      if (myProfile) {
        filter.$or = [{ ambulanceId: myProfile._id }, { status: 'dispatched' }];
      }
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

    dispatch.status = status;
    if (notes) dispatch.notes = notes;
    await dispatch.save();

    // Update linked ambulance status
    if (dispatch.ambulanceId) {
      const ambulance = await Ambulance.findById(dispatch.ambulanceId);
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

    // Emit socket event
    const io = req.app.get('io');
    const statusUpdatePayload = {
      dispatchId: dispatch._id,
      status: dispatch.status,
      updatedAt: dispatch.updatedAt,
    };

    io?.to('ambulance').emit('ambulance:status-update', statusUpdatePayload);

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
