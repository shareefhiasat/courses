import prisma from '../db/prismaClient.js';
import { info, error } from '../utils/common/logger.js';

const serviceName = 'welcomeController';

export const getWelcomePreferences = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const pref = await prisma.userPreferences.findUnique({
      where: { userId },
    }).catch(() => null);

    const settings = pref?.settings || {};
    return res.json({
      success: true,
      data: {
        preferredMode: settings.welcomePreferredMode || null,
      },
    });
  } catch (err) {
    error(`${serviceName}:getWelcomePreferences:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
};

export const updateWelcomePreferences = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { preferredMode } = req.body;
    if (preferredMode && !['quick', 'normal'].includes(preferredMode)) {
      return res.status(400).json({ success: false, error: 'Invalid preferredMode' });
    }

    const existing = await prisma.userPreferences.findUnique({
      where: { userId },
    }).catch(() => null);

    const currentSettings = existing?.settings || {};
    const newSettings = { ...currentSettings, welcomePreferredMode: preferredMode };

    if (existing) {
      await prisma.userPreferences.update({
        where: { userId },
        data: { settings: newSettings },
      });
    } else {
      await prisma.userPreferences.create({
        data: { userId, settings: newSettings },
      });
    }

    return res.json({ success: true, data: { preferredMode } });
  } catch (err) {
    error(`${serviceName}:updateWelcomePreferences:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to save preferences' });
  }
};

export default {
  getWelcomePreferences,
  updateWelcomePreferences,
};
