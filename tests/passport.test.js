/**
 * Unit & Integration Tests for Skill Passport, QR Code Generation, and Privacy
 */

const request = require('supertest');
const app = require('../server');
const { resetStore } = require('../data/seed');

beforeEach(() => {
  resetStore();
});

describe('Skill Passport & Public Credential Verification (routes/passport.js & server.js)', () => {
  test('Passport returns correct total weeks from pay log count', async () => {
    const workerId = 'WRK-C101';

    // Initial state: WRK-C101 has 1 pay record in seed data
    const initialRes = await request(app).get(`/api/passport/${workerId}`);
    expect(initialRes.status).toBe(200);
    expect(initialRes.body.totalWeeksWorked).toBe(1);

    // Worker logs an additional week
    const logRes = await request(app)
      .post('/api/pay/log')
      .send({
        workerId: workerId,
        hours: 40,
        actualPay: 3941,
        weekDate: '2026-10-25'
      });
    expect(logRes.status).toBe(201);

    // Passport total weeks worked must auto-increment to 2
    const updatedRes = await request(app).get(`/api/passport/${workerId}`);
    expect(updatedRes.status).toBe(200);
    expect(updatedRes.body.totalWeeksWorked).toBe(2);
  });

  test('Skills update saves checked skills correctly', async () => {
    const workerId = 'WRK-C102';
    const newSkills = ['Plumbing', 'Welding', 'Scaffolding', 'Safety Protocols'];

    const patchRes = await request(app)
      .patch(`/api/passport/${workerId}`)
      .send({ skills: newSkills });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.passport.skills).toEqual(expect.arrayContaining(newSkills));

    // Verify persistence via GET
    const getRes = await request(app).get(`/api/passport/${workerId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.skills).toEqual(expect.arrayContaining(newSkills));
  });

  test('Public passport page returns no pay amounts or violation details', async () => {
    const workerId = 'WRK-C101'; // Worker WRK-C101 has a pay violation of ₹1196.63 in seed data

    // 1. Check HTML version of public passport
    const htmlRes = await request(app)
      .get(`/passport/${workerId}`)
      .set('Accept', 'text/html');

    expect(htmlRes.status).toBe(200);
    const bodyText = htmlRes.text;

    // Must show public credentials
    expect(bodyText).toContain('Ramu Selvam');
    expect(bodyText).toContain('WRK-C101');
    expect(bodyText).toContain('Mason');
    expect(bodyText).toContain('Construction');
    expect(bodyText).toContain('Bricklaying');

    // Must NOT contain sensitive pay amounts, violations, or shortfalls
    expect(bodyText).not.toContain('4996');
    expect(bodyText).not.toContain('3800');
    expect(bodyText).not.toContain('1196');
    expect(bodyText).not.toContain('expectedPay');
    expect(bodyText).not.toContain('actualPay');
    expect(bodyText).not.toContain('shortfall');
    expect(bodyText).not.toContain('underpaid');
    expect(bodyText).not.toContain('Violation');

    // 2. Check JSON version of public passport endpoint
    const jsonRes = await request(app)
      .get(`/passport/${workerId}`)
      .set('Accept', 'application/json');

    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.name).toBe('Ramu Selvam');
    expect(jsonRes.body.role).toBe('Mason');
    expect(jsonRes.body.totalWeeksWorked).toBe(1);

    // Ensure pay amounts and violations are undefined in public payload
    expect(jsonRes.body.expectedPay).toBeUndefined();
    expect(jsonRes.body.actualPay).toBeUndefined();
    expect(jsonRes.body.violation).toBeUndefined();
    expect(jsonRes.body.shortfall).toBeUndefined();
    expect(jsonRes.body.timeline).toBeUndefined();
  });

  test('QR code endpoint returns a base64 string', async () => {
    const workerId = 'WRK-C101';

    const res = await request(app).get(`/api/passport/${workerId}/qr`);

    expect(res.status).toBe(200);
    expect(res.body.qrCode).toBeDefined();
    expect(typeof res.body.qrCode).toBe('string');
    // Verify it is a valid base64 image data URL
    expect(res.body.qrCode).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    expect(res.body.base64).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });
});
