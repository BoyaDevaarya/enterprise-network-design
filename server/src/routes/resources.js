import express from 'express';
import { z } from 'zod';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';
import { evaluateResourceAccess } from '../policy/policyEngine.js';

const router = express.Router();

const ParamSchema = z.object({
  id: z.string().min(1)
});

router.get('/', authenticate, (req, res) => {
  const resources = dbRepository.getResources();
  const rules = dbRepository.getRules();
  const effectiveDept = req.effectiveDepartment;

  const evaluated = resources.map(resObj => {
    const evalResult = evaluateResourceAccess(effectiveDept, resObj, rules);
    return {
      ...resObj,
      accessible: evalResult.allowed,
      reason: evalResult.reason,
      matchedRuleId: evalResult.matchedRuleId
    };
  });

  res.json(evaluated);
});

router.get('/:id/content', authenticate, (req, res, next) => {
  try {
    const { id } = ParamSchema.parse(req.params);
    const resource = dbRepository.getResourceById(id);

    if (!resource) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Resource '${id}' not found`
        }
      });
    }

    const rules = dbRepository.getRules();
    const effectiveDept = req.effectiveDepartment;
    const evalResult = evaluateResourceAccess(effectiveDept, resource, rules);

    // Record audit log for EVERY access attempt
    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: evalResult.allowed ? 'RESOURCE_ACCESS_GRANTED' : 'RESOURCE_ACCESS_DENIED',
      resourceOrRuleId: resource.id,
      riskLevel: evalResult.allowed ? 'LOW' : 'MEDIUM',
      reason: evalResult.reason,
      before: null,
      after: {
        resourceId: resource.id,
        resourceName: resource.name,
        requestedDepartment: effectiveDept,
        ownerDepartment: resource.ownerDepartment,
        allowed: evalResult.allowed,
        matchedRuleId: evalResult.matchedRuleId,
        isPreview: !!req.isPreview
      }
    });

    if (!evalResult.allowed) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: evalResult.reason
        },
        matchedRuleId: evalResult.matchedRuleId
      });
    }

    res.json({
      id: resource.id,
      name: resource.name,
      ownerDepartment: resource.ownerDepartment,
      service: resource.service,
      sensitivity: resource.sensitivity,
      description: resource.description,
      content: resource.content
    });
  } catch (err) {
    next(err);
  }
});

export default router;
