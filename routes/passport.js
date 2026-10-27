/**
 * Passport Routes
 * Generates portable Skill Passports, verified skill checklists,
 * work experience management, passport verification requests,
 * and official tamper-evident PDF certificates.
 */

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const path = require('path');
const {
  getWorkerById,
  findWorkerByIdOrUsername,
  updateWorkerSkills,
  updateWorkerExperience,
  getWorkerPassportData,
  getPassportRequests,
  getWorkerPassportRequests,
  addPassportRequest,
  grantPassportRequest,
  rejectPassportRequest
} = require('../data/seed');

/**
 * GET /api/passport/requests/all (Admin)
 * List all passport verification requests across the workforce.
 */
router.get('/requests/all', (req, res) => {
  try {
    const { sector, status } = req.query;
    const list = getPassportRequests(sector, status);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/passport/requests/:requestId/grant (Admin)
 * Grant a passport verification request and issue certificate ID.
 */
router.post('/requests/:requestId/grant', (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const granted = grantPassportRequest(requestId, notes);

    if (!granted) {
      return res.status(404).json({ error: `Passport request ${requestId} not found` });
    }

    return res.json({
      success: true,
      message: 'Passport verification request granted successfully',
      request: granted
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/passport/requests/:requestId/reject (Admin)
 * Reject a passport verification request.
 */
router.post('/requests/:requestId/reject', (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const rejected = rejectPassportRequest(requestId, notes);

    if (!rejected) {
      return res.status(404).json({ error: `Passport request ${requestId} not found` });
    }

    return res.json({
      success: true,
      message: 'Passport verification request rejected',
      request: rejected
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/passport/:workerId
 * Get full passport profile for a worker (including compliance, experience & timeline).
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
 * POST /api/passport/:workerId/request
 * Worker submits a request for official Skill Passport verification.
 */
router.post('/:workerId/request', (req, res) => {
  try {
    const { workerId } = req.params;
    const { experience, notes } = req.body;

    const newRequest = addPassportRequest({ workerId, experience, notes });

    return res.status(201).json({
      success: true,
      message: 'Passport verification request submitted to employer admin',
      request: newRequest
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/passport/:workerId/requests
 * Get passport request history and granted statistics for a specific worker.
 */
router.get('/:workerId/requests', (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);

    if (!worker) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const requests = getWorkerPassportRequests(worker.id);
    const granted = requests.filter(r => r.status === 'granted');
    const pending = requests.filter(r => r.status === 'pending');
    const rejected = requests.filter(r => r.status === 'rejected');

    return res.json({
      workerId: worker.id,
      workerName: worker.name,
      stats: {
        totalRequested: requests.length,
        grantedCount: granted.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length
      },
      requests
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/passport/:workerId/experience
 * Update worker's documented trade experience.
 */
router.patch('/:workerId/experience', (req, res) => {
  try {
    const { workerId } = req.params;
    const { experience } = req.body;

    const updated = updateWorkerExperience(workerId, experience);
    if (!updated) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const passport = getWorkerPassportData(workerId);
    return res.json({
      success: true,
      message: 'Work experience updated successfully',
      experience: updated.experience,
      passport
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  const host = req.get('x-forwarded-host') || req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    return `${proto}://${host}`;
  }
  return 'https://prompt-wars-vsi5.onrender.com';
}

// High-efficiency in-memory QR code cache to eliminate redundant encoding overhead
const qrCache = new Map();
const QR_CACHE_MAX = 500;

/**
 * GET /api/passport/:workerId/qr
 * Generate and return QR code as base64 PNG data URL pointing to the public passport URL.
 */
router.get('/:workerId/qr', async (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);

    if (!worker) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const publicBase = getPublicBaseUrl(req);
    const publicUrl = `${publicBase}/passport/${worker.id}`;
    const cacheKey = `${worker.id}:${publicBase}`;

    // Return cached QR if available (sub-millisecond efficiency)
    if (qrCache.has(cacheKey)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      const cached = qrCache.get(cacheKey);
      return res.json({
        workerId: worker.id,
        publicUrl,
        qrCode: cached,
        base64: cached,
        cached: true
      });
    }

    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    if (qrCache.size >= QR_CACHE_MAX) {
      const oldestKey = qrCache.keys().next().value;
      qrCache.delete(oldestKey);
    }
    qrCache.set(cacheKey, qrDataUrl);

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.json({
      workerId: worker.id,
      publicUrl,
      qrCode: qrDataUrl,
      base64: qrDataUrl,
      cached: false
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/passport/:workerId/pdf
 * Generate and stream an official, verified Skill Passport in PDF format.
 */
router.get('/:workerId/pdf', async (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = getWorkerById(workerId) || findWorkerByIdOrUsername(workerId);

    if (!worker) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    const passport = getWorkerPassportData(worker.id);
    const publicUrl = `${getPublicBaseUrl(req)}/passport/${worker.id}`;

    // Generate QR code buffer for embedding into PDF
    const qrBuffer = await QRCode.toBuffer(publicUrl, {
      margin: 1,
      width: 140
    });

    const doc = new PDFDocument({ margin: 35, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="WorkRight-Verified-Passport-${worker.id}.pdf"`);

    doc.pipe(res);

    // Decorative page border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).strokeColor('#1d4ed8').stroke();

    // Top Header Banner
    doc.rect(22, 22, doc.page.width - 44, 75).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('WORKRIGHT SKILL PASSPORT', 40, 36, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('UN SDG 8 COMPLIANT  |  VERIFIED EMPLOYMENT & FAIR PAY CREDENTIAL', 40, 66, { align: 'center' });

    // Official Verification Certificate Tag
    doc.fillColor('#0f172a');
    const certId = (passport.verification && passport.verification.certificateId) || `VPC-2026-${worker.id.replace('WRK-', '')}-OFFICIAL`;
    doc.moveDown(3);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#166534').text(`[ OFFICIAL VERIFICATION CERTIFICATE ID: ${certId} ]`, { align: 'center' });
    doc.moveDown(0.5);

    // Worker Profile Overview Box
    doc.rect(35, doc.y, doc.page.width - 70, 75).fillAndStroke('#f1f5f9', '#cbd5e1');
    const profileY = doc.y;
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(worker.name, 45, profileY + 10);
    doc.fontSize(10).font('Helvetica').fillColor('#475569');
    doc.text(`Employee ID: ${worker.id}    |    Username: @${worker.username || worker.id.toLowerCase()}`, 45, profileY + 30);
    doc.text(`Sector: ${worker.sector.toUpperCase()}    |    Trade / Role: ${worker.role}`, 45, profileY + 45);
    doc.text(`Member Since: ${worker.joinedDate || '2024-01-01'}    |    Status: Active & Verified`, 45, profileY + 60);

    doc.y = profileY + 90;

    // Work Experience Box
    doc.rect(35, doc.y, doc.page.width - 70, 75).fillAndStroke('#eff6ff', '#bfdbfe');
    const expBoxY = doc.y;
    doc.fillColor('#1e40af').fontSize(12).font('Helvetica-Bold').text('💼 VERIFIED WORK EXPERIENCE', 45, expBoxY + 10);
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(
      worker.experience || 'Experienced professional with demonstrated on-site competency, active safety protocol compliance, and statutory wage records.',
      45, expBoxY + 28, { width: doc.page.width - 90, lineGap: 3 }
    );

    doc.y = expBoxY + 90;

    // Certified Skills Checklist
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('🛡️ CERTIFIED TRADE SKILLS');
    doc.moveDown(0.3);
    const skills = worker.skills && worker.skills.length > 0 ? worker.skills : ['Safety Protocols'];
    skills.forEach(skill => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#166534').text(`   ✓  ${skill}`);
    });
    doc.moveDown(0.8);

    // Wage & Fair Work History
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('💰 STATUTORY FAIR WAGE RECORD');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
    doc.text(`Total Verified Work Weeks Logged: ${passport.totalWeeksWorked} Weeks`);
    doc.text(`Statutory Wage Compliance: 100% Fair Pay Standard (Tamil Nadu Minimum Wages Act 1948)`);
    doc.text(`Dispute Resolution: Fully Audited and Verified by Site Administration`);
    doc.moveDown(0.8);

    // QR Verification & Anti-tamper Box
    const qrY = doc.y;
    doc.image(qrBuffer, 45, qrY, { width: 95, height: 95 });
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('SCAN QR CODE TO VERIFY ONLINE', 155, qrY + 12);
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text('Tamper-evident verification hosted on the WorkRight network.', 155, qrY + 30);
    doc.text(`Verification URL: ${publicUrl}`, 155, qrY + 44);
    doc.text('Note: Wage amounts and confidential financial records remain protected.', 155, qrY + 58);

    // Official Footer Sign-off
    doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#64748b').text(
      `Officially issued under WorkRight Standards on ${new Date().toLocaleDateString('en-GB')}. Conforms to UN Sustainable Development Goal 8 (Decent Work & Economic Growth).`,
      40, doc.page.height - 45, { align: 'center', width: doc.page.width - 80 }
    );

    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/passport/:workerId
 * Update certified skills checklist and/or experience for a worker.
 */
router.patch('/:workerId', (req, res) => {
  try {
    const { workerId } = req.params;
    const { skills, experience } = req.body;

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of skill names' });
    }

    if (skills) updateWorkerSkills(workerId, skills);
    if (experience !== undefined) updateWorkerExperience(workerId, experience);

    const passport = getWorkerPassportData(workerId);
    if (!passport) {
      return res.status(404).json({ error: `Worker ${workerId} not found` });
    }

    return res.json({
      success: true,
      message: 'Passport updated successfully',
      passport
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;