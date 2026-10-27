/**
 * In-Memory Seed Data and Store for WorkRight
 * Connects Workers, Pay Records, Hazards, and Skill Passports.
 * Includes Employee ID generation, Worker Registration approval queue,
 * and Username/Password authentication.
 */

const { calculateExpectedPay, checkViolation } = require('../logic/payCalculator');

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
    description: 'Chemical spill near 2nd floor ICU corridor, pungent odor and slippery surface',
    anonymous: true,
    reportedBy: 'Anonymous',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: 'Reported',
    notes: 'Report received via voice input.'
  },
  {
    id: 'HAZ-2026-002',
    sector: 'construction',
    category: 'Fall',
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
    description: 'Blocked drainage in ground floor emergency washrooms causing backflow',
    anonymous: true,
    reportedBy: 'Anonymous',
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    status: 'Fixed',
    notes: 'Plumbing contractor cleared blockage and sanitized area.'
  }
];

// Active in-memory state
let workers = JSON.parse(JSON.stringify(initialWorkers));
let registrationRequests = JSON.parse(JSON.stringify(initialRegistrationRequests));
let payRecords = JSON.parse(JSON.stringify(initialPayRecords));
let hazards = JSON.parse(JSON.stringify(initialHazards));

function resetStore() {
  workers = JSON.parse(JSON.stringify(initialWorkers));
  registrationRequests = JSON.parse(JSON.stringify(initialRegistrationRequests));
  payRecords = JSON.parse(JSON.stringify(initialPayRecords));
  hazards = JSON.parse(JSON.stringify(initialHazards));
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
  return workers.find(w => w.id.toUpperCase() === idNorm) || null;
}

function findWorkerByIdOrUsername(identifier) {
  if (!identifier) return null;
  const norm = String(identifier).trim().toLowerCase();
  return workers.find(w =>
    (w.id && w.id.toLowerCase() === norm) ||
    (w.username && w.username.toLowerCase() === norm)
  ) || null;
}

function updateWorkerSkills(workerId, skills) {
  const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);
  if (!worker) return null;
  if (Array.isArray(skills)) {
    worker.skills = [...new Set(skills)];
  }
  return worker;
}

// Worker Authentication (Username or Employee ID + Password)
function authenticateWorker(identifier, password) {
  if (!identifier || !password) return null;
  const worker = findWorkerByIdOrUsername(identifier);
  if (!worker) return null;

  // Validate password
  if (worker.password && worker.password !== password) {
    return null;
  }
  return worker;
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
    password: String(password || 'password123'),
    sector: sector ? String(sector).toLowerCase() : 'construction',
    role: String(role || 'Labourer').trim(),
    skills: Array.isArray(skills) ? skills : ['Safety Protocols'],
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };

  registrationRequests.unshift(request);
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
    password: req.password,
    name: req.name,
    role: req.role,
    sector: req.sector,
    skills: req.skills || ['Safety Protocols'],
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  workers.push(newWorker);
  return newWorker;
}

function rejectRegistrationRequest(requestId, reason) {
  const req = registrationRequests.find(r => r.id === requestId && r.status === 'pending');
  if (!req) return null;
  req.status = 'rejected';
  req.rejectedReason = reason || 'Declined by Administrator';
  req.rejectedAt = new Date().toISOString();
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
    password: password || 'password123',
    name: String(name).trim(),
    role: role || (sec === 'hospital' ? 'Sanitation Staff' : 'Labourer'),
    sector: sec,
    skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Safety Protocols'],
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  };

  workers.push(newWorker);
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
  return hazards.find(h => h.id.toUpperCase() === idNorm) || null;
}

function addHazard({ sector, category, description, anonymous = true, workerName, workerId }) {
  const ticketId = `HAZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const isAnon = anonymous === true || anonymous === 'true' || anonymous === 'on';

  const newHazard = {
    id: ticketId,
    sector: sector ? String(sector).toLowerCase() : 'construction',
    category: category || 'General',
    description: String(description || '').trim(),
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

  return {
    id: worker.id,
    username: worker.username,
    name: worker.name,
    role: worker.role,
    sector: worker.sector,
    skills: worker.skills || [],
    joinedDate: worker.joinedDate,
    totalWeeksWorked: totalWeeks,
    compliance: {
      totalWeeks,
      violationsCount,
      cleanWeeksCount,
      isFullyCompliant: violationsCount === 0
    },
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
  getWorkerPassportData
};
