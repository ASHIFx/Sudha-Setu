import Doctor from '../models/Doctor.js';
import Ambulance from '../models/Ambulance.js';

export const getDirectory = async (_req, res, next) => {
  try {
    const [doctors, ambulances] = await Promise.all([
      Doctor.find({ verified: true })
        .populate('userId', 'name email phone languagePreference')
        .sort({ yearsOfExperience: -1 })
        .lean(),
      Ambulance.find()
        .populate('userId', 'name phone')
        .sort({ status: 1 })
        .lean(),
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

    res.json({
      doctors: formattedDoctors,
      ambulances: formattedAmbulances,
    });
  } catch (err) {
    next(err);
  }
};
