import request from 'supertest';
import app from '../app.js';
import { resetToSeed } from '../repo/db.js';

async function runVerification() {
  console.log('====================================================');
  console.log(' Starting EnterpriseNet Access Portal E2E Verification');
  console.log('====================================================\n');

  resetToSeed();

  try {
    // 1. Health check
    console.log('[1/10] Checking GET /api/health...');
    const health = await request(app).get('/api/health');
    if (health.status !== 200) throw new Error(`Health failed: ${health.status}`);
    console.log('  ✓ GET /api/health passed.');

    // 2. Auth login (Admin)
    console.log('[2/10] Checking POST /api/auth/login (Admin)...');
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@enterprisenet.local', password: 'Admin@123' });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${adminLogin.status}`);
    const adminCookie = adminLogin.headers['set-cookie'];
    console.log('  ✓ Admin login passed.');

    // 3. Auth login (Member HR)
    console.log('[3/10] Checking POST /api/auth/login (Member HR)...');
    const hrLogin = await request(app).post('/api/auth/login').send({ email: 'hr@enterprisenet.local', password: 'Demo@123' });
    if (hrLogin.status !== 200) throw new Error(`HR login failed: ${hrLogin.status}`);
    const hrCookie = hrLogin.headers['set-cookie'];
    console.log('  ✓ HR member login passed.');

    // 4. Network topology
    console.log('[4/10] Checking GET /api/network...');
    const network = await request(app).get('/api/network').set('Cookie', adminCookie);
    if (network.status !== 200 || !network.body.nodes) throw new Error('Network failed');
    console.log('  ✓ Network topology retrieved successfully.');

    // 5. Policy Matrix & Score
    console.log('[5/10] Checking GET /api/policy/matrix & GET /api/policy/score...');
    const matrix = await request(app).get('/api/policy/matrix').set('Cookie', adminCookie);
    if (matrix.status !== 200) throw new Error('Matrix failed');
    const score = await request(app).get('/api/policy/score').set('Cookie', adminCookie);
    if (score.status !== 200 || score.body.score === undefined) throw new Error('Score failed');
    console.log(`  ✓ Policy matrix & score (${score.body.score} Grade ${score.body.grade}) passed.`);

    // 6. Access Control & Resource content
    console.log('[6/10] Checking Resource Content Access Control...');
    const hrWeb = await request(app).get('/api/resources/res-web/content').set('Cookie', hrCookie);
    if (hrWeb.status !== 200) throw new Error('HR web access failed');
    const hrFin = await request(app).get('/api/resources/res-finance/content').set('Cookie', hrCookie);
    if (hrFin.status !== 403) throw new Error('HR finance restriction failed');
    console.log('  ✓ Resource access control enforced as expected.');

    // 7. Policy Simulation
    console.log('[7/10] Checking POST /api/simulate...');
    const sim = await request(app).post('/api/simulate').set('Cookie', hrCookie).send({ srcDept: 'Sales', dstDept: 'Servers', test: 'http' });
    if (sim.status !== 200 || !sim.body.allowed) throw new Error('Simulation failed');
    console.log('  ✓ Traffic simulation passed.');

    // 8. Admin Policy Change & Undo
    console.log('[8/10] Checking Admin Change Apply & Undo...');
    const apply = await request(app).post('/api/admin/changes/apply').set('Cookie', adminCookie).send({
      src: 'HR',
      dst: 'Finance',
      service: 'any',
      action: 'permit',
      reason: 'E2E test permit',
      phrase: 'ALLOW HR TO FINANCE'
    });
    if (apply.status !== 200) throw new Error(`Apply change failed: ${apply.status}`);

    const hrFinAllowed = await request(app).get('/api/resources/res-finance/content').set('Cookie', hrCookie);
    if (hrFinAllowed.status !== 200) throw new Error('HR allowed access check failed');

    const undo = await request(app).post(`/api/admin/changes/undo/${apply.body.changeId}`).set('Cookie', adminCookie);
    if (undo.status !== 200) throw new Error('Undo change failed');

    const hrFinDeniedAgain = await request(app).get('/api/resources/res-finance/content').set('Cookie', hrCookie);
    if (hrFinDeniedAgain.status !== 403) throw new Error('HR restored denial check failed');
    console.log('  ✓ Change apply & undo workflow passed.');

    // 9. Config Generation
    console.log('[9/10] Checking Cisco IOS Config Generation...');
    const routerCfg = await request(app).get('/api/config/router').set('Cookie', adminCookie);
    if (routerCfg.status !== 200 || !routerCfg.text.includes('R1-EDGE')) throw new Error('Config generation failed');
    console.log('  ✓ Cisco IOS config generation passed.');

    // 10. Audit Log
    console.log('[10/10] Checking GET /api/admin/audit...');
    const audit = await request(app).get('/api/admin/audit').set('Cookie', adminCookie);
    if (audit.status !== 200 || audit.body.total === 0) throw new Error('Audit log check failed');
    console.log(`  ✓ Audit log verified (${audit.body.total} entries).`);

    console.log('\n====================================================');
    console.log(' 🎉 ALL E2E VERIFICATION SMOKE TESTS PASSED!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

runVerification();
