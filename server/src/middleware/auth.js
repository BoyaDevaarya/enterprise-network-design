import jwt from 'jsonwebtoken';
import { dbRepository } from '../repo/db.js';

let devJwtSecret = null;

export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (!devJwtSecret) {
    devJwtSecret = 'dev-secret-' + Math.random().toString(36).substring(2);
    console.warn('[AUTH WARNING] No JWT_SECRET in environment! Generated temporary secret key.');
  }
  return devJwtSecret;
}

export function authenticate(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or invalid'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = dbRepository.getUserById(decoded.id);

    if (!user || user.disabled) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account is disabled or no longer exists'
        }
      });
    }

    req.user = user;

    // Handle X-Preview-Dept header for ADMIN users
    const previewHeader = req.headers['x-preview-dept'];
    if (user.role === 'ADMIN' && previewHeader && typeof previewHeader === 'string') {
      const targetDept = dbRepository.getDepartmentById(previewHeader.trim());
      if (targetDept) {
        req.effectiveDepartment = targetDept.id;
        req.isPreview = true;
      } else {
        req.effectiveDepartment = user.department;
      }
    } else {
      req.effectiveDepartment = user.department;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session token'
      }
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrator privileges required for this endpoint'
      }
    });
  }
  next();
}
