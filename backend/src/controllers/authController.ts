import { Request, Response } from 'express';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { generateToken, verifyToken, hashPassword, verifyPassword } from '../utils/auth';

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, businessName } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || !normalizedEmail || typeof password !== 'string') {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }
    if (normalizedName.length > 100 || normalizedEmail.length > 254 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      res.status(400).json({ error: 'Enter a valid name and email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists with this email.' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = new User({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });

    await user.save();
    if (typeof businessName === 'string' && businessName.trim()) {
      await Profile.create({ userId: user._id, displayName: normalizedName, businessName: businessName.trim().slice(0, 120) });
    }

    res.cookie('token', generateToken(user._id.toString()), authCookieOptions());

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscription?.plan || 'FREE',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'This account is unavailable.' });
      return;
    }

    res.cookie('token', generateToken(user._id.toString()), authCookieOptions());

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscription?.plan || 'FREE',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token', authCookieOptions());
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      res.status(401).json({ isAuthenticated: false });
      return;
    }

    const decoded = verifyToken(token) as { userId: string } | null;
    if (!decoded?.userId) {
      res.status(401).json({ isAuthenticated: false });
      return;
    }
    const user = await User.findById(decoded.userId).select('-passwordHash -googleDriveTokens');

    if (!user || user.status !== 'active') {
      res.status(401).json({ isAuthenticated: false });
      return;
    }

    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscription?.plan || 'FREE',
        hasGoogleDriveLinked: !!user.googleDriveTokens,
      },
    });
  } catch (error) {
    res.status(401).json({ isAuthenticated: false });
  }
};
