/**
 * Unit & Integration Tests for Admin & Worker Authentication,
 * Self-Registration Requests, and Admin Verification & Onboarding.
 */

const request = require('supertest');
const app = require('../server');
const { resetStore } = require('../data/seed');

beforeEach(() => {
  resetStore();
});

describe('Authentication & Employee Onboarding Flow (routes/auth.js & data/seed.js)', () => {
  test('Admin login succeeds with username admin and password admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('admin123');
    expect(res.body.admin.username).toBe('admin');
  });

  test('Admin login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('Admin can directly create a new employee in any sector', async () => {
    const res = await request(app)
      .post('/api/admin/workers')
      .set('X-Admin-Token', 'admin123')
      .send({
        name: 'Ganesh Pandian',
        username: 'ganeshp',
        password: 'password123',
        sector: 'construction',
        role: 'Mason',
        skills: ['Bricklaying', 'Scaffolding', 'Safety Protocols']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.worker.id).toBe('WRK-C106');
    expect(res.body.worker.username).toBe('ganeshp');
    expect(res.body.worker.name).toBe('Ganesh Pandian');

    // Worker can immediately log in with generated ID
    const loginRes = await request(app)
      .post('/api/auth/worker/login')
      .send({
        identifier: 'WRK-C106',
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.worker.name).toBe('Ganesh Pandian');
  });

  test('Worker self-registration creates pending request and blocks login until approved', async () => {
    // 1. Worker submits self-registration
    const regRes = await request(app)
      .post('/api/auth/worker/register')
      .send({
        name: 'Murugan Karuppan',
        username: 'murugank',
        password: 'mypassword',
        sector: 'hospital',
        role: 'Sanitation Staff',
        skills: ['Waste Disposal', 'Sanitation Protocols']
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.request.status).toBe('pending');
    const reqId = regRes.body.request.id;

    // 2. Worker attempts to log in before admin approval -> blocked with 403
    const earlyLoginRes = await request(app)
      .post('/api/auth/worker/login')
      .send({
        identifier: 'murugank',
        password: 'mypassword'
      });
    expect(earlyLoginRes.status).toBe(403);
    expect(earlyLoginRes.body.error).toMatch(/pending admin approval/i);

    // 3. Admin views pending requests
    const listRes = await request(app)
      .get('/api/admin/registration-requests')
      .set('X-Admin-Token', 'admin123');
    expect(listRes.status).toBe(200);
    expect(listRes.body.some(r => r.id === reqId)).toBe(true);

    // 4. Admin approves the registration
    const approveRes = await request(app)
      .post(`/api/admin/registration-requests/${reqId}/approve`)
      .set('X-Admin-Token', 'admin123');

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    const assignedId = approveRes.body.worker.id;
    expect(assignedId).toMatch(/^WRK-H\d+$/);

    // 5. Worker can now log in for the first time using USERNAME
    const loginWithUsername = await request(app)
      .post('/api/auth/worker/login')
      .send({
        identifier: 'murugank',
        password: 'mypassword'
      });
    expect(loginWithUsername.status).toBe(200);
    expect(loginWithUsername.body.worker.id).toBe(assignedId);

    // 6. Worker can also log in using newly generated EMPLOYEE ID
    const loginWithId = await request(app)
      .post('/api/auth/worker/login')
      .send({
        identifier: assignedId,
        password: 'mypassword'
      });
    expect(loginWithId.status).toBe(200);
    expect(loginWithId.body.worker.username).toBe('murugank');
  });
});
