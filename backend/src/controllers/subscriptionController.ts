import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('subscription.plan');
    res.status(200).json({ plan: user?.subscription?.plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

export const upgradeSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(503).json({ error: 'Paid subscriptions are not available until a payment provider is configured.' });
};
