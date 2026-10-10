import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { verifyToken } from '../utils/auth';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bearerToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token) as { userId?: string } | null;
    if (!decoded?.userId) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const user = await User.findById(decoded.userId).select('-passwordHash -googleDriveTokens');

    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
