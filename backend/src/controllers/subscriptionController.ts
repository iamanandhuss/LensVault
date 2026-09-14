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
  try {
    const { plan } = req.body;
    
    // In a real production app, this is where we'd verify a Stripe/Razorpay Webhook signature
    // or create a Checkout Session. For the MVP, we will simulate a successful upgrade.

    const validPlans = ['Free', 'Starter', 'Pro', 'Studio'];
    if (!validPlans.includes(plan)) {
      res.status(400).json({ error: 'Invalid subscription plan.' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { subscriptionPlan: plan },
      { new: true }
    );

    res.status(200).json({ 
      message: `Successfully upgraded to ${plan}`,
      plan: updatedUser?.subscriptionPlan 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};
