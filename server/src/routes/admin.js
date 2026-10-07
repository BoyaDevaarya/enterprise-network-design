import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { dbRepository } from '../repo/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { calculateChangeRisk } from '../risk/riskEngine.js';
import { generateRouterConfig, generateConfigDiff } from '../config/configGenerator.js';
import { broadcastSSE } from '../services/sse.js';

const router = express.Router();
router.use(authenticate, requireAdmin);

// In-memory pending changes map for 10s undo capability
const pendingChanges = new Map();

// Helper schemas
const RuleSchema = z.object({
  srcDept: z.string().min(1),
  dstDept: z.string().min(1),
  service: z.enum(['any', 'icmp', 'http', 'dns']).default('any'),
  action: z.enum(['permit', 'deny']).default('permit'),
  enabled: z.boolean().default(true),
  expiresInMinutes: z.number().nullable().optional(),
  comment: z.string().optional()
});

const MatrixFlipSchema = z.object({
  action: z.enum(['permit', 'deny'])
});

const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  department: z.string().min(1)
});

const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  department: z.string().min(1).optional(),
  disabled: z.boolean().optional()
});

const DeptCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  trust: z.number().int().min(1).max(5)
});

const ChangeApplySchema = z.object({
  src: z.string().min(1),
  dst: z.string().min(1),
  service: z.enum(['any', 'icmp', 'http', 'dns']).default('any'),
  action: z.enum(['permit', 'deny']).default('permit'),
  expiresInMinutes: z.number().nullable().optional(),
  comment: z.string().optional(),
  reason: z.string().optional(),
  phrase: z.string().optional()
});

// --- RULES ENDPOINTS ---
router.get('/rules', (req, res) => {
  res.json(dbRepository.getRules());
});

router.post('/rules', (req, res, next) => {
  try {
    const data = RuleSchema.parse(req.body);
    const rules = dbRepository.getRules();
    const maxOrder = rules.reduce((max, r) => Math.max(max, r.order || 0), 0);

    const newRule = {
      id: `rule-${Date.now()}-${nanoid(4)}`,
      order: maxOrder + 1,
      srcDept: data.srcDept,
      dstDept: data.dstDept,
      service: data.service,
      action: data.action,
      enabled: data.enabled,
      expiresAt: data.expiresInMinutes ? new Date(Date.now() + data.expiresInMinutes * 60000).toISOString() : null,
      comment: data.comment || '',
      createdBy: req.user.email,
      createdAt: new Date().toISOString()
    };

    rules.push(newRule);
    dbRepository.saveRules(rules);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'RULE_CREATED',
      resourceOrRuleId: newRule.id,
      riskLevel: 'MEDIUM',
      reason: `Rule #${newRule.order} created (${newRule.srcDept} -> ${newRule.dstDept})`,
      before: null,
      after: newRule
    });

    broadcastSSE('policy-changed', { reason: 'Rule created', rule: newRule });
    res.status(201).json(newRule);
  } catch (err) {
    next(err);
  }
});

router.put('/rules/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const rules = dbRepository.getRules();
    const index = rules.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rule not found' } });
    }

    const before = { ...rules[index] };
    const updated = {
      ...before,
      ...req.body,
      id: before.id
    };

    rules[index] = updated;
    dbRepository.saveRules(rules);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'RULE_UPDATED',
      resourceOrRuleId: id,
      riskLevel: 'MEDIUM',
      reason: `Rule #${updated.order || updated.id} updated`,
      before,
      after: updated
    });

    broadcastSSE('policy-changed', { reason: 'Rule updated', rule: updated });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/rules/:id', (req, res) => {
  const { id } = req.params;
  const rules = dbRepository.getRules();
  const index = rules.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rule not found' } });
  }

  const [removed] = rules.splice(index, 1);
  dbRepository.saveRules(rules);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'RULE_DELETED',
    resourceOrRuleId: id,
    riskLevel: 'MEDIUM',
    reason: `Rule #${removed.order || removed.id} deleted`,
    before: removed,
    after: null
  });

  broadcastSSE('policy-changed', { reason: 'Rule deleted', ruleId: id });
  res.json({ success: true, message: 'Rule deleted' });
});

