import express from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { dbRepository } from '../repo/db.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastSSE } from '../services/sse.js';

const router = express.Router();

const RequestSchema = z.object({
  resourceId: z.string().min(1),
  reason: z.string().min(1)
});

router.post('/', authenticate, (req, res, next) => {
  try {
    const { resourceId, reason } = RequestSchema.parse(req.body);
    const resource = dbRepository.getResourceById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Resource '${resourceId}' not found`
        }
      });
    }

    const requests = dbRepository.getAccessRequests();
    const newRequest = {
      id: `req-${Date.now()}-${nanoid(4)}`,
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      userDepartment: req.user.department,
      resourceId: resource.id,
      resourceName: resource.name,
      targetDepartment: resource.ownerDepartment,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    dbRepository.saveAccessRequests(requests);

    dbRepository.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'ACCESS_REQUEST_SUBMITTED',
      resourceOrRuleId: newRequest.id,
      riskLevel: 'LOW',
      reason: `Submitted access request for resource ${resource.name}`,
      before: null,
      after: newRequest
    });

    broadcastSSE('access-request', { action: 'created', request: newRequest });

    res.status(201).json(newRequest);
  } catch (err) {
    next(err);
  }
});

export default router;
