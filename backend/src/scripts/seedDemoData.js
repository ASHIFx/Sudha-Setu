import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Ambulance from '../models/Ambulance.js';
import Hospital from '../models/Hospital.js';
import CaseSheet from '../models/CaseSheet.js';
import Dispatch from '../models/Dispatch.js';

const DEMO_PASSWORD = 'DemoPass@123';

const DEMO_HOSPITALS = [
  {
    name: 'All India Institute of Ayurveda (AIIA) Apex Hospital',
    location: { lat: 28.5298, lng: 77.2917 },
    phone: '011-29997108',
    emergencyCapable: true,
    city: 'New Delhi',
    address: 'Mathura Road, Gautam Puri, Sarita Vihar, New Delhi',
    accreditation: 'NABH Accredited Apex Teaching Hospital',
    specialties: ['Panchakarma Center of Excellence', 'Kayachikitsa (Internal Medicine)', 'Shalya Tantra', 'Pediatric Kaumarbhritya'],
    inpatientBeds: 200,
    panchakarmaUnits: 16,
  },
  {
    name: 'Chaudhary Brahm Prakash Ayurved Sansthan',
    location: { lat: 28.5670, lng: 76.9530 },
    phone: '011-25318301',
    emergencyCapable: true,
    city: 'South West Delhi',
    address: 'Khera Dabar, Najafgarh, New Delhi',
    accreditation: 'NABH Super-Specialty Ayurveda Center',
    specialties: ['Specialized Panchakarma Detox', 'Sandhigata Vata & Joint Care', 'Metabolic Lifestyle Disorders', 'Kriya Kalpa Eye Clinic'],
    inpatientBeds: 210,
    panchakarmaUnits: 14,
  },
  {
    name: 'Kottakkal Arya Vaidya Sala Clinical Research Hospital',
    location: { lat: 28.5700, lng: 77.2078 },
    phone: '011-24651700',
    emergencyCapable: false,
    city: 'Central Delhi',
    address: 'B-Block, South Extension Part II, New Delhi',
    accreditation: 'Classical Kerala Panchakarma & Research Facility',
    specialties: ['Kerala Traditional Panchakarma', 'Dravyaguna Herbology', 'Neurological Rehabilitation', 'Spine & Musculoskeletal Wellness'],
    inpatientBeds: 80,
    panchakarmaUnits: 10,
  },
  {
    name: 'Safdarjung Emergency Trauma & Integrative Medicine Wing',
    location: { lat: 28.5700, lng: 77.2078 },
    phone: '011-26165060',
    emergencyCapable: true,
    city: 'New Delhi',
    address: 'Ring Road, Opposite AIIMS, New Delhi',
    accreditation: 'NABH Level-1 Trauma & Clinical Triage Center',
    specialties: ['24x7 Emergency Care & Fleet Dispatch', 'Critical Resuscitation', 'Integrative Emergency Triage', 'Ambulance Command Base'],
    inpatientBeds: 500,
    panchakarmaUnits: 4,
  },
];

const DEMO_PATIENTS = [
  {
    name: 'Amit Kumar',
    email: 'patient.amit@demo.sudhasetu.in',
    phone: '9810011001',
    password: DEMO_PASSWORD,
    role: 'patient',
    languagePreference: 'hi',
    emailVerified: true,
    abhaId: '14-1234-5678-9012',
  },
  {
    name: 'Sneha Roy',
    email: 'patient.sneha@demo.sudhasetu.in',
    phone: '9810011002',
    password: DEMO_PASSWORD,
    role: 'patient',
    languagePreference: 'en',
    emailVerified: true,
    abhaId: '14-9876-5432-1098',
  },
  {
    name: 'Vikram Singh',
    email: 'patient.vikram@demo.sudhasetu.in',
    phone: '9810011003',
    password: DEMO_PASSWORD,
    role: 'patient',
    languagePreference: 'hi',
    emailVerified: true,
  },
];

