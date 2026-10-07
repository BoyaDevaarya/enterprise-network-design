import express from 'express';
import { z } from 'zod';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';
import { evaluateResourcePermission } from '../policy/policyEngine.js';
import { requireResourcePermission, requireResourceCreatePermission } from '../middleware/resourceAuth.js';
import { broadcastSSE } from '../services/sse.js';
import { CreateResourceSchema, UpdateResourceSchema } from '../schemas/resourceSchema.js';

const router = express.Router();

const UpdateContentSchema = z.object({
  content: z.object({
    title: z.string().optional(),
    table: z.array(z.record(z.any()))
  })
});

// GET /api/resources - List all resources with dynamic permission evaluation
router.get('/', authenticate, (req, res) => {
  const { category, department, search } = req.query;
  const resources = dbRepository.getResources();
  const rules = dbRepository.getRules();
  const effectiveDept = req.effectiveDepartment;

  let evaluated = resources.map(resObj => {
    const evalResult = evaluateResourcePermission(req.user, effectiveDept, resObj, rules);
    return {
      ...resObj,
      accessible: evalResult.readable,
      canEdit: evalResult.writable,
      reason: evalResult.reason,
      writeReason: evalResult.writeReason,
      matchedRuleId: evalResult.matchedRuleId
    };
  });

  if (category && category !== 'ALL') {
    evaluated = evaluated.filter(r => r.category === category);
  }

  if (department && department !== 'ALL') {
    evaluated = evaluated.filter(r => r.ownerDepartment.toLowerCase() === department.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    evaluated = evaluated.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      (r.endpoint || r.ipAddress || '').toLowerCase().includes(q) ||
      r.id?.toLowerCase().includes(q)
    );
  }

  res.json(evaluated);
});

// GET /api/resources/:id - Fetch resource metadata & authorization state
router.get('/:id', authenticate, requireResourcePermission('read'), (req, res) => {
  const resource = req.resource;
  const evalResult = req.resourceEval;

  res.json({
    ...resource,
    accessible: evalResult.readable,
    canEdit: evalResult.writable,
    reason: evalResult.reason,
    writeReason: evalResult.writeReason,
    matchedRuleId: evalResult.matchedRuleId
  });
});

// GET /api/resources/:id/content - Read resource tabular content
router.get('/:id/content', authenticate, requireResourcePermission('read'), (req, res) => {
  const resource = req.resource;
  const evalResult = req.resourceEval;

  res.json({
    id: resource.id,
    name: resource.name,
    category: resource.category,
    status: resource.status,
    accessLevel: resource.accessLevel,
    ownerDepartment: resource.ownerDepartment,
    ipAddress: resource.ipAddress,
    endpoint: resource.endpoint,
    service: resource.service,
    sensitivity: resource.sensitivity,
    description: resource.description,
    permissions: resource.permissions,
    canEdit: evalResult.writable,
    writeReason: evalResult.writeReason,
    content: resource.content
  });
});

