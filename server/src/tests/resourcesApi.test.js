import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { resetToSeed, dbRepository } from '../repo/db.js';

describe('Portal Resources Comprehensive API & Middleware Integration Tests', () => {
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

  it('1. Data Models & Storage: Persistent storage correctly creates, retrieves, and maintains resource schema metadata', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    // Create a new resource with full schema properties
    const newResPayload = {
      id: 'res-test-k8s-analytics',
      name: 'Analytics K8s Worker Node',
      category: 'cloud_infrastructure',
      status: 'ONLINE',
      ownerDepartment: 'IT',
      accessLevel: 'confidential',
      ipAddress: '10.0.99.20',
      endpoint: 'analytics-k8s.internal:6443',
      service: 'http',
      sensitivity: 'high',
      description: 'Dedicated Kubernetes worker node for heavy telemetry processing.',
      permissions: {
        allowedDepartments: ['IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN'],
        policyMatrixRequired: true
      },
      content: {
        title: 'K8s Analytics Cluster Metrics',
        table: [
          { pod: 'telemetry-collector-1', status: 'Running', cpu: '45%' },
          { pod: 'telemetry-collector-2', status: 'Running', cpu: '50%' }
        ]
      }
    };

    const createRes = await request(app)
      .post('/api/resources')
      .set('Cookie', adminCookies)
      .send(newResPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.resource.id).toBe('res-test-k8s-analytics');

    // Verify storage persistence in dbRepository
    const storedRes = dbRepository.getResourceById('res-test-k8s-analytics');
    expect(storedRes).toBeDefined();
    expect(storedRes.name).toBe('Analytics K8s Worker Node');
    expect(storedRes.category).toBe('cloud_infrastructure');
    expect(storedRes.ownerDepartment).toBe('IT');
    expect(storedRes.ipAddress).toBe('10.0.99.20');
    expect(storedRes.endpoint).toBe('analytics-k8s.internal:6443');
    expect(storedRes.permissions.allowedDepartments).toEqual(['IT', 'Management']);
    expect(storedRes.permissions.writeRoles).toEqual(['ADMIN']);

    // Retrieve via GET /api/resources/:id
    const getRes = await request(app)
      .get('/api/resources/res-test-k8s-analytics')
      .set('Cookie', adminCookies);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe('res-test-k8s-analytics');
    expect(getRes.body.accessible).toBe(true);
  });

  it('2. Access Control Middleware: X-Preview-Dept header dynamically alters permission evaluation for Admin', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    // Admin without preview (effective dept = IT) accessing Finance Ledger content -> 200 (IT has full access rule)
    const itAccess = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', adminCookies);
    expect(itAccess.status).toBe(200);

    // Admin simulating HR department (X-Preview-Dept: HR) accessing Finance Ledger content -> 403 Forbidden (rule-1 blocks HR -> Finance)
    const hrPreviewAccess = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', adminCookies)
      .set('X-Preview-Dept', 'HR');

    expect(hrPreviewAccess.status).toBe(403);
    expect(hrPreviewAccess.body.error.code).toBe('FORBIDDEN');
    expect(hrPreviewAccess.body.matchedRuleId).toBe('rule-1');
  });

  it('3. Access Control Middleware: GET and PUT/DELETE return 403 Forbidden for unauthorized departments', async () => {
    const hrCookies = await loginAs('hr@enterprisenet.local');

    // HR Member reading Finance Ledger content -> 403 Forbidden
    const hrReadForbidden = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', hrCookies);
    expect(hrReadForbidden.status).toBe(403);
    expect(hrReadForbidden.body.error.code).toBe('FORBIDDEN');

    // HR Member attempting to update Finance Ledger metadata -> 403 Forbidden
    const hrPutForbidden = await request(app)
      .put('/api/resources/res-finance')
      .set('Cookie', hrCookies)
      .send({ name: 'Tampered Finance Ledger' });
    expect(hrPutForbidden.status).toBe(403);
    expect(hrPutForbidden.body.error.code).toBe('FORBIDDEN');

    // HR Member attempting to delete Finance Ledger -> 403 Forbidden
    const hrDeleteForbidden = await request(app)
      .delete('/api/resources/res-finance')
      .set('Cookie', hrCookies);
    expect(hrDeleteForbidden.status).toBe(403);
    expect(hrDeleteForbidden.body.error.code).toBe('FORBIDDEN');
  });

  it('4. API Endpoints: Dynamic query parameters (category, department, search) filter GET /api/resources', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    // Filter by category: database_instance
    const dbRes = await request(app)
      .get('/api/resources?category=database_instance')
      .set('Cookie', adminCookies);
    expect(dbRes.status).toBe(200);
    expect(dbRes.body.every(r => r.category === 'database_instance')).toBe(true);

    // Filter by department: HR
    const hrDeptRes = await request(app)
      .get('/api/resources?department=HR')
      .set('Cookie', adminCookies);
    expect(hrDeptRes.status).toBe(200);
    expect(hrDeptRes.body.every(r => r.ownerDepartment.toLowerCase() === 'hr')).toBe(true);

    // Filter by search query: "SIEM"
    const searchRes = await request(app)
      .get('/api/resources?search=SIEM')
      .set('Cookie', adminCookies);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.length).toBeGreaterThan(0);
    expect(searchRes.body[0].name).toContain('SIEM');
  });

  it('5. Integration: Non-admin creation restriction and authorized department resource creation', async () => {
    const hrCookies = await loginAs('hr@enterprisenet.local');

    // HR user creating a resource for HR department -> 201 Created
    const hrCreateSuccess = await request(app)
      .post('/api/resources')
      .set('Cookie', hrCookies)
      .send({
        name: 'HR Training Portal',
        category: 'internal_web_app',
        ownerDepartment: 'HR',
        accessLevel: 'restricted',
        description: 'New employee onboard training portal.'
      });

    expect(hrCreateSuccess.status).toBe(201);
    expect(hrCreateSuccess.body.resource.name).toBe('HR Training Portal');
    expect(hrCreateSuccess.body.resource.ownerDepartment).toBe('HR');
  });
});