router.post('/rules/reorder', (req, res, next) => {
  try {
    const { ruleIds } = z.object({ ruleIds: z.array(z.string()) }).parse(req.body);
    const rules = dbRepository.getRules();

    const ruleMap = new Map(rules.map(r => [r.id, r]));
    const newRules = [];
    let order = 1;

    for (const id of ruleIds) {
      if (ruleMap.has(id)) {
        const r = ruleMap.get(id);
        r.order = order++;
        newRules.push(r);
        ruleMap.delete(id);
      }
    }

    for (const [, r] of ruleMap) {
      r.order = order++;
      newRules.push(r);
    }

    dbRepository.saveRules(newRules);
    broadcastSSE('policy-changed', { reason: 'Rules reordered' });
    res.json(newRules);
  } catch (err) {
    next(err);
  }
});

router.put('/matrix/:src/:dst', (req, res, next) => {
  try {
    const { src, dst } = req.params;
    const { action } = MatrixFlipSchema.parse(req.body);

    const rules = dbRepository.getRules();
    const existingIndex = rules.findIndex(r =>
      r.srcDept.toLowerCase() === src.toLowerCase() &&
      r.dstDept.toLowerCase() === dst.toLowerCase() &&
      r.service === 'any'
    );

    let updatedRule = null;

    if (existingIndex !== -1) {
      rules[existingIndex].action = action;
      rules[existingIndex].enabled = true;
      rules[existingIndex].order = 1;
      for (let i = 0; i < rules.length; i++) {
        if (i !== existingIndex) {
          rules[i].order = (rules[i].order || 0) + 1;
        }
      }
      updatedRule = rules[existingIndex];
    } else {
      updatedRule = {
        id: `rule-${Date.now()}-${nanoid(4)}`,
        order: 1,
        srcDept: src,
        dstDept: dst,
        service: 'any',
        action,
        enabled: true,
        expiresAt: null,
        comment: `Direct matrix flip ${src} -> ${dst} (${action})`,
        createdBy: req.user.email,
        createdAt: new Date().toISOString()
      };
      for (const r of rules) {
        r.order = (r.order || 0) + 1;
      }
      rules.unshift(updatedRule);
    }

    dbRepository.saveRules(rules);
    broadcastSSE('policy-changed', { reason: `Matrix flip ${src} -> ${dst}` });
    res.json(updatedRule);
  } catch (err) {
    next(err);
  }
});

// --- CHANGE PREVIEW AND APPLY ENDPOINTS ---
router.post('/changes/preview', (req, res, next) => {
  try {
    const body = z.object({
      src: z.string().min(1),
      dst: z.string().min(1),
      service: z.enum(['any', 'icmp', 'http', 'dns']).default('any'),
      action: z.enum(['permit', 'deny']).default('permit'),
      expiresInMinutes: z.number().nullable().optional()
    }).parse(req.body);

    const departments = dbRepository.getDepartments();
    const resources = dbRepository.getResources();
    const rules = dbRepository.getRules();

    const risk = calculateChangeRisk({
      srcDept: body.src,
      dstDept: body.dst,
      service: body.service,
      action: body.action,
      expiresInMinutes: body.expiresInMinutes
    }, departments, resources);

    const users = dbRepository.getUsers();
    const impactedUsers = users.filter(u =>
      body.src === 'any' || u.department.toLowerCase() === body.src.toLowerCase()
    ).map(u => ({ id: u.id, email: u.email, department: u.department }));

    const impactedResources = resources.filter(r =>
      body.dst === 'any' || r.ownerDepartment.toLowerCase() === body.dst.toLowerCase()
    ).map(r => ({ id: r.id, name: r.name, ownerDepartment: r.ownerDepartment }));

    const oldConfig = generateRouterConfig(departments, rules);
    const hypotheticalRule = {
      id: 'preview-rule',
      order: 1,
      srcDept: body.src,
      dstDept: body.dst,
      service: body.service,
      action: body.action,
      enabled: true
    };
    const hypotheticalRules = [hypotheticalRule, ...rules];
    const newConfig = generateRouterConfig(departments, hypotheticalRules);
    const aclDiff = generateConfigDiff(oldConfig, newConfig);

    res.json({
      risk,
      impactedUsers,
      impactedResources,
      aclDiff,
      requiresReason: risk.requiresReason,
      requiresPhrase: risk.requiresPhrase,
      phrase: risk.phrase,
      alternatives: risk.alternatives
    });
  } catch (err) {
    next(err);
  }
});

