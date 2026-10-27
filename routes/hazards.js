/**
 * Hazards Routes
 * Handles hazard report submission, status queries, and employer resolution.
 */

const express = require('express');
const router = express.Router();
const {
  getAllHazards,
  getHazardById,
  addHazard,
  updateHazardStatus
} = require('../data/seed');
const { requireAdminToken } = require('../middleware/auth');
const { translateHazardDescription } = require('../logic/translator');
const { validateHazardDescription, normalizeSector } = require('../logic/validator');
const { sanitizeString } = require('../middleware/security');

/**
 * POST /api/hazards
 * Report a new workplace hazard (Supports Tamil, Hindi, English bilingual reports).
 */
router.post('/', (req, res) => {
  try {
    const {
      sector,
      category,
      description,
      descriptionNative,
      descriptionEnglish,
      language,
      anonymous,
      workerName,
      workerId
    } = req.body;

    const rawInput = descriptionNative || description;
    const descValidation = validateHazardDescription(rawInput);
    if (!descValidation.valid) {
      return res.status(400).json({ error: descValidation.error });
    }

    const isAnonymous = anonymous === true || anonymous === 'true' || anonymous === 'on' || anonymous === undefined;

    // Multilingual translation to English and language detection
    const translation = translateHazardDescription(descValidation.sanitized);
    const resolvedLanguage = language || translation.language;
    const resolvedNative = descriptionNative || translation.original;
    const resolvedEnglish = descriptionEnglish || translation.english;

    const newHazard = addHazard({
      sector: normalizeSector(sector),
      category: category ? sanitizeString(category) : 'General',
      description: resolvedEnglish,
      descriptionNative: resolvedNative,
      descriptionEnglish: resolvedEnglish,
      language: resolvedLanguage,
      anonymous: isAnonymous,
      workerName: isAnonymous ? undefined : (workerName ? sanitizeString(workerName) : undefined),
      workerId: isAnonymous ? undefined : workerId
    });

    return res.status(201).json({
      success: true,
      ticketId: newHazard.id,
      status: newHazard.status,
      hazard: newHazard
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/hazards (Admin only)
 * Get all hazard reports, optionally filtered by sector.
 * Protected by X-Admin-Token.
 */
router.get('/', requireAdminToken, (req, res) => {
  try {
    const { sector } = req.query;
    const list = getAllHazards(sector);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/hazards/:id
 * Check hazard status by ticket ID (Worker / Public lookup).
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const hazard = getHazardById(id);

    if (!hazard) {
      return res.status(404).json({ error: `Hazard ticket ${id} not found` });
    }

    return res.json(hazard);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/hazards/:id (Admin only)
 * Update status of a hazard report (Reported -> Seen -> Fixed).
 * Protected by X-Admin-Token.
 */
router.patch('/:id', requireAdminToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Reported', 'Seen', 'Fixed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = updateHazardStatus(id, status, notes);
    if (!updated) {
      return res.status(404).json({ error: `Hazard ticket ${id} not found` });
    }

    return res.json({
      success: true,
      message: `Hazard status updated to ${status}`,
      hazard: updated
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
