import "dotenv/config";
import mongoose from "mongoose";

import { connectDB, disconnectDB } from "../config/db.js";
import KnowledgeBase from "../models/KnowledgeBase.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import CaseSheet from "../models/CaseSheet.js";

const SEED_DOCTOR = {
  name: "Dr. Seed Verifier (Ayush Board)",
  email: "seed.doctor@sudhasetu.internal",
  phone: "9000000001",
  password: "ChangeThisSeedPassword123",
  role: "doctor",
  languagePreference: "en",
  emailVerified: true,
};

const SEED_DOCTOR_PROFILE = {
  specialization: "Kayachikitsa (General Ayurvedic Medicine)",
  medicalRegistrationNumber: "SEED-DOC-0001",
  verified: true,
};

const SEED_ADMIN = {
  name: "Seed Admin",
  email: "seed.admin@sudhasetu.internal",
  password: "ChangeThisSeedPassword123",
  role: "admin",
  languagePreference: "en",
  emailVerified: true,
};

const PROTOTYPE_USERS = [
  {
    name: "Rahul Sharma",
    email: "rahul.patient@example.com",
    phone: "9876543210",
    password: "password123",
    role: "patient",
    languagePreference: "hi",
    emailVerified: true,
  },
  {
    name: "Priya Patel",
    email: "priya.patient@example.com",
    phone: "9876543211",
    password: "password123",
    role: "patient",
    languagePreference: "en",
    emailVerified: true,
  },
  {
    name: "Ravi Verma (Ambulance)",
    email: "ravi.ambu@sudhasetu.internal",
    phone: "9876543212",
    password: "password123",
    role: "ambulance",
    languagePreference: "hi",
    emailVerified: true,
  },
  {
    name: "Dr. Asha Singh",
    email: "asha.doc@sudhasetu.internal",
    phone: "9876543213",
    password: "password123",
    role: "doctor",
    languagePreference: "en",
    emailVerified: true,
  },
];

const PROTOTYPE_DOCTOR_PROFILES = [
  {
    email: "asha.doc@sudhasetu.internal",
    profile: {
      specialization: "Pediatrics",
      medicalRegistrationNumber: "DOC-PED-1029",
      verified: true,
    },
  },
];

