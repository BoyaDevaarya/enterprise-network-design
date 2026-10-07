import { dbRepository } from '../repo/db.js';
import { evaluateResourcePermission } from '../policy/policyEngine.js';

export function requireResourcePermission(actionType = 'read') {
  return (req, res, next) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Resource ID parameter missing' }
      });
    }

    const resource = dbRepository.getResourceById(id);
    if (!resource) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Resource '${id}' not found` }
      });
    }

    const rules = dbRepository.getRules();
    const effectiveDept = req.effectiveDepartment;
    const evalResult = evaluateResourcePermission(req.user, effectiveDept, resource, rules);

    req.resource = resource;
    req.resourceEval = evalResult;

    if (actionType === 'read') {
      dbRepository.addAuditLog({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        action: evalResult.readable ? 'RESOURCE_ACCESS_GRANTED' : 'RESOURCE_ACCESS_DENIED',
        resourceOrRuleId: resource.id,
        riskLevel: evalResult.readable ? 'LOW' : 'MEDIUM',
        reason: evalResult.reason,
        before: null,
        after: {
          resourceId: resource.id,
          resourceName: resource.name,
          requestedDepartment: effectiveDept,
          ownerDepartment: resource.ownerDepartment,
          allowed: evalResult.readable,
          canEdit: evalResult.writable,
          matchedRuleId: evalResult.matchedRuleId,
          isPreview: !!req.isPreview
        }
      });

      if (!evalResult.readable) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: evalResult.reason },
          matchedRuleId: evalResult.matchedRuleId
        });
      }
    } else if (actionType === 'write') {
      if (!evalResult.writable) {
        dbRepository.addAuditLog({
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.name,
          action: 'RESOURCE_UPDATE_DENIED',
          resourceOrRuleId: resource.id,
          riskLevel: 'HIGH',
          reason: evalResult.writeReason || evalResult.reason,
          before: { content: resource.content },
          after: null
        });

        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: evalResult.writeReason || evalResult.reason || 'Write access forbidden' }
        });
      }
    }

    next();
  };
}

export function requireResourceCreatePermission() {
  return (req, res, next) => {
    const { ownerDepartment } = req.body || {};
    const userRole = req.user?.role || 'MEMBER';
    const userDept = req.effectiveDepartment || req.user?.department || 'IT';

    if (userRole === 'ADMIN') {
      return next();
    }

    if (ownerDepartment && userDept.toLowerCase() !== ownerDepartment.toLowerCase()) {
      dbRepository.addAuditLog({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'RESOURCE_CREATE_DENIED',
        resourceOrRuleId: 'NEW_RESOURCE',
        riskLevel: 'HIGH',
        reason: `Creation denied: User in department '${userDept}' cannot create resources for department '${ownerDepartment}'`,
        before: null,
        after: null
      });

      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Creation forbidden: Users in '${userDept}' can only create resources for their own department '${userDept}'`
        }
      });
    }

    next();
  };
}
