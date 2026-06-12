import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import type { AuthTokenPayload } from '../types/shared.js';

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token =
    req.cookies?.access_token as string | undefined ??
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err) {
    logger.debug({ err }, 'JWT verification failed');
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