const buildRules = (doctorId) => [
  {
    keywordTriggers: [
      "chest pain",
      "chest pressure",
      "crushing chest",
      "seene me dard",
      "seene mein dard",
      "छाती में दर्द",
      "सीने में दर्द",
      "heart attack",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "cannot breathe",
      "can not breathe",
      "breathless",
      "breathlessness",
      "shortness of breath",
      "gasping",
      "suffocating",
      "saans nahi aa rahi",
      "saans phool rahi",
      "सांस नहीं आ रही",
      "दम घुट रहा",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "unconscious",
      "fainted",
      "passed out",
      "unresponsive",
      "seizure",
      "convulsions",
      "fits",
      "behosh",
      "बेहोश",
      "मिर्गी का दौरा",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "slurred speech",
      "face drooping",
      "one side weakness",
      "cannot move arm",
      "sudden numbness",
      "stroke",
      "paralysis",
      "lakwa",
      "लकवा",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "vomiting blood",
      "blood in vomit",
      "blood in stool",
      "coughing blood",
      "severe bleeding",
      "bleeding heavily",
      "khoon aa raha",
      "खून आ रहा",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "suicidal",
      "kill myself",
      "end my life",
      "want to die",
      "self harm",
      "aatmahatya",
      "आत्महत्या",
    ],
    dangerClassification: "high",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "persistent fever",
      "fever for days",
      "high fever",
      "fever 103",
      "fever 102",
      "continuous fever",
      "tez bukhar",
      "लगातार बुखार",
      "तेज़ बुखार",
    ],
    dangerClassification: "medium",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "severe abdominal pain",
      "stomach pain for days",
      "unbearable stomach pain",
      "pet me tez dard",
      "पेट में तेज़ दर्द",
      "appendix pain",
    ],
    dangerClassification: "medium",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "unexplained weight loss",
      "losing weight",
      "lump",
      "swelling not going",
      "persistent cough",
      "cough for weeks",
      "purani khansi",
      "पुरानी खांसी",
    ],
    dangerClassification: "medium",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "blood sugar high",
      "sugar not controlled",
      "frequent urination",
      "excessive thirst",
      "diabetes problem",
      "madhumeha",
      "मधुमेह",
    ],
    dangerClassification: "medium",
    verifiedByDoctorId: doctorId,
  },
  {
    keywordTriggers: [
      "seasonal cold",
      "common cold",
      "runny nose",
      "blocked nose",
      "sneezing",
      "mild sore throat",
      "sardi",
      "zukam",
      "सर्दी",
      "जुकाम",
      "pratishyaya",
    ],
    dangerClassification: "low",
    verifiedByDoctorId: doctorId,
    verifiedAdvice: {
      generalTips: [
        "Rest and drink plenty of warm fluids through the day.",
        "Steam inhalation two to three times daily helps clear the nose.",
        "See a doctor if fever crosses 101°F or symptoms persist beyond 5 days.",
      ],
      ayurvedicDietaryNotes: [
        "Prefer warm, freshly cooked, lightly spiced food; it is easier on a weakened agni.",
        "Avoid curd, cold drinks, and refrigerated food, which aggravate kapha.",
        "Add ginger, black pepper, and turmeric to meals.",
      ],
      safeRemedies: [
        "Tulsi and ginger kadha, once or twice a day.",
        "Warm salt-water gargle for throat discomfort.",
        "A quarter teaspoon of turmeric in warm milk at bedtime.",
      ],
    },
  },
  {
    keywordTriggers: [
      "indigestion",
      "acidity",
      "bloating",
      "gas",
      "heartburn",
      "loss of appetite",
      "heaviness after eating",
      "badhazmi",
      "gas ki problem",
      "अपच",
      "गैस",
      "अजीर्ण",
      "agnimandya",
    ],
    dangerClassification: "low",
    verifiedByDoctorId: doctorId,
    verifiedAdvice: {
      generalTips: [
        "Eat at fixed times and stop at roughly three-quarters full.",
        "Walk for 10 minutes after meals instead of lying down.",
        "See a doctor if there is weight loss, vomiting, or black stools.",
      ],
      ayurvedicDietaryNotes: [
        "Sip warm water through the day rather than cold water with meals.",
        "Reduce fried, very spicy, and fermented food while agni is weak.",
        "Keep a 3 to 4 hour gap between meals so the previous one is digested.",
      ],
      safeRemedies: [
        "A pinch of rock salt with fresh ginger juice before meals.",
        "Half a teaspoon of roasted jeera and ajwain in warm water after meals.",
        "Buttermilk with roasted cumin at lunch.",
      ],
    },
  },
  {
    keywordTriggers: [
      "mild constipation",
      "constipation",
      "hard stool",
      "irregular bowel",
      "kabz",
      "कब्ज़",
      "कब्ज",
      "vibandha",
    ],
    dangerClassification: "low",
    verifiedByDoctorId: doctorId,
    verifiedAdvice: {
      generalTips: [
        "Increase water intake to 8 to 10 glasses daily.",
        "Keep a consistent morning routine; do not suppress the urge.",
        "See a doctor if there is blood in stool or a sudden change in bowel habit.",
      ],
      ayurvedicDietaryNotes: [
        "Add cooked vegetables, soaked raisins, and ripe fruit to meals.",
        "A teaspoon of ghee in warm food helps lubricate the colon.",
        "Avoid dry, cold, and heavily processed food, which increase vata.",
      ],
      safeRemedies: [
        "Soak 4 to 5 figs or raisins overnight and eat them in the morning.",
        "Warm water on an empty stomach after waking.",
        "Triphala churna at bedtime, in the dose your physician advises.",
      ],
    },
  },
  {
    keywordTriggers: [
      "mild headache",
      "tension headache",
      "head heaviness",
      "sar dard",
      "सिर दर्द",
      "सरदर्द",
      "shirashoola",
    ],
    dangerClassification: "low",
    verifiedByDoctorId: doctorId,
    verifiedAdvice: {
      generalTips: [
        "Check whether meals or sleep were missed; both are common triggers.",
        "Rest the eyes for 20 seconds every 20 minutes of screen work.",
        "Seek urgent care for the worst headache of your life, or one with fever, vomiting, or vision loss.",
      ],
      ayurvedicDietaryNotes: [
        "Do not skip meals; irregular eating aggravates vata.",
        "Reduce caffeine late in the day.",
        "Keep hydration steady through the day.",
      ],
      safeRemedies: [
        "Gentle head and temple massage with warm sesame or coconut oil.",
        "Nasya with two drops of warm anu taila, if your physician has advised it.",
        "A quiet, dark room for 20 to 30 minutes.",
      ],
    },
  },
  {
    keywordTriggers: [
      "trouble sleeping",
      "cannot sleep",
      "insomnia",
      "poor sleep",
      "disturbed sleep",
      "neend nahi aati",
      "नींद नहीं आती",
      "anidra",
    ],
    dangerClassification: "low",
    verifiedByDoctorId: doctorId,
    verifiedAdvice: {
      generalTips: [
        "Keep a fixed sleep and wake time, including on weekends.",
        "No screens for an hour before bed.",
        "See a doctor if sleeplessness persists beyond three weeks or affects daytime function.",
      ],
      ayurvedicDietaryNotes: [
        "Keep dinner light and finish it 2 to 3 hours before bed.",
        "Avoid tea, coffee, and heavy sweets after sunset.",
        "Warm milk with a pinch of nutmeg at night suits most constitutions.",
      ],
      safeRemedies: [
        "Padabhyanga: massage the soles with warm oil before sleeping.",
        "Ten minutes of slow breathing while lying down.",
        "Ashwagandha at bedtime, only in the dose a physician advises.",
      ],
    },
  },
];