router.post('/changes/apply', (req, res, next) => {
  try {
    const body = ChangeApplySchema.parse(req.body);

    const departments = dbRepository.getDepartments();
    const resources = dbRepository.getResources();

    const risk = calculateChangeRisk({
      srcDept: body.src,
      dstDept: body.dst,
      service: body.service,
      action: body.action,
      expiresInMinutes: body.expiresInMinutes
    }, departments, resources);

    // Validate reason requirement
    if (risk.requiresReason && (!body.reason || !body.reason.trim())) {
      return res.status(422).json({
        error: {
          code: 'UNPROCESSABLE_ENTITY',
          message: 'Justification reason is required for HIGH and CRITICAL risk changes'
        }
      });
    }

    // Validate phrase requirement
    if (risk.requiresPhrase) {
      const expectedPhrase = risk.phrase;
      if (!body.phrase || body.phrase.trim().toUpperCase() !== expectedPhrase) {
        return res.status(422).json({
          error: {
            code: 'UNPROCESSABLE_ENTITY',
            message: `Confirmation phrase mismatch. You must provide exact phrase: '${expectedPhrase}'`
          }
        });
      }
    }

    const rules = dbRepository.getRules();

    // Deep clone state BEFORE modifying order!
    const beforeRules = JSON.parse(JSON.stringify(rules));

    // Shift orders
    for (const r of rules) {
      r.order = (r.order || 0) + 1;
    }

    const newRule = {
      id: `rule-${Date.now()}-${nanoid(4)}`,
      order: 1,
      srcDept: body.src,
      dstDept: body.dst,
      service: body.service,
      action: body.action,
      enabled: true,
      expiresAt: body.expiresInMinutes ? new Date(Date.now() + body.expiresInMinutes * 60000).toISOString() : null,
      comment: body.comment || body.reason || `Applied rule change ${body.src} -> ${body.dst}`,
      createdBy: req.user.email,
      createdAt: new Date().toISOString()
    };

    rules.unshift(newRule);
    dbRepository.saveRules(rules);

    const changeId = `change-${Date.now()}-${nanoid(6)}`;
    pendingChanges.set(changeId, {
      changeId,
      createdAt: Date.now(),
      beforeRules,
      afterRules: JSON.parse(JSON.stringify(rules)),
      appliedRuleId: newRule.id
    });

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'POLICY_CHANGE_APPLIED',
      resourceOrRuleId: newRule.id,
      riskLevel: risk.level,
      reason: body.reason || `Applied ${risk.level} risk rule change (${body.src} -> ${body.dst})`,
      before: null,
      after: newRule
    });

    broadcastSSE('policy-changed', { reason: 'Policy change applied', changeId, rule: newRule });

    res.json({
      success: true,
      changeId,
      rule: newRule
    });
  } catch (err) {
    next(err);
  }
});

router.post('/changes/undo/:changeId', (req, res) => {
  const { changeId } = req.params;
  const change = pendingChanges.get(changeId);

  if (!change) {
    return res.status(410).json({
      error: {
        code: 'EXPIRED',
        message: 'Undo window expired or invalid change ID'
      }
    });
  }

  const ageMs = Date.now() - change.createdAt;
  if (ageMs > 10000) {
    pendingChanges.delete(changeId);
    return res.status(410).json({
      error: {
        code: 'EXPIRED',
        message: 'Undo window expired (10 second limit exceeded)'
      }
    });
  }

  dbRepository.saveRules(change.beforeRules);
  pendingChanges.delete(changeId);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'POLICY_CHANGE_UNDONE',
    resourceOrRuleId: change.appliedRuleId,
    riskLevel: 'LOW',
    reason: `Undone policy change ${changeId} within 10-second window`,
    before: change.afterRules,
    after: change.beforeRules
  });

  broadcastSSE('policy-changed', { reason: 'Policy change undone', changeId });

  res.json({
    success: true,
    message: 'Policy change successfully undone'
  });
});

// --- USERS ENDPOINTS ---
router.get('/users', (req, res) => {
  const users = dbRepository.getUsers().map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json(users);
});

