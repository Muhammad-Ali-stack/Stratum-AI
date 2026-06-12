import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
} from '../services/supabaseService.js';

const router = Router();

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function issueToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, config.JWT_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

function setTokenCookie(res: Response, token: string): void {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/',
  });
}

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof registerSchema>;
      const user = await createUser(email, password);
      const token = issueToken(user.id, user.email);
      setTokenCookie(res, token);

      res.status(201).json({
        success: true,
        data: { user: { id: user.id, email: user.email, created_at: user.created_at } },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const user = await findUserByEmail(email);
      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        throw new AppError(401, 'Invalid email or password');
      }

      const token = issueToken(user.id, user.email);
      setTokenCookie(res, token);

      res.json({
        success: true,
        data: { user: { id: user.id, email: user.email, created_at: user.created_at } },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/logout',
  (_req: Request, res: Response): void => {
    res.clearCookie('access_token', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  },
);

router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const user = await findUserById(sub);
      if (!user) {
        throw new AppError(404, 'User not found');
      }
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