const seed = async () => {
  await connectDB();

  console.log("[seed] Cleaning up old data...");
  console.log("[seed] Cleaning up old data...");

  const allSeedEmails = [
    SEED_DOCTOR.email,
    SEED_ADMIN.email,
    ...PROTOTYPE_USERS.map((u) => u.email),
  ];

  const allSeedMedRegNumbers = [
    SEED_DOCTOR_PROFILE.medicalRegistrationNumber,
    ...PROTOTYPE_DOCTOR_PROFILES.map(
      (dp) => dp.profile.medicalRegistrationNumber,
    ),
  ];

  await Doctor.deleteMany({
    medicalRegistrationNumber: { $in: allSeedMedRegNumbers },
  });

  await User.deleteMany({ email: { $in: allSeedEmails } });

  await CaseSheet.deleteMany({});
  await KnowledgeBase.deleteMany({});

  console.log("[seed] Database wiped. Seeding fresh data...");

  const doctor = await User.create(SEED_DOCTOR);
  console.log(
    `[seed] created verifying doctor ${doctor.name} (${doctor.email})`,
  );

  await Doctor.create({ userId: doctor._id, ...SEED_DOCTOR_PROFILE });
  console.log("[seed] created doctor profile for the seed verifier");

  const admin = await User.create(SEED_ADMIN);
  console.log(`[seed] created bootstrap admin ${admin.email}`);

  console.log("[seed] Seeding prototype users...");
  const userMap = {};
  for (const u of PROTOTYPE_USERS) {
    const user = await User.create(u);
    console.log(`[seed] created dummy user: ${u.name} (${u.role})`);
    userMap[u.email] = user;
  }

  console.log("[seed] Seeding prototype doctor profiles...");
  for (const dp of PROTOTYPE_DOCTOR_PROFILES) {
    const docUser = userMap[dp.email];
    if (docUser) {
      await Doctor.create({ userId: docUser._id, ...dp.profile });
    }
  }

  const rules = buildRules(doctor._id);
  const inserted = await KnowledgeBase.create(rules);

  const byLevel = inserted.reduce((acc, r) => {
    acc[r.dangerClassification] = (acc[r.dangerClassification] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`[seed] inserted ${inserted.length} rules:`, byLevel);

  console.log("[seed] Seeding prototype case sheets...");

  const caseSheets = [
    {
      patientId: userMap["rahul.patient@example.com"]._id,
      doctorId: doctor._id,
      symptoms: ["chest pain", "sweating", "shortness of breath"],
      chiefComplaint:
        "Severe chest pain and shortness of breath during exertion.",
      status: "active",
      urgencyLevel: "high",
      diagnosis: "Suspected Angina / Myocardial Infarction",
      notes: "Patient requires immediate attention. Ambulance dispatched.",
    },
    {
      patientId: userMap["priya.patient@example.com"]._id,
      symptoms: ["high fever", "body ache", "fatigue"],
      chiefComplaint: "Persistent fever for 3 days reaching 102F",
      status: "pending",
      urgencyLevel: "medium",
      notes: "Patient is waiting in the digital queue.",
    },
    {
      patientId: userMap["rahul.patient@example.com"]._id,
      doctorId: userMap["asha.doc@sudhasetu.internal"]._id,
      symptoms: ["mild headache", "stress"],
      chiefComplaint: "Mild headache and tension after work.",
      status: "completed",
      urgencyLevel: "low",
      diagnosis: "Tension Headache",
      prescription:
        "Rest in a dark room. Gentle head massage with warm oil. Prescribed Triphala churna.",
      notes: "Consultation concluded successfully.",
    },
  ];

  await CaseSheet.create(caseSheets);
  console.log(
    `[seed] Created ${caseSheets.length} prototype case sheets for testing.`,
  );
};

seed()
  .then(async () => {
    await disconnectDB();
    console.log("[seed] done");
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[seed] failed:", err.message);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`  - ${field}: ${e.message}`);
      }
    }
    await mongoose.connection.close(false).catch(() => {});
    process.exit(1);
  });
