import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { resetToSeed } from '../repo/db.js';

describe('Portal Resources & Read/Write Enforcement Tests', () => {
  beforeEach(() => {
    resetToSeed();
  });

  async function loginAs(email, password = 'Demo@123') {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    return res.headers['set-cookie'];
  }

  it('1. GET /api/resources returns diverse set of resources across all categories', async () => {
    const cookies = await loginAs('admin@enterprisenet.local', 'Admin@123');
    const res = await request(app).get('/api/resources').set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const categories = new Set(res.body.map(r => r.category));
    expect(categories.has('cloud_infrastructure')).toBe(true);
    expect(categories.has('database_instance')).toBe(true);
    expect(categories.has('internal_web_app')).toBe(true);
    expect(categories.has('network_tool')).toBe(true);

    // Verify metadata structure
    const sample = res.body[0];
    expect(sample.id).toBeDefined();
    expect(sample.name).toBeDefined();
    expect(sample.status).toBeDefined();
    expect(sample.ownerDepartment).toBeDefined();
    expect(sample.accessLevel).toBeDefined();
    expect(sample.permissions).toBeDefined();
    expect(sample.permissions.allowedDepartments).toBeDefined();
    expect(sample.permissions.readRoles).toBeDefined();
    expect(sample.permissions.writeRoles).toBeDefined();
  });

  it('2. HR Member can edit HR Records (res-hr), but Finance Member gets 403 Write Forbidden', async () => {
    const hrCookies = await loginAs('hr@enterprisenet.local');
    const finCookies = await loginAs('finance@enterprisenet.local');

    // HR Member update HR Records content -> Allowed
    const hrUpdate = await request(app)
      .put('/api/resources/res-hr/content')
      .set('Cookie', hrCookies)
      .send({
        content: {
          title: 'HR Employee Database Updated',
          table: [
            { empId: 'EMP-001', name: 'Alice Smith', role: 'HR Director', salary: '$125,000', status: 'Active' }
          ]
        }
      });
    expect(hrUpdate.status).toBe(200);
    expect(hrUpdate.body.success).toBe(true);

    // Finance Member attempting to update HR Records -> Forbidden (403)
    const finUpdate = await request(app)
      .put('/api/resources/res-hr/content')
      .set('Cookie', finCookies)
      .send({
        content: {
          title: 'Hacked Title',
          table: []
        }
      });
    expect(finUpdate.status).toBe(403);
    expect(finUpdate.body.error.code).toBe('FORBIDDEN');
    expect(finUpdate.body.error.message).toContain('Write access restricted');
  });

  it('3. Admin can edit any resource content regardless of department', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    const updateRes = await request(app)
      .put('/api/resources/res-sales/content')
      .set('Cookie', adminCookies)
      .send({
        content: {
          title: 'Sales Pipeline Q4 - Admin Modified',
          table: [
            { lead: 'Mega Corp', stage: 'Negotiation', value: '$1,000,000', probability: '90%' }
          ]
        }
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
  });

  it('4. POST /api/resources creates a new resource with policy enforcement', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');
    const hrCookies = await loginAs('hr@enterprisenet.local');

    // HR Member trying to create resource for Finance department -> 403 Forbidden
    const hrCreateFail = await request(app)
      .post('/api/resources')
      .set('Cookie', hrCookies)
      .send({
        name: 'Unapproved Finance Server',
        category: 'database_instance',
        ownerDepartment: 'Finance'
      });
    expect(hrCreateFail.status).toBe(403);
    expect(hrCreateFail.body.error.code).toBe('FORBIDDEN');

    // Admin creating a new Cloud Infrastructure resource -> 201 Created
    const createSuccess = await request(app)
      .post('/api/resources')
      .set('Cookie', adminCookies)
      .send({
        id: 'res-cloud-test-db',
        name: 'Staging PostgreSQL Cluster',
        category: 'database_instance',
        status: 'ONLINE',
        ownerDepartment: 'IT',
        accessLevel: 'confidential',
        endpoint: 'pg-staging.internal:5432',
        description: 'Staging DB for QA team'
      });
    expect(createSuccess.status).toBe(201);
    expect(createSuccess.body.success).toBe(true);
    expect(createSuccess.body.resource.id).toBe('res-cloud-test-db');
  });

  it('5. PUT /api/resources/:id and DELETE /api/resources/:id work with policy enforcement', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    // Update metadata
    const updateRes = await request(app)
      .put('/api/resources/res-web')
      .set('Cookie', adminCookies)
      .send({
        description: 'Updated Intranet Description'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.resource.description).toBe('Updated Intranet Description');

    // Delete resource
    const deleteRes = await request(app)
      .delete('/api/resources/res-dns')
      .set('Cookie', adminCookies);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify deleted resource returns 404
    const getDeleted = await request(app)
      .get('/api/resources/res-dns/content')
      .set('Cookie', adminCookies);
    expect(getDeleted.status).toBe(404);
  });
});

