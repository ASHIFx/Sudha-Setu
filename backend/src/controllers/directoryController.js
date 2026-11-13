import Doctor from '../models/Doctor.js';
import Ambulance from '../models/Ambulance.js';
import Hospital from '../models/Hospital.js';

export const getDirectory = async (_req, res, next) => {
  try {
    const [doctors, ambulances, hospitals] = await Promise.all([
      Doctor.find({ verified: true })
        .populate('userId', 'name email phone languagePreference')
        .sort({ yearsOfExperience: -1 })
        .lean(),
      Ambulance.find()
        .populate('userId', 'name phone')
        .sort({ status: 1 })
        .lean(),
      Hospital.find().sort({ name: 1 }).lean(),
    ]);

    const formattedDoctors = doctors.map((d) => ({
      id: d._id,
      name: d.userId?.name || 'Verified Practitioner',
      email: d.userId?.email || '',
      phone: d.userId?.phone || '',
      specialization: d.specialization,
      registrationNumber: d.medicalRegistrationNumber,
      experienceYears: d.yearsOfExperience || 0,
      verified: d.verified,
      available: true,
      degree: 'BAMS, MD (Ayurveda)',
      consultationFee: 500,
      city: 'New Delhi',
      languages: d.userId?.languagePreference === 'hi' ? ['Hindi', 'English'] : ['English', 'Hindi'],
      opdTiming: '09:00 AM - 05:00 PM IST',
    }));

    const formattedAmbulances = ambulances.map((a) => ({
      id: a._id,
      vehicleNumber: a.vehicleNumber,
      stationName: a.stationName,
      serviceProvider: a.serviceProvider || 'Emergency Medical Transport',
      status: a.status || 'available',
      operatorName: a.userId?.name || 'Fleet Crew',
      operatorPhone: a.userId?.phone || '112',
    }));

    const formattedHospitals = hospitals.map((h) => ({
      id: h._id,
      name: h.name,
      phone: h.phone,
      location: h.location,
      emergencyCapable: h.emergencyCapable,
      city: h.city || 'New Delhi',
      address: h.address || 'Central Healthcare Complex',
      accreditation: h.accreditation || 'NABH Accredited Center of Excellence',
      specialties: h.specialties?.length ? h.specialties : ['Kayachikitsa', 'Panchakarma', 'Emergency Triage', 'Shalya Tantra'],
      inpatientBeds: h.inpatientBeds || 120,
      panchakarmaUnits: h.panchakarmaUnits || 8,
    }));

    res.json({
      doctors: formattedDoctors,
      ambulances: formattedAmbulances,
      hospitals: formattedHospitals,
    });
  } catch (err) {
    next(err);
  }
};
