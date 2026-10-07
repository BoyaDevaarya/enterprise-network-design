import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { dbRepository } from '../repo/db.js';
import { authenticate, getJwtSecret } from '../middleware/auth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = dbRepository.getUserByEmail(email);

    if (!user || user.disabled) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const passwordMatches = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      maxAge: 24 * 60 * 60 * 1000
    });

    dbRepository.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      action: 'USER_LOGIN',
      resourceOrRuleId: null,
      riskLevel: 'LOW',
      reason: `User ${user.email} logged in successfully`,
      before: null,
      after: { email: user.email, role: user.role, department: user.department }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      department: req.user.department
    }
  });
});

export default router;
