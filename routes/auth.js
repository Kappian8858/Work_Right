/**
 * Authentication and Employee Lifecycle Router
 * Handles Admin login, Worker login (ID or username), Worker registration requests,
 * and Admin verification & onboarding.
 */

const express = require('express');
const router = express.Router();
const {
  authenticateWorker,
  findWorkerByIdOrUsername,
  getRegistrationRequests,
  addRegistrationRequest,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  adminCreateWorker,
  resetWorkerPassword
} = require('../data/seed');
const { requireAdminToken } = require('../middleware/auth');

function handleAdminLogin(req, res) {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    const adminToken = process.env.ADMIN_TOKEN || 'admin123';
    return res.json({
      success: true,
      message: 'Admin authenticated successfully',
      token: adminToken,
      admin: {
        username: 'admin',
        role: 'Administrator'
      }
    });
  }

  return res.status(401).json({
    error: 'Invalid credentials. Username: admin, Password: admin'
  });
}

// Support both /api/auth/admin/login and /api/admin/login
router.post('/auth/admin/login', handleAdminLogin);
router.post('/admin/login', handleAdminLogin);

function handleWorkerLogin(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ error: 'Username or Employee ID is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const normId = String(identifier).trim().toLowerCase();

    // Check if user is in pending registrations
    const pendingList = getRegistrationRequests();
    const isPending = pendingList.some(r => r.username.toLowerCase() === normId);
    if (isPending) {
      return res.status(403).json({
        error: 'Your registration request is pending admin approval. You can log in once the admin verifies and accepts your account.'
      });
    }

    const worker = authenticateWorker(identifier, password);
    if (!worker) {
      const exists = findWorkerByIdOrUsername(identifier);
      if (exists) {
        return res.status(401).json({ error: 'Incorrect password for this account' });
      }
      return res.status(404).json({ error: 'Account not found. Please check your username/ID or create an account.' });
    }

    return res.json({
      success: true,
      message: `Welcome back, ${worker.name}`,
      worker: {
        id: worker.id,
        username: worker.username,
        name: worker.name,
        role: worker.role,
        sector: worker.sector,
        skills: worker.skills || []
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Support both /api/auth/worker/login and /api/worker/login
router.post('/auth/worker/login', handleWorkerLogin);
router.post('/worker/login', handleWorkerLogin);

function handleWorkerRegister(req, res) {
  try {
    const { name, username, password, sector, role, skills } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: 'Desired username is required' });
    }

    if (!password || String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const request = addRegistrationRequest({
      name,
      username,
      password,
      sector,
      role,
      skills
    });

    return res.status(201).json({
      success: true,
      message: 'Registration request submitted to administrator for verification. Your Employee ID will be generated upon approval.',
      request: {
        id: request.id,
        name: request.name,
        username: request.username,
        sector: request.sector,
        role: request.role,
        requestedAt: request.requestedAt,
        status: request.status
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Support both /api/auth/worker/register and /api/worker/register
router.post('/auth/worker/register', handleWorkerRegister);
router.post('/worker/register', handleWorkerRegister);

/**
 * GET /api/admin/registration-requests
 * Get all pending worker registration requests (Admin only).
 */
router.get('/admin/registration-requests', requireAdminToken, (req, res) => {
  try {
    const requests = getRegistrationRequests();
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/registration-requests/:id/approve
 * Admin verifies and accepts worker account. Generates Employee ID.
 */
router.post('/admin/registration-requests/:id/approve', requireAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const newWorker = approveRegistrationRequest(id);

    if (!newWorker) {
      return res.status(404).json({ error: `Registration request ${id} not found or already processed` });
    }

    return res.json({
      success: true,
      message: `Worker account accepted. Generated Employee ID: ${newWorker.id}`,
      worker: newWorker
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/registration-requests/:id/reject
 * Admin rejects registration request.
 */
router.post('/admin/registration-requests/:id/reject', requireAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejected = rejectRegistrationRequest(id, reason);

    if (!rejected) {
      return res.status(404).json({ error: `Registration request ${id} not found` });
    }

    return res.json({
      success: true,
      message: 'Registration request declined',
      request: rejected
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/workers
 * Admin directly creates a new employee in any sector with an Employee ID and password.
 */
router.post('/admin/workers', requireAdminToken, (req, res) => {
  try {
    const { name, username, password, sector, role, skills } = req.body;

    const worker = adminCreateWorker({
      name,
      username,
      password,
      sector,
      role,
      skills
    });

    return res.status(201).json({
      success: true,
      message: `Employee created successfully with ID ${worker.id}`,
      worker
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/workers/:identifier/reset-password
 * Reset worker password to specified value (or defaults to 'password123')
 */
router.post('/admin/workers/:identifier/reset-password', requireAdminToken, (req, res) => {
  try {
    const { identifier } = req.params;
    const { password = 'password123' } = req.body;
    const worker = resetWorkerPassword(identifier, password);

    if (!worker) {
      return res.status(404).json({ error: `Worker ${identifier} not found` });
    }

    return res.json({
      success: true,
      message: `Password for worker ${worker.name} (${worker.id}) reset to: ${password}`,
      worker: {
        id: worker.id,
        username: worker.username,
        name: worker.name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