// POST /api/resources - Create a new portal resource
router.post('/', authenticate, requireResourceCreatePermission(), (req, res, next) => {
  try {
    const payload = CreateResourceSchema.parse(req.body);
    const resources = dbRepository.getResources();

    const newId = payload.id || `res-${payload.category.substring(0, 4)}-${Date.now().toString(36)}`;
    if (resources.some(r => r.id === newId)) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: `Resource with ID '${newId}' already exists` }
      });
    }

    const newResource = {
      id: newId,
      name: payload.name,
      category: payload.category,
      status: payload.status || 'ONLINE',
      ownerDepartment: payload.ownerDepartment,
      accessLevel: payload.accessLevel || 'restricted',
      ipAddress: payload.ipAddress || '192.168.30.1',
      endpoint: payload.endpoint || `${newId}.enterprisenet.local`,
      service: payload.service || 'http',
      sensitivity: payload.sensitivity || 'medium',
      description: payload.description || '',
      permissions: payload.permissions || {
        allowedDepartments: [payload.ownerDepartment, 'IT', 'Management'],
        readRoles: ['ADMIN', 'MEMBER'],
        writeRoles: ['ADMIN', 'MEMBER'],
        policyMatrixRequired: true
      },
      content: payload.content || { title: payload.name, table: [] }
    };

    resources.push(newResource);
    dbRepository.saveResources(resources);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'RESOURCE_CREATED',
      resourceOrRuleId: newResource.id,
      riskLevel: 'MEDIUM',
      reason: `New resource '${newResource.name}' created by ${req.user.name || req.user.email}`,
      before: null,
      after: newResource
    });

    broadcastSSE('RESOURCE_CREATED', {
      resourceId: newResource.id,
      name: newResource.name,
      createdBy: req.user.email
    });

    res.status(201).json({
      success: true,
      message: `Resource '${newResource.name}' created successfully`,
      resource: newResource
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/resources/:id - Update resource metadata and configuration
router.put('/:id', authenticate, requireResourcePermission('write'), (req, res, next) => {
  try {
    const payload = UpdateResourceSchema.parse(req.body);
    const resources = dbRepository.getResources();
    const idx = resources.findIndex(r => r.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Resource '${req.params.id}' not found` }
      });
    }

    const beforeSnapshot = JSON.parse(JSON.stringify(resources[idx]));
    const updated = {
      ...resources[idx],
      ...payload,
      id: resources[idx].id, // Protect ID from modification
      permissions: payload.permissions
        ? { ...resources[idx].permissions, ...payload.permissions }
        : resources[idx].permissions
    };

    resources[idx] = updated;
    dbRepository.saveResources(resources);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'RESOURCE_UPDATED',
      resourceOrRuleId: updated.id,
      riskLevel: 'MEDIUM',
      reason: `Resource '${updated.name}' metadata updated by ${req.user.name || req.user.email}`,
      before: beforeSnapshot,
      after: updated
    });

    broadcastSSE('RESOURCE_UPDATED', {
      resourceId: updated.id,
      updatedBy: req.user.email
    });

    res.json({
      success: true,
      message: `Resource '${updated.name}' updated successfully`,
      resource: updated
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/resources/:id/content - Update resource table data content
router.put('/:id/content', authenticate, requireResourcePermission('write'), (req, res, next) => {
  try {
    const { content } = UpdateContentSchema.parse(req.body);
    const resources = dbRepository.getResources();
    const idx = resources.findIndex(r => r.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Resource '${req.params.id}' not found` }
      });
    }

    const beforeSnapshot = JSON.parse(JSON.stringify(resources[idx].content));
    resources[idx].content = content;
    dbRepository.saveResources(resources);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'RESOURCE_UPDATED',
      resourceOrRuleId: resources[idx].id,
      riskLevel: 'MEDIUM',
      reason: `Resource '${resources[idx].name}' table content updated by ${req.user.name || req.user.email}`,
      before: { content: beforeSnapshot },
      after: { content: resources[idx].content }
    });

    broadcastSSE('RESOURCE_UPDATED', {
      resourceId: resources[idx].id,
      updatedBy: req.user.email
    });

    res.json({
      success: true,
      message: `Resource '${resources[idx].name}' content updated successfully`,
      resource: {
        id: resources[idx].id,
        name: resources[idx].name,
        content: resources[idx].content,
        canEdit: true
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resources/:id - Delete a portal resource
router.delete('/:id', authenticate, requireResourcePermission('write'), (req, res) => {
  const resources = dbRepository.getResources();
  const idx = resources.findIndex(r => r.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Resource '${req.params.id}' not found` }
    });
  }

  const deletedResource = resources.splice(idx, 1)[0];
  dbRepository.saveResources(resources);

  dbRepository.addAuditLog({
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    action: 'RESOURCE_DELETED',
    resourceOrRuleId: deletedResource.id,
    riskLevel: 'HIGH',
    reason: `Resource '${deletedResource.name}' deleted by ${req.user.name || req.user.email}`,
    before: deletedResource,
    after: null
  });

  broadcastSSE('RESOURCE_DELETED', {
    resourceId: deletedResource.id,
    deletedBy: req.user.email
  });

  res.json({
    success: true,
    message: `Resource '${deletedResource.name}' successfully deleted`,
    deletedId: deletedResource.id
  });
});

export default router;