const DEMO_DOCTORS = [
  {
    user: {
      name: 'Dr. Aarav Sharma',
      email: 'dr.sharma@demo.sudhasetu.in',
      phone: '9820011001',
      password: DEMO_PASSWORD,
      role: 'doctor',
      languagePreference: 'en',
      emailVerified: true,
    },
    profile: {
      specialization: 'Kayachikitsa (Internal Medicine)',
      medicalRegistrationNumber: 'REG-DEL-2018-0421',
      yearsOfExperience: 9,
      verified: true,
    },
  },
  {
    user: {
      name: 'Dr. Meera Iyer',
      email: 'dr.iyer@demo.sudhasetu.in',
      phone: '9820011002',
      password: DEMO_PASSWORD,
      role: 'doctor',
      languagePreference: 'en',
      emailVerified: true,
    },
    profile: {
      specialization: 'Panchakarma & Rasayana Therapy',
      medicalRegistrationNumber: 'REG-KER-2016-0819',
      yearsOfExperience: 12,
      verified: true,
    },
  },
  {
    user: {
      name: 'Dr. Rajesh Verma (Pending)',
      email: 'dr.verma@demo.sudhasetu.in',
      phone: '9820011003',
      password: DEMO_PASSWORD,
      role: 'doctor',
      languagePreference: 'hi',
      emailVerified: true,
    },
    profile: {
      specialization: 'Dravyaguna & Clinical Pharmacology',
      medicalRegistrationNumber: 'REG-UP-2023-1102',
      yearsOfExperience: 3,
      verified: false,
    },
  },
];

const DEMO_AMBULANCES = [
  {
    user: {
      name: 'Manoj Yadav (Fleet 108-A)',
      email: 'driver.manoj@demo.sudhasetu.in',
      phone: '9830011001',
      password: DEMO_PASSWORD,
      role: 'ambulance',
      languagePreference: 'hi',
      emailVerified: true,
    },
    profile: {
      vehicleNumber: 'DL-01-AY-1081',
      stationName: 'Central Delhi Base (Connaught Place)',
      serviceProvider: 'National Health Mission Emergency 108',
      status: 'available',
    },
  },
  {
    user: {
      name: 'Suresh Gupta (Fleet 108-B)',
      email: 'driver.suresh@demo.sudhasetu.in',
      phone: '9830011002',
      password: DEMO_PASSWORD,
      role: 'ambulance',
      languagePreference: 'hi',
      emailVerified: true,
    },
    profile: {
      vehicleNumber: 'DL-02-EM-1082',
      stationName: 'South Delhi Base Station',
      serviceProvider: 'Delhi Emergency Ambulance Fleet',
      status: 'available',
    },
  },
];

const DEMO_ADMIN = {
  name: 'Platform Director',
  email: 'admin@demo.sudhasetu.in',
  phone: '9800011000',
  password: DEMO_PASSWORD,
  role: 'admin',
  languagePreference: 'en',
  emailVerified: true,
};

