import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Client } from '../models/Client';

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await Client.find({ photographerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching clients' });
  }
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, notes } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }

    const existingClient = await Client.findOne({ photographerId: req.user._id, email: email.toLowerCase() });
    if (existingClient) {
      res.status(409).json({ error: 'Client with this email already exists.' });
      return;
    }

    const newClient = new Client({
      photographerId: req.user._id,
      name,
      email: email.toLowerCase(),
      phone,
      notes,
    });

    await newClient.save();
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Error creating client' });
  }
};
