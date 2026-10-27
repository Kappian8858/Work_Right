/**
 * Pay Routes
 * Handles wage calculation, violation checks, record logging, and employer responses.
 */

const express = require('express');
const router = express.Router();
const { calculateExpectedPay, checkViolation } = require('../logic/payCalculator');
const {
  getWorkerById,
  getAllPayRecords,
  getPayRecordsByWorker,
  addPayRecord,
  respondToPayRecord
} = require('../data/seed');
const { requireAdminToken } = require('../middleware/auth');

/**
 * POST /api/pay/check
 * Calculate pay breakdown and check for minimum wage violation.
 */
router.post('/check', (req, res) => {
  try {
    const { workerId, hours, actualPay, sector } = req.body;

    if (hours === undefined || hours === null || isNaN(Number(hours))) {
      return res.status(400).json({ error: 'Hours worked must be a valid number' });
    }

    if (actualPay === undefined || actualPay === null || isNaN(Number(actualPay))) {
      return res.status(400).json({ error: 'Actual pay received must be a valid number' });
    }

    // Determine sector: from request body, or from worker profile, or default
    let resolvedSector = sector;
    let worker = null;

    if (workerId) {
      worker = getWorkerById(workerId);
      if (worker && !resolvedSector) {
        resolvedSector = worker.sector;
      }
    }

    if (!resolvedSector) {
      resolvedSector = 'construction';
    }

    const calculation = calculateExpectedPay(hours, resolvedSector);
    const violation = checkViolation(calculation.totalExpected, actualPay);

    const difference = Math.round(Math.abs(calculation.totalExpected - Number(actualPay)) * 100) / 100;

    return res.json({
      workerId: worker ? worker.id : (workerId || null),
      workerName: worker ? worker.name : null,
      sector: resolvedSector,
      hoursWorked: Number(hours),
      regularHours: calculation.regularHours,
      overtimeHours: calculation.overtimeHours,
      hourlyRate: calculation.hourlyRate,
      basePay: calculation.basePay,
      overtimePay: calculation.overtimePay,
      totalExpected: calculation.totalExpected,
      actualPay: Number(actualPay),
      difference: calculation.totalExpected - Number(actualPay),
      shortfall: violation.shortfall,
      violation: violation.violation,
      message: violation.violation
        ? `⚠️ You may have been underpaid by ₹${violation.shortfall} this week.`
        : '✅ Your pay looks fair this week.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/pay/log
 * Save weekly pay record to worker's history & Skill Passport.
 */
router.post('/log', (req, res) => {
  try {
    const { workerId, hours, actualPay, weekDate } = req.body;

    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    if (hours === undefined || isNaN(Number(hours))) {
      return res.status(400).json({ error: 'Hours worked is required and must be numeric' });
    }

    if (actualPay === undefined || isNaN(Number(actualPay))) {
      return res.status(400).json({ error: 'Actual pay is required and must be numeric' });
    }

    const worker = getWorkerById(workerId);
    if (!worker) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const record = addPayRecord({
      workerId: worker.id,
      hours,
      actualPay,
      weekDate
    });

    return res.status(201).json({
      success: true,
      message: 'Pay record successfully saved',
      record
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/pay (Admin only)
 * Get all pay records, optionally filtered by sector.
 * Protected by X-Admin-Token.
 */
router.get('/', requireAdminToken, (req, res) => {
  try {
    const { sector } = req.query;
    const records = getAllPayRecords(sector);
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pay/:workerId
 * Get pay history for a specific worker.
 */
router.get('/:workerId', (req, res) => {
  try {
    const { workerId } = req.params;
    const records = getPayRecordsByWorker(workerId);
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/pay/respond/:workerId (Admin only)
 * Employer adds a correction note to a violation record.
 * Protected by X-Admin-Token.
 */
router.patch('/respond/:workerId', requireAdminToken, (req, res) => {
  try {
    const { workerId } = req.params;
    const { note, recordId } = req.body;

    if (!note || !String(note).trim()) {
      return res.status(400).json({ error: 'Correction note cannot be empty' });
    }

    const updated = respondToPayRecord(workerId, String(note).trim(), recordId);
    if (!updated) {
      return res.status(404).json({ error: `No pay record found for worker ${workerId}` });
    }

    return res.json({
      success: true,
      message: 'Response note attached to pay record',
      record: updated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