router.post('/users', (req, res, next) => {
  try {
    const data = UserCreateSchema.parse(req.body);
    const existing = dbRepository.getUserByEmail(data.email);

    if (existing) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'User with this email already exists' }
      });
    }

    const users = dbRepository.getUsers();
    const newUser = {
      id: `user-${Date.now()}-${nanoid(4)}`,
      email: data.email.toLowerCase(),
      passwordHash: bcrypt.hashSync(data.password, 10),
      name: data.name,
      role: data.role,
      department: data.department,
      disabled: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    dbRepository.saveUsers(users);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'USER_CREATED',
      resourceOrRuleId: newUser.id,
      riskLevel: 'LOW',
      reason: `Created user ${newUser.email} in ${newUser.department}`,
      before: null,
      after: { id: newUser.id, email: newUser.email, role: newUser.role, department: newUser.department }
    });

    broadcastSSE('user-changed', { action: 'created', user: { id: newUser.id, email: newUser.email } });

    const { passwordHash, ...rest } = newUser;
    res.status(201).json(rest);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const data = UserUpdateSchema.parse(req.body);
    const users = dbRepository.getUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const before = { ...users[index] };
    delete before.passwordHash;

    if (data.email) users[index].email = data.email.toLowerCase();
    if (data.name) users[index].name = data.name;
    if (data.role) users[index].role = data.role;
    if (data.department) users[index].department = data.department;
    if (typeof data.disabled === 'boolean') users[index].disabled = data.disabled;
    if (data.password) users[index].passwordHash = bcrypt.hashSync(data.password, 10);

    dbRepository.saveUsers(users);

    const after = { ...users[index] };
    delete after.passwordHash;

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'USER_UPDATED',
      resourceOrRuleId: id,
      riskLevel: 'LOW',
      reason: `Updated user ${after.email}`,
      before,
      after
    });

    broadcastSSE('user-changed', { action: 'updated', user: after });
    res.json(after);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const users = dbRepository.getUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  const [removed] = users.splice(index, 1);
  dbRepository.saveUsers(users);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'USER_DELETED',
    resourceOrRuleId: id,
    riskLevel: 'LOW',
    reason: `Deleted user ${removed.email}`,
    before: { id: removed.id, email: removed.email },
    after: null
  });

  broadcastSSE('user-changed', { action: 'deleted', userId: id });
  res.json({ success: true, message: 'User deleted' });
});

// --- DEPARTMENTS ENDPOINTS ---
router.post('/departments', (req, res, next) => {
  try {
    const data = DeptCreateSchema.parse(req.body);
    const departments = dbRepository.getDepartments();

    const deptId = data.name.trim();

    if (departments.some(d => d.id.toLowerCase() === deptId.toLowerCase())) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: `Department '${deptId}' already exists` }
      });
    }

    const maxVlan = departments.reduce((max, d) => Math.max(max, d.vlan), 0);
    const nextVlan = maxVlan + 10;
    const nextSubnetThirdOctet = nextVlan;
    const nextSubnet = `192.168.${nextSubnetThirdOctet}.0/24`;
    const nextGateway = `192.168.${nextSubnetThirdOctet}.1`;

    const newDept = {
      id: deptId,
      name: data.name,
      vlan: nextVlan,
      subnet: nextSubnet,
      gateway: nextGateway,
      color: data.color,
      trust: data.trust
    };

    departments.push(newDept);
    dbRepository.saveDepartments(departments);

    const resources = dbRepository.getResources();
    const newRes = {
      id: `res-${deptId.toLowerCase()}`,
      name: `${data.name} Internal Portal`,
      ownerDepartment: deptId,
      service: 'http',
      sensitivity: 'medium',
      description: `Default internal data portal for ${data.name}`,
      content: {
        title: `${data.name} Department System`,
        table: [
          { item: 'Dept ID', value: deptId },
          { item: 'VLAN', value: nextVlan },
          { item: 'Subnet', value: nextSubnet }
        ]
      }
    };
    resources.push(newRes);
    dbRepository.saveResources(resources);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'DEPARTMENT_CREATED',
      resourceOrRuleId: deptId,
      riskLevel: 'LOW',
      reason: `Created department ${deptId} with VLAN ${nextVlan} (${nextSubnet})`,
      before: null,
      after: newDept
    });

    broadcastSSE('policy-changed', { reason: 'Department created', department: newDept });

    res.status(201).json(newDept);
  } catch (err) {
    next(err);
  }
});

