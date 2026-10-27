/**
 * WorkRight - Core Express Server
 * Aligned with UN SDG 8: Decent Work & Economic Growth
 * Deployed to Google Cloud Run
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { sectors, getSectorConfig } = require('./config/sectors');
const {
  getAllWorkers,
  getWorkerById,
  getWorkerPassportData
} = require('./data/seed');
const { requireAdminToken } = require('./middleware/auth');

const payRouter = require('./routes/pay');
const hazardsRouter = require('./routes/hazards');
const passportRouter = require('./routes/passport');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Token', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Translation endpoint
app.get('/api/translations/:lang', (req, res) => {
  const lang = req.params.lang || 'en';
  const filePath = path.join(__dirname, 'translations', `${lang}.json`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.sendFile(path.join(__dirname, 'translations', 'en.json'));
});

// Sector configurations endpoint
app.get('/api/sectors', (req, res) => {
  res.json(sectors);
});

// Demo workers endpoint (for worker portal login selector)
app.get('/api/demo-workers', (req, res) => {
  const list = getAllWorkers().map(w => ({
    id: w.id,
    name: w.name,
    role: w.role,
    sector: w.sector
  }));
  res.json(list);
});

// Admin workforce endpoint (Protected by X-Admin-Token)
app.get('/api/admin/workforce', requireAdminToken, (req, res) => {
  const { sector } = req.query;
  const workers = getAllWorkers(sector).map(w => {
    const passport = getWorkerPassportData(w.id);
    return {
      id: w.id,
      username: w.username || w.id.toLowerCase(),
      password: w.password || 'password123',
      name: w.name,
      role: w.role,
      sector: w.sector,
      skills: w.skills,
      totalWeeksWorked: passport ? passport.totalWeeksWorked : 0,
      joinedDate: w.joinedDate
    };
  });
  res.json(workers);
});

// Mount modular API routers
app.use('/api', authRouter);
app.use('/api/pay', payRouter);
app.use('/api/hazards', hazardsRouter);
app.use('/api/passport', passportRouter);

/**
 * Public Read-Only Passport Page: GET /passport/:workerId
 * Intentionally open without authentication.
 * Displays only: Name, Trade/Role, Sector, Verified Skills, Total Weeks Worked.
 * STRICTLY NO pay amounts, NO violation details.
 */
app.get('/passport/:workerId', (req, res) => {
  const { workerId } = req.params;
  const worker = getWorkerById(workerId);

  if (!worker) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Worker Not Found</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2>Worker Profile Not Found</h2>
        <p>No verified Skill Passport found for ID: ${workerId}</p>
        <a href="/worker/">Back to WorkRight Portal</a>
      </body>
      </html>
    `);
  }

  const passport = getWorkerPassportData(worker.id);
  const totalWeeks = passport ? passport.totalWeeksWorked : 0;
  const skillsList = worker.skills || [];

  // If API / JSON requested
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      id: worker.id,
      name: worker.name,
      role: worker.role,
      sector: worker.sector,
      skills: skillsList,
      totalWeeksWorked: totalWeeks
    });
  }

  // Render official clean, tamper-evident public HTML view
  const skillsHtml = skillsList
    .map(s => `<span class="badge-skill">✓ ${s}</span>`)
    .join(' ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skill Passport | ${worker.name} (${worker.id})</title>
  <meta name="description" content="Verified WorkRight Skill Passport for ${worker.name}">
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #475569;
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --border: #cbd5e1;
      --success: #15803d;
      --success-bg: #f0fdf4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .passport-container {
      background: var(--card-bg);
      max-width: 540px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 2px solid var(--border);
      overflow: hidden;
    }
    .header-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header-banner h1 { font-size: 22px; margin-bottom: 4px; font-weight: 700; }
    .header-banner p { font-size: 13px; opacity: 0.9; letter-spacing: 0.5px; }
    .sdg-chip {
      display: inline-block;
      margin-top: 10px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .passport-body {
      padding: 24px;
    }
    .verified-seal {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--success-bg);
      color: var(--success);
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 20px;
      border: 1px solid #bbf7d0;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .field-label {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-value {
      font-size: 16px;
      font-weight: 700;
      text-align: right;
      color: var(--text);
    }
    .skills-section {
      margin-top: 20px;
    }
    .badge-skill {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin: 4px 4px 4px 0;
    }
    .footer-actions {
      padding: 18px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }
    .btn {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-secondary {
      background: white;
      color: var(--text);
      border: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <main class="passport-container" role="main" aria-label="Public Skill Passport">
    <div class="header-banner">
      <h1>WorkRight Skill Passport</h1>
      <p>Official Verifiable Shift Worker Credential</p>
      <div class="sdg-chip">UN SDG 8 • Decent Work & Economic Growth</div>
    </div>
    
    <div class="passport-body">
      <div class="verified-seal">
        <span>🛡️</span>
        <span>Cryptographically Linked &amp; Employer Verified</span>
      </div>

      <div class="field-row">
        <span class="field-label">Worker Name</span>
        <span class="field-value">${worker.name}</span>
      </div>

      <div class="field-row">
        <span class="field-label">Employee ID</span>
        <span class="field-value">${worker.id}</span>
      </div>

      <div class="field-row">
        <span class="field-label">Trade / Role</span>
        <span class="field-value">${worker.role}</span>
      </div>

      <div class="field-row">
        <span class="field-label">Sector</span>
        <span class="field-value" style="text-transform: capitalize;">${worker.sector.charAt(0).toUpperCase() + worker.sector.slice(1)}</span>
      </div>

      <div class="field-row">
        <span class="field-label">Total Weeks Worked</span>
        <span class="field-value">${totalWeeks} Weeks</span>
      </div>

      ${worker.experience ? `
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div class="field-label" style="margin-bottom: 4px;">Verified Work Experience</div>
        <div style="font-size: 14px; color: var(--text);">${worker.experience}</div>
      </div>
      ` : ''}

      <div class="skills-section">
        <div class="field-label" style="margin-bottom: 8px;">Certified Trade Skills</div>
        <div>
          ${skillsHtml || '<span style="color: var(--text-muted)">General Trade Proficient</span>'}
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <a class="btn btn-secondary" href="/api/passport/${worker.id}/pdf" target="_blank" download>📥 Download Official PDF</a>
      <a class="btn btn-primary" href="/worker/passport.html">Open in WorkRight</a>
    </div>
  </main>
</body>
</html>`;

  return res.send(html);
});

// Root redirects or portal entry
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin fallback
app.get('/admin', (req, res) => {
  res.redirect('/admin/pay.html');
});

// Worker fallback
app.get('/worker', (req, res) => {
  res.redirect('/worker/index.html');
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WorkRight server running on port ${PORT}`);
    console.log(`Worker portal: http://localhost:${PORT}/worker/`);
    console.log(`Admin portal: http://localhost:${PORT}/admin/pay.html`);
  });
}

module.exports = app;
