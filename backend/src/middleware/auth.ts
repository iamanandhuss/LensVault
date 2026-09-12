import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any; // To hold user document
}

export const requireAuthentication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'No authentication token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token.' });
      return;
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