router.delete('/departments/:id', (req, res) => {
  const { id } = req.params;
  const users = dbRepository.getUsers();

  const userInDept = users.find(u => u.department.toLowerCase() === id.toLowerCase());
  if (userInDept) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: `Cannot delete department '${id}': active user (${userInDept.email}) belongs to this department`
      }
    });
  }

  const departments = dbRepository.getDepartments();
  const index = departments.findIndex(d => d.id.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Department not found' } });
  }

  const [removed] = departments.splice(index, 1);
  dbRepository.saveDepartments(departments);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'DEPARTMENT_DELETED',
    resourceOrRuleId: id,
    riskLevel: 'MEDIUM',
    reason: `Deleted department ${removed.name}`,
    before: removed,
    after: null
  });

  broadcastSSE('policy-changed', { reason: 'Department deleted', departmentId: id });
  res.json({ success: true, message: 'Department deleted' });
});

// --- AUDIT LOGS ENDPOINT ---
router.get('/audit', (req, res) => {
  let logs = dbRepository.getAuditLogs();
  const { search, action, riskLevel, page = 1, limit = 50 } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l =>
      (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.reason && l.reason.toLowerCase().includes(q))
    );
  }

  if (action) {
    logs = logs.filter(l => l.action.toLowerCase() === String(action).toLowerCase());
  }

  if (riskLevel) {
    logs = logs.filter(l => l.riskLevel && l.riskLevel.toLowerCase() === String(riskLevel).toLowerCase());
  }

  logs = [...logs].reverse();

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const total = logs.length;
  const paginated = logs.slice((p - 1) * l, p * l);

  res.json({
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    data: paginated
  });
});

router.get('/audit/verify', (req, res) => {
  const result = dbRepository.verifyAuditLogChain();
  res.json({
    timestamp: new Date().toISOString(),
    tamperProof: result.valid,
    chainIntegrity: result.valid ? 'VALID_HMAC_SHA256_CHAIN' : 'COMPROMISED',
    details: result
  });
});

// --- ACCESS REQUESTS ENDPOINTS ---
router.get('/access-requests', (req, res) => {
  res.json(dbRepository.getAccessRequests());
});

router.post('/access-requests/:id/approve', (req, res) => {
  const { id } = req.params;
  const requests = dbRepository.getAccessRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Access request not found' } });
  }

  request.status = 'APPROVED';
  request.updatedAt = new Date().toISOString();
  dbRepository.saveAccessRequests(requests);

  const resource = dbRepository.getResourceById(request.resourceId);
  if (resource) {
    const rules = dbRepository.getRules();
    const newRule = {
      id: `rule-${Date.now()}-${nanoid(4)}`,
      order: 1,
      srcDept: request.userDepartment,
      dstDept: resource.ownerDepartment,
      service: resource.service || 'http',
      action: 'permit',
      enabled: true,
      expiresAt: null,
      comment: `Approved access request from ${request.userEmail}: ${request.reason}`,
      createdBy: req.user.email,
      createdAt: new Date().toISOString()
    };

    for (const r of rules) r.order = (r.order || 0) + 1;
    rules.unshift(newRule);
    dbRepository.saveRules(rules);
  }

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'ACCESS_REQUEST_APPROVED',
    resourceOrRuleId: request.id,
    riskLevel: 'MEDIUM',
    reason: `Approved access request for ${request.userEmail} to resource ${request.resourceId}`,
    before: null,
    after: request
  });

  broadcastSSE('access-request', { action: 'approved', request });
  broadcastSSE('policy-changed', { reason: 'Access request approved' });

  res.json(request);
});

router.post('/access-requests/:id/deny', (req, res) => {
  const { id } = req.params;
  const requests = dbRepository.getAccessRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Access request not found' } });
  }

  request.status = 'DENIED';
  request.updatedAt = new Date().toISOString();
  dbRepository.saveAccessRequests(requests);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'ACCESS_REQUEST_DENIED',
    resourceOrRuleId: request.id,
    riskLevel: 'LOW',
    reason: `Denied access request for ${request.userEmail} to resource ${request.resourceId}`,
    before: null,
    after: request
  });

  broadcastSSE('access-request', { action: 'denied', request });

  res.json(request);
});

// --- RESET POLICY ENDPOINT ---
router.post('/reset', (req, res, next) => {
  try {
    dbRepository.resetToSeed();

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'POLICY_RESET',
      resourceOrRuleId: null,
      riskLevel: 'HIGH',
      reason: 'Restored database and policy rules to factory seed settings',
      before: null,
      after: null
    });

    broadcastSSE('policy-changed', { reason: 'Policy reset to seed defaults' });

    res.json({
      success: true,
      message: 'Policy and database successfully reset to factory seed defaults'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
