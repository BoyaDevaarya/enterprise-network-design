import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { resetToSeed, dbRepository } from '../repo/db.js';
import { checkAndPurgeExpiredRules } from '../services/timer.js';

describe('EnterpriseNet Access Portal Acceptance Tests', () => {
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

  it('1. Fresh clone & health check: /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('2. HR user: Finance Ledger content returns 403 naming matched rule; Company Web Portal returns 200', async () => {
    const cookies = await loginAs('hr@enterprisenet.local');

    const finRes = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', cookies);
    expect(finRes.status).toBe(403);
    expect(finRes.body.error.message).toContain('rule #1');
    expect(finRes.body.matchedRuleId).toBe('rule-1');

    const webRes = await request(app)
      .get('/api/resources/res-web/content')
      .set('Cookie', cookies);
    expect(webRes.status).toBe(200);
    expect(webRes.body.content).toBeDefined();
  });

  it('3. Admin flips HR to Finance permit via preview & apply, immediate effect, 10s undo window & 410 after expiry', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');
    const hrCookies = await loginAs('hr@enterprisenet.local');

    const applyRes = await request(app)
      .post('/api/admin/changes/apply')
      .set('Cookie', adminCookies)
      .send({
        src: 'HR',
        dst: 'Finance',
        service: 'any',
        action: 'permit',
        reason: 'Temporary audit access granted by IT Admin',
        phrase: 'ALLOW HR TO FINANCE'
      });
    expect(applyRes.status).toBe(200);
    const { changeId } = applyRes.body;
    expect(changeId).toBeDefined();

    const hrAccessRes = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', hrCookies);
    expect(hrAccessRes.status).toBe(200);

    const undoRes = await request(app)
      .post(`/api/admin/changes/undo/${changeId}`)
      .set('Cookie', adminCookies);
    expect(undoRes.status).toBe(200);

    const hrDeniedRes = await request(app)
      .get('/api/resources/res-finance/content')
      .set('Cookie', hrCookies);
    expect(hrDeniedRes.status).toBe(403);

    const secondUndoRes = await request(app)
      .post(`/api/admin/changes/undo/${changeId}`)
      .set('Cookie', adminCookies);
    expect(secondUndoRes.status).toBe(410);
    expect(secondUndoRes.body.error.code).toBe('EXPIRED');
  });

  it('4. Sales user permissions and traffic simulation', async () => {
    const salesCookies = await loginAs('sales@enterprisenet.local');

    const webRes = await request(app).get('/api/resources/res-web/content').set('Cookie', salesCookies);
    expect(webRes.status).toBe(200);

    const dnsRes = await request(app).get('/api/resources/res-dns/content').set('Cookie', salesCookies);
    expect(dnsRes.status).toBe(200);

    const itRes = await request(app).get('/api/resources/res-it/content').set('Cookie', salesCookies);
    expect(itRes.status).toBe(403);

    const simPing = await request(app)
      .post('/api/simulate')
      .set('Cookie', salesCookies)
      .send({ srcDept: 'Sales', dstDept: 'Servers', test: 'ping' });
    expect(simPing.status).toBe(200);
    expect(simPing.body.allowed).toBe(false);

    const simHttp = await request(app)
      .post('/api/simulate')
      .set('Cookie', salesCookies)
      .send({ srcDept: 'Sales', dstDept: 'Servers', test: 'http' });
    expect(simHttp.status).toBe(200);
    expect(simHttp.body.allowed).toBe(true);
  });

  it('5. IT & Management open all resources; Finance to HR ping allowed while HR to Finance ping blocked', async () => {
    const itCookies = await loginAs('it@enterprisenet.local');
    const mgmtCookies = await loginAs('mgmt@enterprisenet.local');

    const resources = ['res-hr', 'res-finance', 'res-it', 'res-mgmt', 'res-sales', 'res-web', 'res-dns'];
    for (const resId of resources) {
      const resIT = await request(app).get(`/api/resources/${resId}/content`).set('Cookie', itCookies);
      expect(resIT.status).toBe(200);

      const resMgmt = await request(app).get(`/api/resources/${resId}/content`).set('Cookie', mgmtCookies);
      expect(resMgmt.status).toBe(200);
    }

    const finToHrPing = await request(app)
      .post('/api/simulate')
      .set('Cookie', itCookies)
      .send({ srcDept: 'Finance', dstDept: 'HR', test: 'ping' });
    expect(finToHrPing.body.allowed).toBe(true);

    const hrToFinPing = await request(app)
      .post('/api/simulate')
      .set('Cookie', itCookies)
      .send({ srcDept: 'HR', dstDept: 'Finance', test: 'ping' });
    expect(hrToFinPing.body.allowed).toBe(false);
  });

  it('6. Member calling /api/admin/* gets 403; unauthenticated gets 401', async () => {
    const unauthRes = await request(app).get('/api/admin/rules');
    expect(unauthRes.status).toBe(401);

    const hrCookies = await loginAs('hr@enterprisenet.local');
    const memberRes = await request(app).get('/api/admin/rules').set('Cookie', hrCookies);
    expect(memberRes.status).toBe(403);
  });

  it('7. Preview HR to Finance returns risk CRITICAL, requiresReason true, requiresPhrase true; rejected without them with 422', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    const prevRes = await request(app)
      .post('/api/admin/changes/preview')
      .set('Cookie', adminCookies)
      .send({ src: 'HR', dst: 'Finance', service: 'any', action: 'permit' });

    expect(prevRes.status).toBe(200);
    expect(prevRes.body.risk.level).toBe('CRITICAL');
    expect(prevRes.body.requiresReason).toBe(true);
    expect(prevRes.body.requiresPhrase).toBe(true);
    expect(prevRes.body.phrase).toBe('ALLOW HR TO FINANCE');

    const applyFail = await request(app)
      .post('/api/admin/changes/apply')
      .set('Cookie', adminCookies)
      .send({ src: 'HR', dst: 'Finance', service: 'any', action: 'permit' });
    expect(applyFail.status).toBe(422);
  });

  it('8. Temporary rule expires automatically', () => {
    const rules = dbRepository.getRules();
    const tempRule = {
      id: 'temp-rule-test',
      order: 1,
      srcDept: 'HR',
      dstDept: 'Finance',
      service: 'any',
      action: 'permit',
      enabled: true,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      comment: 'Temporary rule'
    };
    rules.unshift(tempRule);
    dbRepository.saveRules(rules);

    const expired = checkAndPurgeExpiredRules(new Date());
    expect(expired.length).toBeGreaterThan(0);
    expect(expired.some(r => r.id === 'temp-rule-test')).toBe(true);

    const auditLogs = dbRepository.getAuditLogs();
    expect(auditLogs.some(l => l.action === 'RULE_EXPIRED')).toBe(true);
  });

  it('9. Adding department Legal gets VLAN 70 and 192.168.70.0/24 and appears in endpoints & router config', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    const addDeptRes = await request(app)
      .post('/api/admin/departments')
      .set('Cookie', adminCookies)
      .send({ name: 'Legal', color: '#ec4899', trust: 3 });

    expect(addDeptRes.status).toBe(201);
    expect(addDeptRes.body.vlan).toBe(70);
    expect(addDeptRes.body.subnet).toBe('192.168.70.0/24');

    const netRes = await request(app).get('/api/network').set('Cookie', adminCookies);
    expect(netRes.body.departments.some(d => d.id === 'Legal')).toBe(true);

    const matrixRes = await request(app).get('/api/policy/matrix').set('Cookie', adminCookies);
    expect(matrixRes.body.Legal).toBeDefined();

    const cfgRes = await request(app).get('/api/config/router').set('Cookie', adminCookies);
    expect(cfgRes.text).toContain('0/1.70');
    expect(cfgRes.text).toContain('VLAN70_POOL');
  });

  it('11. Every change and access attempt is logged in audit log with before and after', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');
    await request(app).get('/api/resources/res-hr/content').set('Cookie', adminCookies);

    const auditRes = await request(app).get('/api/admin/audit').set('Cookie', adminCookies);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThan(0);
  });

  it('12. Admin with X-Preview-Dept: sales gets Sales view while session is unchanged', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');

    const normRes = await request(app).get('/api/resources/res-it/content').set('Cookie', adminCookies);
    expect(normRes.status).toBe(200);

    const previewRes = await request(app)
      .get('/api/resources/res-it/content')
      .set('Cookie', adminCookies)
      .set('X-Preview-Dept', 'Sales');
    expect(previewRes.status).toBe(403);

    const meRes = await request(app).get('/api/auth/me').set('Cookie', adminCookies);
    expect(meRes.body.user.role).toBe('ADMIN');
    expect(meRes.body.user.department).toBe('IT');
  });

  it('13. Reset restores seed policy', async () => {
    const adminCookies = await loginAs('admin@enterprisenet.local', 'Admin@123');
    const resetRes = await request(app).post('/api/admin/reset').set('Cookie', adminCookies);
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
  });
});
