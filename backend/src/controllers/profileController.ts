import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Profile } from '../models/Profile';
import { User } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    
    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = new Profile({
        userId: req.user._id,
        displayName: req.user.name,
        businessName: `${req.user.name} Photography`
      });
      await profile.save();
    }
    
    // Return both user account info and public profile info
    const user = await User.findById(req.user._id).select('-passwordHash -googleDriveTokens');
    
    res.status(200).json({ user, profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      displayName, businessName, bio, phone, website, 
      location, socialLinks, branding 
    } = req.body;

    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Only update allowed fields
    if (displayName) profile.displayName = displayName;
    if (businessName) profile.businessName = businessName;
    if (bio) profile.bio = bio;
    if (phone) profile.phone = phone;
    if (website) profile.website = website;
    if (location) profile.location = { ...profile.location, ...location };
    if (socialLinks) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
    if (branding) profile.branding = { ...profile.branding, ...branding };

    await profile.save();
    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { imageBase64, type } = req.body; // type = 'profile' or 'logo'

    if (!imageBase64 || !type) {
      res.status(400).json({ error: 'Image and type are required' });
      return;
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
       res.status(500).json({ error: 'Cloudinary is not configured on the server. Please add API keys to .env' });
       return;
    }

    // Upload to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: `lensvault/${req.user._id}/${type}`,
      width: type === 'logo' ? 600 : 800,
      crop: 'limit',
    });

    // Update profile
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
       profile = new Profile({ userId: req.user._id });
    }

    if (type === 'profile') {
      profile.profileImage = uploadResponse.secure_url;
    } else if (type === 'logo') {
      profile.logo = uploadResponse.secure_url;
    }

    await profile.save();

    res.status(200).json({ 
      message: 'Image uploaded successfully', 
      url: uploadResponse.secure_url,
      profile 
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
};
