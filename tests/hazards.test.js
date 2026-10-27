/**
 * Unit & Integration Tests for Hazard Reporting and Lifecycle Management
 */

const request = require('supertest');
const app = require('../server');
const { resetStore } = require('../data/seed');

beforeEach(() => {
  resetStore();
});

describe('Hazard Management & Reporting (routes/hazards.js & data/seed.js)', () => {
  test('Hazard created with status Reported by default', async () => {
    const res = await request(app)
      .post('/api/hazards')
      .send({
        sector: 'construction',
        category: 'Fall',
        description: 'Loose safety scaffolding board on 3rd floor',
        anonymous: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('Reported');
    expect(res.body.hazard.status).toBe('Reported');
  });

  test('Hazard created with a unique ticket ID', async () => {
    const res1 = await request(app)
      .post('/api/hazards')
      .send({
        sector: 'construction',
        category: 'Electrical',
        description: 'Exposed wire in section A'
      });

    const res2 = await request(app)
      .post('/api/hazards')
      .send({
        sector: 'hospital',
        category: 'Chemical',
        description: 'Minor cleaner leak in basement'
      });

    expect(res1.body.ticketId).toBeDefined();
    expect(res2.body.ticketId).toBeDefined();
    expect(res1.body.ticketId).toMatch(/^HAZ-2026-\d+$/);
    expect(res2.body.ticketId).toMatch(/^HAZ-2026-\d+$/);
    expect(res1.body.ticketId).not.toBe(res2.body.ticketId);
  });

  test('Status update from Reported to Seen works correctly', async () => {
    // Create a new report
    const createRes = await request(app)
      .post('/api/hazards')
      .send({
        sector: 'construction',
        category: 'Machinery',
        description: 'Drill vibrating abnormally'
      });

    const ticketId = createRes.body.ticketId;
    expect(createRes.body.status).toBe('Reported');

    // Admin updates status to Seen
    const updateRes = await request(app)
      .patch(`/api/hazards/${ticketId}`)
      .set('X-Admin-Token', 'admin123')
      .send({
        status: 'Seen',
        notes: 'Technician dispatched to inspect drill'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.hazard.status).toBe('Seen');

    // Verify via GET
    const getRes = await request(app).get(`/api/hazards/${ticketId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('Seen');
  });

  test('Status update from Seen to Fixed works correctly', async () => {
    // Ticket HAZ-2026-003 is seeded in 'Seen' state
    const ticketId = 'HAZ-2026-003';

    const updateRes = await request(app)
      .patch(`/api/hazards/${ticketId}`)
      .set('X-Admin-Token', 'admin123')
      .send({
        status: 'Fixed',
        notes: 'Sharps container replaced with lockable unit'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.hazard.status).toBe('Fixed');

    // Verify via public GET lookup
    const getRes = await request(app).get(`/api/hazards/${ticketId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('Fixed');
  });

  test('Invalid status string is rejected with 400 error', async () => {
    const ticketId = 'HAZ-2026-001';

    const res = await request(app)
      .patch(`/api/hazards/${ticketId}`)
      .set('X-Admin-Token', 'admin123')
      .send({
        status: 'CompletelyIgnored'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/i);
  });

  test('Anonymous report does not store worker name', async () => {
    const res = await request(app)
      .post('/api/hazards')
      .send({
        sector: 'hospital',
        category: 'Biological',
        description: 'Spill near patient room 204',
        anonymous: true,
        workerName: 'Priya Manoharan',
        workerId: 'WRK-H201'
      });

    expect(res.status).toBe(201);
    expect(res.body.hazard.anonymous).toBe(true);
    expect(res.body.hazard.reportedBy).toBe('Anonymous');
    expect(res.body.hazard.workerName).toBeUndefined();
    expect(res.body.hazard.workerId).toBeNull();

    // Verify when fetched again
    const ticketId = res.body.ticketId;
    const fetchRes = await request(app).get(`/api/hazards/${ticketId}`);
    expect(fetchRes.body.reportedBy).toBe('Anonymous');
    expect(fetchRes.body.workerName).toBeUndefined();
  });
});
