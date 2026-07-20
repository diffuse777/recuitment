import express from 'express';
import {
  getOrCreateSettings,
  buildPublicPayload,
  resolveEffectiveStatus,
  STATUS_LABELS,
} from '../utils/recruitmentWindow.js';
import { RECRUITMENT_STATUSES } from '../models/RecruitmentSettings.js';

const router = express.Router();

// Public — landing page / apply gate
router.get('/status', async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(buildPublicPayload(settings));
  } catch (error) {
    console.error('Recruitment status error:', error);
    res.status(500).json({ message: 'Failed to load recruitment status.' });
  }
});

// Admin — full settings
router.get('/settings', async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const payload = buildPublicPayload(settings);
    res.json({
      settings: {
        opensAt: payload.opensAt,
        closesAt: payload.closesAt,
        status: settings.status,
        statusLabel: STATUS_LABELS[settings.status] || STATUS_LABELS.not_started,
        effectiveStatus: payload.effectiveStatus,
        effectiveStatusLabel: payload.statusLabel,
        updatedAt: settings.updatedAt,
      },
      statusOptions: RECRUITMENT_STATUSES.map((value) => ({
        value,
        label: STATUS_LABELS[value],
      })),
    });
  } catch (error) {
    console.error('Recruitment settings get error:', error);
    res.status(500).json({ message: 'Failed to load recruitment settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { opensAt, closesAt, status } = req.body;

    if (!RECRUITMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Use not_started, open, or closed.',
      });
    }

    const openDate = opensAt ? new Date(opensAt) : null;
    const closeDate = closesAt ? new Date(closesAt) : null;

    if (opensAt && Number.isNaN(openDate.getTime())) {
      return res.status(400).json({ message: 'Invalid application opening date/time.' });
    }
    if (closesAt && Number.isNaN(closeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid application closing date/time.' });
    }
    if (openDate && closeDate && closeDate.getTime() <= openDate.getTime()) {
      return res.status(400).json({
        message: 'Closing date/time must be after the opening date/time.',
      });
    }

    const settings = await getOrCreateSettings();
    settings.opensAt = openDate;
    settings.closesAt = closeDate;
    settings.status = status;
    await settings.save();

    // If deadline already passed, keep stored status as closed for clarity
    const effective = resolveEffectiveStatus(settings);
    if (effective === 'closed' && settings.status !== 'closed') {
      settings.status = 'closed';
      await settings.save();
    }

    const payload = buildPublicPayload(settings);
    res.json({
      message: 'Recruitment settings updated.',
      settings: {
        opensAt: payload.opensAt,
        closesAt: payload.closesAt,
        status: settings.status,
        statusLabel: STATUS_LABELS[settings.status],
        effectiveStatus: payload.effectiveStatus,
        effectiveStatusLabel: payload.statusLabel,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Recruitment settings update error:', error);
    res.status(500).json({ message: 'Failed to update recruitment settings.' });
  }
});

export default router;
