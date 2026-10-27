/**
 * Passport Routes
 * Generates portable Skill Passports, verified skill checklists, and QR codes.
 */

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const path = require('path');
const {
  getWorkerById,
  updateWorkerSkills,
  getWorkerPassportData
} = require('../data/seed');

/**
 * GET /api/passport/:workerId
 * Get full passport profile for a worker (including compliance & timeline).
 */
router.get('/:workerId', (req, res) => {
  try {
    const { workerId } = req.params;
    const passport = getWorkerPassportData(workerId);

    if (!passport) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    return res.json(passport);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/passport/:workerId/qr
 * Generate and return QR code as base64 PNG data URL pointing to the public passport URL.
 */
router.get('/:workerId/qr', async (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = getWorkerById(workerId);

    if (!worker) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const host = req.get('host') || 'localhost:8080';
    const protocol = req.protocol || 'http';
    const publicUrl = `${protocol}://${host}/passport/${worker.id}`;

    // Generate high quality QR code data URL (base64 image/png)
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return res.json({
      workerId: worker.id,
      publicUrl,
      qrCode: qrDataUrl,
      base64: qrDataUrl
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/passport/:workerId
 * Update certified skills checklist for a worker.
 */
router.patch('/:workerId', (req, res) => {
  try {
    const { workerId } = req.params;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of skill names' });
    }

    const updated = updateWorkerSkills(workerId, skills);
    if (!updated) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const passport = getWorkerPassportData(workerId);
    return res.json({
      success: true,
      message: 'Skills updated successfully',
      passport
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
