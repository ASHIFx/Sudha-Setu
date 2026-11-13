import mongoose from 'mongoose';

export const DISPATCH_STATUSES = ['dispatched', 'accepted', 'completed', 'cancelled'];

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true },
  },
  { _id: false }
);

const dispatchSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaseSheet',
      required: [true, 'caseId is required'],
      index: true,
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
      required: [true, 'ambulanceId is required'],
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    patientLocation: {
      type: locationSchema,
      default: undefined,
    },
    dangerLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
      required: true,
    },
    status: {
      type: String,
      enum: DISPATCH_STATUSES,
      default: 'dispatched',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

dispatchSchema.index(
  { caseId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['dispatched', 'accepted'] } } }
);

const Dispatch = mongoose.model('Dispatch', dispatchSchema);

export default Dispatch;
