import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    emergencyCapable: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'New Delhi',
    },
    address: {
      type: String,
      trim: true,
      default: 'Institutional Area, Healthcare Enclave',
    },
    accreditation: {
      type: String,
      default: 'NABH Accredited & Ayush CoE',
    },
    specialties: {
      type: [String],
      default: () => ['Kayachikitsa', 'Panchakarma', 'Shalya Tantra', 'Rasayana & Immunity'],
    },
    inpatientBeds: {
      type: Number,
      default: 150,
    },
    panchakarmaUnits: {
      type: Number,
      default: 12,
    },
  },
  { timestamps: true }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;