export const seedDemo = async () => {
  try {
    await connectDB();
    console.log('\n🚀 Starting Sudha Setu Demo Data Seeding...\n');

    const demoEmails = [
      DEMO_ADMIN.email,
      ...DEMO_PATIENTS.map((p) => p.email),
      ...DEMO_DOCTORS.map((d) => d.user.email),
      ...DEMO_AMBULANCES.map((a) => a.user.email),
    ];

    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);

    if (existingUserIds.length > 0) {
      await Promise.all([
        Doctor.deleteMany({ userId: { $in: existingUserIds } }),
        Ambulance.deleteMany({ userId: { $in: existingUserIds } }),
        CaseSheet.deleteMany({ patientId: { $in: existingUserIds } }),
        Dispatch.deleteMany({ ambulanceId: { $in: existingUserIds } }),
        User.deleteMany({ _id: { $in: existingUserIds } }),
      ]);
      console.log('🧹 Cleaned existing demo users and associated records.');
    }

    const hospitalOps = DEMO_HOSPITALS.map((h) =>
      Hospital.findOneAndUpdate({ name: h.name }, h, { upsert: true, returnDocument: 'after' })
    );
    const hospitals = await Promise.all(hospitalOps);
    console.log(`🏥 Seeded ${hospitals.length} emergency-capable hospitals.`);

    const admin = await User.create(DEMO_ADMIN);
    console.log(`👑 Seeded Admin: ${admin.email}`);

    const patients = await User.create(DEMO_PATIENTS);
    console.log(`👥 Seeded ${patients.length} pre-verified patients.`);

    const createdDoctors = [];
    for (const d of DEMO_DOCTORS) {
      const user = await User.create(d.user);
      const doc = await Doctor.create({ ...d.profile, userId: user._id });
      createdDoctors.push({ user, profile: doc });
    }
    console.log(`🩺 Seeded ${createdDoctors.length} doctors (1 pending verification).`);

    const createdAmbulances = [];
    for (const a of DEMO_AMBULANCES) {
      const user = await User.create(a.user);
      const amb = await Ambulance.create({ ...a.profile, userId: user._id });
      createdAmbulances.push({ user, profile: amb });
    }
    console.log(`🚑 Seeded ${createdAmbulances.length} ambulance units.`);

    const verifiedDoctor = createdDoctors.find((d) => d.profile.verified);

    const demoCases = [
      {
        patientId: patients[0]._id,
        assignedDoctorId: null,
        languageUsed: 'hi',
        rawDialogue: [
          { sender: 'patient', message: 'मुझे पिछले 2 दिनों से तेज बुखार, सिरदर्द और गले में बहुत दर्द है।' },
        ],
        symptoms: [
          { name: 'fever', duration: '2 days', severity: 8 },
          { name: 'headache', duration: '2 days', severity: 7 },
          { name: 'sore throat', duration: '1 day', severity: 6 },
        ],
        ayurvedicMarkers: {
          suspectedPrakriti: 'pitta',
          agniStatus: 'tikshna',
          dietHabits: 'Spicy and oily food',
          sleepPattern: 'Disturbed due to heat',
        },
        dangerLevel: 'medium',
        confidenceScore: 0.89,
        status: 'pending_doctor',
        location: { lat: 28.5680, lng: 77.2095, address: 'Near Ansari Nagar, New Delhi' },
      },
      {
        patientId: patients[1]._id,
        assignedDoctorId: verifiedDoctor ? verifiedDoctor.user._id : null,
        languageUsed: 'en',
        rawDialogue: [
          { sender: 'patient', message: 'Feeling severe gas, bloating, and poor digestion after meals.' },
          { sender: 'doctor', message: 'Started Kayachikitsa assessment. Suspected Manda Agni.' },
        ],
        symptoms: [
          { name: 'indigestion', duration: '1 week', severity: 5 },
          { name: 'bloating', duration: '4 days', severity: 4 },
        ],
        ayurvedicMarkers: {
          suspectedPrakriti: 'vata-kapha',
          agniStatus: 'manda',
          dietHabits: 'Irregular lunch timings',
          sleepPattern: 'Normal',
        },
        dangerLevel: 'low',
        confidenceScore: 0.94,
        status: 'in_consultation',
        doctorNotes: 'Prescribed Hingwashtak Churna with warm water before meals. Advised light moong dal diet.',
        prescription: [
          {
            medicineName: 'Hingwashtak Churna',
            dosage: '3 grams',
            timing: 'Twice daily before food',
            duration: '14 days',
            instructions: 'Take with warm water or buttermilk',
          },
        ],
        location: { lat: 28.5300, lng: 77.2900, address: 'Sarita Vihar, New Delhi' },
      },
      {
        patientId: patients[2]._id,
        assignedDoctorId: null,
        languageUsed: 'hi',
        rawDialogue: [
          { sender: 'patient', message: 'सीने में भारी दबाव है और सांस लेने में बहुत तकलीफ हो रही है।' },
        ],
        symptoms: [
          { name: 'chest pain', duration: '1 hour', severity: 10 },
          { name: 'breathlessness', duration: '1 hour', severity: 9 },
        ],
        ayurvedicMarkers: {
          suspectedPrakriti: 'unknown',
          agniStatus: 'unknown',
        },
        dangerLevel: 'high',
        confidenceScore: 0.98,
        status: 'emergency_alerted',
        location: { lat: 28.5665, lng: 77.2085, address: 'Ring Road, Near AIIMS Flyover, New Delhi' },
      },
      {
        patientId: patients[0]._id,
        assignedDoctorId: verifiedDoctor ? verifiedDoctor.user._id : null,
        languageUsed: 'hi',
        rawDialogue: [
          { sender: 'patient', message: 'हल्की खांसी और थकान महसूस हो रही है।' },
        ],
        symptoms: [
          { name: 'cough', duration: '3 days', severity: 3 },
          { name: 'fatigue', duration: '2 days', severity: 3 },
        ],
        ayurvedicMarkers: {
          suspectedPrakriti: 'kapha',
          agniStatus: 'sama',
        },
        dangerLevel: 'low',
        confidenceScore: 0.92,
        status: 'resolved_selfcare',
        doctorNotes: 'Advised Tulsi-Shunthi Kwath and steam inhalation. Case resolved.',
        location: { lat: 28.5680, lng: 77.2095, address: 'New Delhi' },
      },
    ];

    const cases = await CaseSheet.create(demoCases);
    console.log(`📋 Seeded ${cases.length} triage CaseSheets (High, Medium, Low, Resolved).`);

    const highRiskCase = cases.find((c) => c.dangerLevel === 'high');
    if (highRiskCase && createdAmbulances.length > 0) {
      const nearestHosp = hospitals[0];
      const ambProfile = createdAmbulances[0].profile;
      
      const dispatch = await Dispatch.create({
        caseId: highRiskCase._id,
        ambulanceId: ambProfile._id,
        hospitalId: nearestHosp._id,
        patientLocation: highRiskCase.location,
        dangerLevel: 'high',
        status: 'dispatched',
        notes: 'Automated emergency SOS dispatch for acute chest pain case',
      });
      ambProfile.status = 'dispatched';
      await ambProfile.save();
      console.log(`🚨 Seeded Active Ambulance Dispatch: #${dispatch._id.toString().slice(-6).toUpperCase()}`);
    }

    console.log('\n=============================================================');
    console.log('✨ SUDHA SETU DEMO LOGIN CREDENTIALS (PASSWORD: DemoPass@123)');
    console.log('=============================================================');
    console.log('👑 ADMIN:');
    console.log(`   Email: ${DEMO_ADMIN.email}`);
    console.log('\n🩺 DOCTOR (Verified):');
    console.log(`   Email: dr.sharma@demo.sudhasetu.in`);
    console.log('🩺 DOCTOR (Pending Verification in Queue):');
    console.log(`   Email: dr.verma@demo.sudhasetu.in`);
    console.log('\n🚑 AMBULANCE OPERATOR:');
    console.log(`   Email: driver.manoj@demo.sudhasetu.in  (Vehicle: DL-01-AY-1081)`);
    console.log('\n👥 PATIENTS:');
    console.log(`   Email: patient.amit@demo.sudhasetu.in   (Hindi preference)`);
    console.log(`   Email: patient.sneha@demo.sudhasetu.in  (English preference)`);
    console.log('=============================================================\n');

    await disconnectDB();
    console.log('✅ Demo seeding complete. Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Demo seeding failed:', err.message);
    process.exit(1);
  }
};

seedDemo();
