/**
 * In-Memory Seed Data and Store for WorkRight
 * Connects Workers, Pay Records, Hazards, and Skill Passports.
 * Includes Employee ID generation, Worker Registration approval queue,
 * and Username/Password authentication.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { calculateExpectedPay, checkViolation } = require('../logic/payCalculator');
const { translateHazardDescription } = require('../logic/translator');

// Initial seed workers (10 workers: 5 construction, 5 hospital)
const initialWorkers = [
  // Construction Workers
  {
    id: 'WRK-C101',
    username: 'ramu',
    password: 'password123',
    name: 'Ramu Selvam',
    role: 'Mason',
    sector: 'construction',
    experience: '4 years in commercial bricklaying, plastering, and scaffolding erection',
    skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols'],
    joinedDate: '2024-03-15',
    status: 'active'
  },
  {
    id: 'WRK-C102',
    username: 'muthu',
    password: 'password123',
    name: 'Muthu Kumar',
    role: 'Plumber',
    sector: 'construction',
    experience: '3 years in industrial pipefitting, drainage, and plumbing systems',
    skills: ['Plumbing', 'Welding', 'Safety Protocols'],
    joinedDate: '2024-04-10',
    status: 'active'
  },
  {
    id: 'WRK-C103',
    username: 'karthik',
    password: 'password123',
    name: 'Karthik Raj',
    role: 'Labourer',
    sector: 'construction',
    experience: '2 years in site material handling and foundation masonry',
    skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols'],
    joinedDate: '2024-06-01',
    status: 'active'
  },
  {
    id: 'WRK-C104',
    username: 'senthil',
    password: 'password123',
    name: 'Senthil Nathan',
    role: 'Supervisor',
    sector: 'construction',
    experience: '6 years in multi-story site supervision and safety enforcement',
    skills: ['Scaffolding', 'Electrical Wiring', 'Safety Protocols'],
    joinedDate: '2023-11-20',
    status: 'active'
  },
  {
    id: 'WRK-C105',
    username: 'arumugam',
    password: 'password123',
    name: 'Arumugam V',
    role: 'Crane Operator',
    sector: 'construction',
    experience: '5 years in heavy crane operation and high-elevation lifting',
    skills: ['Welding', 'Scaffolding', 'Safety Protocols'],
    joinedDate: '2024-01-08',
    status: 'active'
  },
  // Hospital Workers
  {
    id: 'WRK-H201',
    username: 'priya',
    password: 'password123',
    name: 'Priya Manoharan',
    role: 'Sanitation Staff',
    sector: 'hospital',
    experience: '3 years in bio-medical waste handling and hospital sanitation',
    skills: ['Waste Disposal', 'Sanitation Protocols', 'Chemical Handling'],
    joinedDate: '2024-02-12',
    status: 'active'
  },
  {
    id: 'WRK-H202',
    username: 'deepa',
    password: 'password123',
    name: 'Deepa Shankaran',
    role: 'Ward Boy',
    sector: 'hospital',
    experience: '4 years in emergency patient transport and ward logistics',
    skills: ['Patient Care Support', 'Sanitation Protocols', 'First Aid'],
    joinedDate: '2024-05-18',
    status: 'active'
  },
  {
    id: 'WRK-H203',
    username: 'anitha',
    password: 'password123',
    name: 'Anitha Ravi',
    role: 'Nurse',
    sector: 'hospital',
    experience: '3 years in acute patient care and sterile dressing procedures',
    skills: ['Patient Care Support', 'First Aid', 'Sanitation Protocols'],
    joinedDate: '2023-09-01',
    status: 'active'
  },
  {
    id: 'WRK-H204',
    username: 'suresh',
    password: 'password123',
    name: 'Suresh Babu',
    role: 'Security',
    sector: 'hospital',
    experience: '5 years in healthcare facility security and emergency evacuation',
    skills: ['First Aid', 'Safety Protocols', 'Sanitation Protocols'],
    joinedDate: '2024-07-05',
    status: 'active'
  },
  {
    id: 'WRK-H205',
    username: 'meena',
    password: 'password123',
    name: 'Meena Kumari',
    role: 'Kitchen Staff',
    sector: 'hospital',
    experience: '3 years in hygienic dietary prep and commercial kitchen sanitation',
    skills: ['Sanitation Protocols', 'Waste Disposal', 'First Aid'],
    joinedDate: '2024-08-14',
    status: 'active'
  }
];

// Seed Pending Registration Requests for Admin Approval
const initialRegistrationRequests = [
  {
    id: 'REQ-101',
    name: 'Kavitha Sundaram',
    username: 'kavitha',
    password: 'password123',
    sector: 'hospital',
    role: 'Nurse',
    skills: ['Patient Care Support', 'First Aid', 'Sanitation Protocols'],
    requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'pending'
  },
  {
    id: 'REQ-102',
    name: 'Saravanan Perumal',
    username: 'saravanan',
    password: 'password123',
    sector: 'construction',
    role: 'Mason',
    skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols'],
    requestedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: 'pending'
  }
];

const initialPayRecords = [
  // 4 Construction Records (at least 2 violations, at least 1 clean)
  {
    id: 'PAY-101',
    workerId: 'WRK-C101',
    workerName: 'Ramu Selvam',
    role: 'Mason',
    sector: 'construction',
    weekDate: '2026-10-18',
    hours: 50,
    expectedPay: 4996.63,
    actualPay: 3800,
    shortfall: 1196.63,
    violation: true,
    status: 'Violation',
    employerNote: null,
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-102',
    workerId: 'WRK-C102',
    workerName: 'Muthu Kumar',
    role: 'Plumber',
    sector: 'construction',
    weekDate: '2026-10-18',
    hours: 40,
    expectedPay: 3941,
    actualPay: 4000,
    shortfall: 0,
    violation: false,
    status: 'Fair',
    employerNote: 'Standard statutory rate verified.',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-103',
    workerId: 'WRK-C103',
    workerName: 'Karthik Raj',
    role: 'Labourer',
    sector: 'construction',
    weekDate: '2026-10-18',
    hours: 48,
    expectedPay: 4785.5,
    actualPay: 3500,
    shortfall: 1285.5,
    violation: true,
    status: 'Violation',
    employerNote: 'Dispute recorded: overtime hours being audited with site log.',
    createdAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-104',
    workerId: 'WRK-C104',
    workerName: 'Senthil Nathan',
    role: 'Supervisor',
    sector: 'construction',
    weekDate: '2026-10-18',
    hours: 40,
    expectedPay: 3941,
    actualPay: 4500,
    shortfall: 0,
    violation: false,
    status: 'Fair',
    employerNote: 'Supervisor premium rate applied.',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  },

  // 4 Hospital Records (at least 1 violation, at least 1 clean)
  {
    id: 'PAY-201',
    workerId: 'WRK-H201',
    workerName: 'Priya Manoharan',
    role: 'Sanitation Staff',
    sector: 'hospital',
    weekDate: '2026-10-18',
    hours: 60,
    expectedPay: 6300,
    actualPay: 4800,
    shortfall: 1500,
    violation: true,
    status: 'Violation',
    employerNote: null,
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-202',
    workerId: 'WRK-H202',
    workerName: 'Deepa Shankaran',
    role: 'Ward Boy',
    sector: 'hospital',
    weekDate: '2026-10-18',
    hours: 48,
    expectedPay: 4950,
    actualPay: 4200,
    shortfall: 750,
    violation: true,
    status: 'Violation',
    employerNote: 'Shortfall recognized; scheduled for supplementary payout next pay run.',
    createdAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-203',
    workerId: 'WRK-H203',
    workerName: 'Anitha Ravi',
    role: 'Nurse',
    sector: 'hospital',
    weekDate: '2026-10-18',
    hours: 40,
    expectedPay: 4050,
    actualPay: 4200,
    shortfall: 0,
    violation: false,
    status: 'Fair',
    employerNote: 'Compliant shift wage.',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  },
  {
    id: 'PAY-204',
    workerId: 'WRK-H204',
    workerName: 'Suresh Babu',
    role: 'Security',
    sector: 'hospital',
    weekDate: '2026-10-18',
    hours: 48,
    expectedPay: 4950,
    actualPay: 5000,
    shortfall: 0,
    violation: false,
    status: 'Fair',
    employerNote: 'Full night-shift differential included.',
    createdAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString()
  }
];

const initialHazards = [
  // 2 Reported
  {
    id: 'HAZ-2026-001',
    sector: 'hospital',
    category: 'Chemical',
    language: 'Tamil',
    descriptionNative: 'இரண்டாவது மாடி அவசர சிகிச்சை அருகில் ரசாயன கசிவு உள்ளது, வழுக்கும் தரை',
    descriptionEnglish: 'Chemical spill near 2nd floor ICU corridor, pungent odor and slippery surface',
    description: 'Chemical spill near 2nd floor ICU corridor, pungent odor and slippery surface',
    anonymous: true,
    reportedBy: 'Anonymous',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: 'Reported',
    notes: 'Report received via Tamil voice input.'
  },
  {
    id: 'HAZ-2026-002',
    sector: 'construction',
    category: 'Fall',
    language: 'English',
    descriptionNative: 'Missing safety harness anchor line on 4th floor scaffolding east wing',
    descriptionEnglish: 'Missing safety harness anchor line on 4th floor scaffolding east wing',
    description: 'Missing safety harness anchor line on 4th floor scaffolding east wing',
    anonymous: false,
    reportedBy: 'Ramu Selvam',
    workerId: 'WRK-C101',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: 'Reported',
    notes: 'Report received.'
  },
  // 2 Seen
  {
    id: 'HAZ-2026-003',
    sector: 'hospital',
    category: 'Biological',
    language: 'Hindi',
    descriptionNative: 'बायोमेडिकल कचरा रूम B में सुई और अपशिष्ट का डब्बा भर गया है',
    descriptionEnglish: 'Improperly disposed sharps container overflowing in waste room B',
    description: 'Improperly disposed sharps container overflowing in waste room B',
    anonymous: true,
    reportedBy: 'Anonymous',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: 'Seen',
    notes: 'Supervisor dispatched cleaning crew.'
  },
  {
    id: 'HAZ-2026-004',
    sector: 'construction',
    category: 'Electrical',
    language: 'Tamil',
    descriptionNative: 'பிளாக் சி நுழைவாயில் அருகில் தண்ணீர் தேக்கத்தில் மின்சார கம்பி கிடக்கிறது',
    descriptionEnglish: 'Exposed live wiring near cement mixer puddle at block C entrance',
    description: 'Exposed live wiring near cement mixer puddle at block C entrance',
    anonymous: false,
    reportedBy: 'Muthu Kumar',
    workerId: 'WRK-C102',
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    status: 'Seen',
    notes: 'Safety officer cordoned off area.'
  },
  // 2 Fixed
  {
    id: 'HAZ-2026-005',
    sector: 'construction',
    category: 'Structural',
    language: 'English',
    descriptionNative: 'Cracked temporary support beam during basement excavation',
    descriptionEnglish: 'Cracked temporary support beam during basement excavation',
    description: 'Cracked temporary support beam during basement excavation',
    anonymous: false,
    reportedBy: 'Senthil Nathan',
    workerId: 'WRK-C104',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'Fixed',
    notes: 'Steel reinforcements installed and signed off by structural engineer.'
  },
  {
    id: 'HAZ-2026-006',
    sector: 'hospital',
    category: 'Sanitation',
    language: 'Hindi',
    descriptionNative: 'ग्राउंड फ्लोर इमरजेंसी शौचालय में नाली जाम और गंदा पानी भर गया',
    descriptionEnglish: 'Blocked drainage in ground floor emergency washrooms causing backflow',
    description: 'Blocked drainage in ground floor emergency washrooms causing backflow',
    anonymous: true,
    reportedBy: 'Anonymous',
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    status: 'Fixed',
    notes: 'Plumbing contractor cleared blockage and sanitized area.'
  }
];

// Seed Historical and Active Passport Verification Requests
const initialPassportRequests = [
  {
    id: 'PAS-REQ-101',
    workerId: 'WRK-C101',
    workerName: 'Ramu Selvam',
    username: 'ramu',
    sector: 'construction',
    role: 'Mason',
    experience: '3 years in commercial brickwork and scaffolding',
    skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols'],
    totalWeeksWorked: 1,
    cleanWeeksCount: 0,
    requestedAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    status: 'granted',
    certificateId: 'VPC-2026-C101-7891',
    verifiedAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    notes: 'Verified by Site Supervisor. Statutory compliance and trade competency validated.'
  },
  {
    id: 'PAS-REQ-102',
    workerId: 'WRK-C101',
    workerName: 'Ramu Selvam',
    username: 'ramu',
    sector: 'construction',
    role: 'Mason',
    experience: '4 years in commercial bricklaying, plastering, and scaffolding erection',
    skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols'],
    totalWeeksWorked: 1,
    cleanWeeksCount: 0,
    requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'pending',
    certificateId: null,
    verifiedAt: null,
    notes: 'Annual skill passport renewal request with updated experience.'
  },
  {
    id: 'PAS-REQ-201',
    workerId: 'WRK-H201',
    workerName: 'Priya Manoharan',
    username: 'priya',
    sector: 'hospital',
    role: 'Sanitation Staff',
    experience: '3 years in bio-medical waste handling and hospital sanitation',
    skills: ['Waste Disposal', 'Sanitation Protocols', 'Chemical Handling'],
    totalWeeksWorked: 1,
    cleanWeeksCount: 0,
    requestedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    status: 'pending',
    certificateId: null,
    verifiedAt: null,
    notes: 'Official hospital skill passport verification request.'
  }
];

// Storage File Paths (Local data directory or serverless /tmp fallback)
const STORE_FILE = path.join(__dirname, 'store.json');
const TMP_STORE_FILE = path.join(os.tmpdir(), 'workright_store.json');

function getStoreFilePath() {
  try {
    fs.accessSync(__dirname, fs.constants.W_OK);
    return STORE_FILE;
  } catch (e) {
    return TMP_STORE_FILE;
  }
}

// Active in-memory state
let workers = JSON.parse(JSON.stringify(initialWorkers));
let registrationRequests = JSON.parse(JSON.stringify(initialRegistrationRequests));
let payRecords = JSON.parse(JSON.stringify(initialPayRecords));
let hazards = JSON.parse(JSON.stringify(initialHazards));
let passportRequests = JSON.parse(JSON.stringify(initialPassportRequests));

// High-Performance Indexed Lookups (O(1) Map Indexing for high-concurrency efficiency)
const workerIdIndex = new Map();
const workerUsernameIndex = new Map();
const hazardIdIndex = new Map();
const payRecordsWorkerIndex = new Map();

function rebuildIndexes() {
  workerIdIndex.clear();
  workerUsernameIndex.clear();
  hazardIdIndex.clear();
  payRecordsWorkerIndex.clear();

  for (const w of workers) {
    if (w.id) {
      workerIdIndex.set(w.id.toUpperCase(), w);
      workerIdIndex.set(w.id.toLowerCase().replace(/\s+/g, ''), w);
    }
    if (w.username) {
      workerUsernameIndex.set(w.username.toLowerCase(), w);
      workerUsernameIndex.set(w.username.toLowerCase().replace(/\s+/g, ''), w);
    }
  }

  for (const h of hazards) {
    if (h.id) {
      hazardIdIndex.set(h.id, h);
    }
  }

  for (const p of payRecords) {
    if (p.workerId) {
      const list = payRecordsWorkerIndex.get(p.workerId) || [];
      list.push(p);
      payRecordsWorkerIndex.set(p.workerId, list);
    }
  }
}

function persistStore() {
  rebuildIndexes();
  try {
    const target = getStoreFilePath();
    const data = {
      workers,
      registrationRequests,
      payRecords,
      hazards,
      passportRequests
    };
    fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Non-fatal, continue with in-memory state
  }
}

function loadPersistedStore() {
  const candidates = [STORE_FILE, TMP_STORE_FILE];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.workers) && parsed.workers.length > 0) {
          workers = parsed.workers;
          if (Array.isArray(parsed.registrationRequests)) registrationRequests = parsed.registrationRequests;
          if (Array.isArray(parsed.payRecords)) payRecords = parsed.payRecords;
          if (Array.isArray(parsed.hazards)) hazards = parsed.hazards;
          if (Array.isArray(parsed.passportRequests)) passportRequests = parsed.passportRequests;
          rebuildIndexes();
          return true;
        }
      }
    } catch (e) {}
  }
  rebuildIndexes();
  return false;
}

// Attempt to restore any previously persisted accounts/data
loadPersistedStore();
rebuildIndexes();

function resetStore() {
  workers = JSON.parse(JSON.stringify(initialWorkers));
  registrationRequests = JSON.parse(JSON.stringify(initialRegistrationRequests));
  payRecords = JSON.parse(JSON.stringify(initialPayRecords));
  hazards = JSON.parse(JSON.stringify(initialHazards));
  passportRequests = JSON.parse(JSON.stringify(initialPassportRequests));
  rebuildIndexes();

  try {
    if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
    if (fs.existsSync(TMP_STORE_FILE)) fs.unlinkSync(TMP_STORE_FILE);
  } catch (e) {}
}

// Generate unique Employee ID based on sector
function generateEmployeeId(sector) {
  const sec = String(sector || 'construction').toLowerCase();
  const prefix = sec === 'hospital' ? 'WRK-H' : 'WRK-C';
  const startNum = sec === 'hospital' ? 200 : 100;

  // Find max existing number with this prefix
  const existingNums = workers
    .filter(w => w.id && w.id.startsWith(prefix))
    .map(w => {
      const match = w.id.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : startNum;
    });

  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : startNum + 1;
  return `${prefix}${nextNum}`;
}

// Worker operations
function getAllWorkers(sector) {
  if (!sector) return workers;
  const s = String(sector).trim().toLowerCase();
  return workers.filter(w => w.sector.toLowerCase() === s);
}

function getWorkerById(workerId) {
  if (!workerId) return null;
  const idNorm = String(workerId).trim().toUpperCase();
  const indexed = workerIdIndex.get(idNorm);
  if (indexed) return indexed;
  return workers.find(w => w.id && w.id.toUpperCase() === idNorm) || null;
}

function findWorkerByIdOrUsername(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  const norm = raw.toLowerCase();
  const cleanId = norm.replace(/\s+/g, '');

  const byId = workerIdIndex.get(cleanId.toUpperCase()) || workerIdIndex.get(cleanId);
  if (byId) return byId;

  const byUser = workerUsernameIndex.get(norm) || workerUsernameIndex.get(cleanId);
  if (byUser) return byUser;

  return workers.find(w => {
    const wId = (w.id || '').toLowerCase().replace(/\s+/g, '');
    const wUser = (w.username || '').toLowerCase().replace(/\s+/g, '');
    return wId === cleanId || wUser === norm || wUser === cleanId;
  }) || null;
}

function updateWorkerSkills(workerId, skills) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) return null;
  if (Array.isArray(skills)) {
    worker.skills = [...new Set(skills)];
  }
  persistStore();
  return worker;
}

function updateWorkerExperience(workerId, experience) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) return null;
  worker.experience = String(experience || '').trim();
  persistStore();
  return worker;
}

// Worker Authentication (Username or Employee ID + Password)
function authenticateWorker(identifier, password) {
  if (!identifier || !password) return null;
  const worker = findWorkerByIdOrUsername(identifier);
  if (!worker) return null;

  const inputPwd = String(password).trim();
  const workerPwd = String(worker.password || '').trim();

  // 1. Exact match with registered password
  if (workerPwd && workerPwd === inputPwd) {
    return worker;
  }

  // 1b. Case-insensitive match with registered password
  if (workerPwd && workerPwd.toLowerCase() === inputPwd.toLowerCase()) {
    return worker;
  }

  // 2. Demo fallback options ('password123' or 'admin')
  const lowerInput = inputPwd.toLowerCase();
  if (lowerInput === 'password123' || lowerInput === 'admin') {
    return worker;
  }

  // If worker had no password configured
  if (!workerPwd) {
    return worker;
  }

  return null;
}

function resetWorkerPassword(identifier, newPassword = 'password123') {
  const worker = findWorkerByIdOrUsername(identifier);
  if (!worker) return null;
  worker.password = String(newPassword).trim();
  persistStore();
  return worker;
}

// Worker Synchronization (e.g. from client cache or cross-cloud sync)
function syncWorker(workerData) {
  if (!workerData) return null;
  const username = String(workerData.username || '').trim().toLowerCase();
  const id = workerData.id ? String(workerData.id).trim().toUpperCase() : null;

  let existing = null;
  if (id) existing = workers.find(w => w.id && w.id.toUpperCase() === id);
  if (!existing && username) existing = workers.find(w => w.username && w.username.toLowerCase() === username);

  if (existing) {
    if (workerData.password) existing.password = String(workerData.password).trim();
    if (workerData.name) existing.name = workerData.name;
    if (workerData.role) existing.role = workerData.role;
    if (workerData.sector) existing.sector = workerData.sector;
    if (workerData.skills && Array.isArray(workerData.skills)) existing.skills = workerData.skills;
    if (workerData.experience) existing.experience = workerData.experience;
    persistStore();
    return existing;
  }

  const newId = id || generateEmployeeId(workerData.sector);
  const newWorker = {
    id: newId,
    username: username || newId.toLowerCase(),
    password: String(workerData.password || 'password123').trim(),
    name: String(workerData.name || 'Worker').trim(),
    role: String(workerData.role || 'Labourer').trim(),
    sector: workerData.sector ? String(workerData.sector).toLowerCase() : 'construction',
    experience: String(workerData.experience || '').trim(),
    skills: Array.isArray(workerData.skills) && workerData.skills.length > 0 ? workerData.skills : ['Safety Protocols'],
    joinedDate: workerData.joinedDate || new Date().toISOString().split('T')[0],
    status: 'active'
  };

  workers.push(newWorker);

  // If there was any pending registration request with this username, mark it approved
  if (username) {
    const req = registrationRequests.find(r => r.username.toLowerCase() === username && r.status === 'pending');
    if (req) {
      req.status = 'approved';
      req.approvedAt = new Date().toISOString();
    }
  }

  persistStore();
  return newWorker;
}

// Registration Requests (Self-Registration by Worker)
function getRegistrationRequests() {
  return registrationRequests.filter(r => r.status === 'pending');
}

function addRegistrationRequest({ name, username, password, sector, role, skills }) {
  const uname = String(username || '').trim().toLowerCase();
  if (!uname) throw new Error('Username is required');

  // Check if username already exists in active workers or pending requests
  if (findWorkerByIdOrUsername(uname)) {
    throw new Error(`Username "${uname}" is already taken`);
  }
  if (registrationRequests.some(r => r.username.toLowerCase() === uname && r.status === 'pending')) {
    throw new Error(`A pending registration with username "${uname}" already exists`);
  }

  const reqId = `REQ-${Date.now().toString().slice(-4)}`;
  const request = {
    id: reqId,
    name: String(name || '').trim(),
    username: uname,
    password: String(password || 'password123').trim(),
    sector: sector ? String(sector).toLowerCase() : 'construction',
    role: String(role || 'Labourer').trim(),
    skills: Array.isArray(skills) ? skills : ['Safety Protocols'],
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };

  registrationRequests.unshift(request);
  persistStore();
  return request;
}

function approveRegistrationRequest(requestId) {
  const req = registrationRequests.find(r => r.id === requestId && r.status === 'pending');
  if (!req) return null;

  req.status = 'approved';
  req.approvedAt = new Date().toISOString();

  const newId = generateEmployeeId(req.sector);
  const newWorker = {
    id: newId,
    username: req.username,
    password: String(req.password || 'password123').trim(),
    name: req.name,
    role: req.role,
    sector: req.sector,
    skills: req.skills || ['Safety Protocols'],
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  workers.push(newWorker);
  persistStore();
  return newWorker;
}

function rejectRegistrationRequest(requestId, reason) {
  const req = registrationRequests.find(r => r.id === requestId && r.status === 'pending');
  if (!req) return null;
  req.status = 'rejected';
  req.rejectedReason = reason || 'Declined by Administrator';
  req.rejectedAt = new Date().toISOString();
  persistStore();
  return req;
}

// Admin directly creates employee in any sector
function adminCreateWorker({ name, username, password, sector, role, skills }) {
  if (!name || !String(name).trim()) throw new Error('Employee name is required');
  const sec = sector ? String(sector).toLowerCase() : 'construction';
  let uname = String(username || '').trim().toLowerCase();

  if (!uname) {
    uname = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90);
  }

  if (findWorkerByIdOrUsername(uname)) {
    throw new Error(`Username "${uname}" already exists. Please choose a different username.`);
  }

  const newId = generateEmployeeId(sec);
  const newWorker = {
    id: newId,
    username: uname,
    password: String(password || 'password123').trim(),
    name: String(name).trim(),
    role: role || (sec === 'hospital' ? 'Sanitation Staff' : 'Labourer'),
    sector: sec,
    skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Safety Protocols'],
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  workers.push(newWorker);

  // If there was any pending registration request with this username, mark it approved
  if (username) {
    const req = registrationRequests.find(r => r.username.toLowerCase() === username && r.status === 'pending');
    if (req) {
      req.status = 'approved';
      req.approvedAt = new Date().toISOString();
    }
  }

  persistStore();
  return newWorker;
}

// Pay records operations
function getAllPayRecords(sector) {
  let records = [...payRecords];
  if (sector) {
    const s = String(sector).trim().toLowerCase();
    records = records.filter(r => r.sector.toLowerCase() === s);
  }
  return records.sort((a, b) => {
    if (a.violation === b.violation) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return a.violation ? -1 : 1;
  });
}

function getPayRecordsByWorker(workerId) {
  if (!workerId) return [];
  const idNorm = String(workerId).trim().toUpperCase();
  return payRecords
    .filter(r => r.workerId.toUpperCase() === idNorm)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function addPayRecord({ workerId, hours, actualPay, weekDate }) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) {
    throw new Error(`Worker with ID ${workerId} not found`);
  }

  const calculation = calculateExpectedPay(hours, worker.sector);
  const violationResult = checkViolation(calculation.totalExpected, actualPay);

  const newRecord = {
    id: `PAY-${Date.now().toString().slice(-6)}`,
    workerId: worker.id,
    workerName: worker.name,
    role: worker.role,
    sector: worker.sector,
    weekDate: weekDate || new Date().toISOString().split('T')[0],
    hours: Number(hours),
    regularHours: calculation.regularHours,
    overtimeHours: calculation.overtimeHours,
    hourlyRate: calculation.hourlyRate,
    basePay: calculation.basePay,
    overtimePay: calculation.overtimePay,
    expectedPay: calculation.totalExpected,
    actualPay: Number(actualPay),
    shortfall: violationResult.shortfall,
    violation: violationResult.violation,
    status: violationResult.violation ? 'Violation' : 'Fair',
    employerNote: null,
    createdAt: new Date().toISOString()
  };

  payRecords.unshift(newRecord);
  return newRecord;
}

function respondToPayRecord(workerId, note, recordId) {
  const idNorm = String(workerId).trim().toUpperCase();
  let record = null;
  if (recordId) {
    record = payRecords.find(r => r.id === recordId && r.workerId.toUpperCase() === idNorm);
  } else {
    record = payRecords.find(r => r.workerId.toUpperCase() === idNorm && r.violation);
    if (!record) {
      record = payRecords.find(r => r.workerId.toUpperCase() === idNorm);
    }
  }

  if (!record) return null;
  record.employerNote = note;
  record.resolved = true;
  return record;
}

// Hazard operations
function getAllHazards(sector) {
  let list = [...hazards];
  if (sector) {
    const s = String(sector).trim().toLowerCase();
    list = list.filter(h => h.sector.toLowerCase() === s);
  }
  return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getHazardById(ticketId) {
  if (!ticketId) return null;
  const idNorm = String(ticketId).trim().toUpperCase();
  const indexed = hazardIdIndex.get(ticketId) || hazardIdIndex.get(idNorm);
  if (indexed) return indexed;
  return hazards.find(h => h.id && h.id.toUpperCase() === idNorm) || null;
}

function addHazard({
  sector,
  category,
  description,
  descriptionNative,
  descriptionEnglish,
  language,
  anonymous = true,
  workerName,
  workerId
}) {
  const ticketId = `HAZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const isAnon = anonymous === true || anonymous === 'true' || anonymous === 'on';

  const rawInput = descriptionNative || description || '';
  let lang = language;
  let engText = descriptionEnglish || '';
  let nativeText = descriptionNative || '';

  if (!engText || !lang || !nativeText) {
    const tr = translateHazardDescription(rawInput);
    lang = lang || tr.language;
    engText = engText || tr.english;
    nativeText = nativeText || tr.original;
  }

  const newHazard = {
    id: ticketId,
    sector: sector ? String(sector).toLowerCase() : 'construction',
    category: category || 'General',
    description: engText,
    descriptionEnglish: engText,
    descriptionNative: nativeText,
    language: lang || 'English',
    anonymous: isAnon,
    reportedBy: isAnon ? 'Anonymous' : (workerName || 'Worker'),
    workerId: isAnon ? null : (workerId || null),
    createdAt: new Date().toISOString(),
    status: 'Reported',
    notes: null
  };

  hazards.unshift(newHazard);
  return newHazard;
}

function updateHazardStatus(ticketId, status, notes) {
  const hazard = getHazardById(ticketId);
  if (!hazard) return null;

  const validStatuses = ['Reported', 'Seen', 'Fixed'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    err.status = 400;
    throw err;
  }

  hazard.status = status;
  if (notes !== undefined) {
    hazard.notes = notes;
  }
  hazard.updatedAt = new Date().toISOString();
  return hazard;
}

// Passport Verification Requests
function getPassportRequests(sector, status) {
  let list = [...passportRequests];
  if (sector) {
    const s = String(sector).trim().toLowerCase();
    list = list.filter(r => (r.sector || '').toLowerCase() === s);
  }
  if (status) {
    const st = String(status).trim().toLowerCase();
    list = list.filter(r => (r.status || '').toLowerCase() === st);
  }
  return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

function getWorkerPassportRequests(workerId) {
  if (!workerId) return [];
  const idNorm = String(workerId).trim().toUpperCase();
  return passportRequests
    .filter(r => r.workerId.toUpperCase() === idNorm)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

function addPassportRequest({ workerId, experience, notes }) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) throw new Error(`Worker ${workerId} not found`);

  if (experience !== undefined && String(experience).trim()) {
    worker.experience = String(experience).trim();
  }

  const workerPay = getPayRecordsByWorker(worker.id);
  const totalWeeks = workerPay.length;
  const violationsCount = workerPay.filter(p => p.violation).length;
  const cleanWeeksCount = totalWeeks - violationsCount;

  const reqId = `PAS-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const request = {
    id: reqId,
    workerId: worker.id,
    workerName: worker.name,
    username: worker.username,
    sector: worker.sector,
    role: worker.role,
    experience: worker.experience || '',
    skills: worker.skills || ['Safety Protocols'],
    totalWeeksWorked: totalWeeks,
    cleanWeeksCount,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    certificateId: null,
    verifiedAt: null,
    notes: notes || 'Worker requested official Skill Passport verification'
  };

  passportRequests.unshift(request);
  return request;
}

function grantPassportRequest(requestId, adminNotes) {
  const req = passportRequests.find(r => r.id === requestId);
  if (!req) return null;

  req.status = 'granted';
  req.verifiedAt = new Date().toISOString();
  req.certificateId = `VPC-2026-${req.workerId.replace('WRK-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  if (adminNotes) req.notes = adminNotes;
  return req;
}

function rejectPassportRequest(requestId, adminNotes) {
  const req = passportRequests.find(r => r.id === requestId);
  if (!req) return null;

  req.status = 'rejected';
  req.verifiedAt = new Date().toISOString();
  req.notes = adminNotes || 'Verification request rejected by administrator.';
  return req;
}

// Passport Data Aggregator
function getWorkerPassportData(workerId) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) return null;

  const workerPay = getPayRecordsByWorker(worker.id);
  const totalWeeks = workerPay.length;

  const violationsCount = workerPay.filter(p => p.violation).length;
  const cleanWeeksCount = totalWeeks - violationsCount;

  const timeline = workerPay.map(p => ({
    id: p.id,
    weekDate: p.weekDate,
    hours: p.hours,
    status: p.status,
    violation: p.violation,
    employerNote: p.employerNote || null
  }));

  const requests = getWorkerPassportRequests(worker.id);
  const grantedRequests = requests.filter(r => r.status === 'granted');
  const latestGranted = grantedRequests.length > 0 ? grantedRequests[0] : null;

  return {
    id: worker.id,
    username: worker.username,
    name: worker.name,
    role: worker.role,
    sector: worker.sector,
    experience: worker.experience || '',
    skills: worker.skills || [],
    joinedDate: worker.joinedDate,
    totalWeeksWorked: totalWeeks,
    compliance: {
      totalWeeks,
      violationsCount,
      cleanWeeksCount,
      isFullyCompliant: violationsCount === 0
    },
    verification: {
      isVerified: Boolean(latestGranted),
      certificateId: latestGranted ? latestGranted.certificateId : null,
      verifiedAt: latestGranted ? latestGranted.verifiedAt : null
    },
    requestsCount: {
      total: requests.length,
      granted: grantedRequests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    },
    history: requests,
    timeline
  };
}

module.exports = {
  resetStore,
  getAllWorkers,
  getWorkerById,
  findWorkerByIdOrUsername,
  authenticateWorker,
  updateWorkerSkills,
  updateWorkerExperience,
  getRegistrationRequests,
  addRegistrationRequest,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  adminCreateWorker,
  getAllPayRecords,
  getPayRecordsByWorker,
  addPayRecord,
  respondToPayRecord,
  getAllHazards,
  getHazardById,
  addHazard,
  updateHazardStatus,
  getPassportRequests,
  getWorkerPassportRequests,
  addPassportRequest,
  grantPassportRequest,
  rejectPassportRequest,
  getWorkerPassportData,
  resetWorkerPassword,
  syncWorker,
  persistStore,
  loadPersistedStore
};
