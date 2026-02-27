import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../lib/prisma';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST upload photo to Cloudinary and save URL to DB
router.post('/upload', async (req, res) => {
  try {
    const { matchId, imageBase64 } = req.body;

    if (!matchId || !imageBase64) {
      return res.status(400).json({ error: 'matchId and imageBase64 are required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: 'lamberpool',
      resource_type: 'auto',
    });

    // Save photo record to DB
    const photo = await prisma.photo.create({
      data: {
        matchId,
        url: result.secure_url,
        cloudinaryId: result.public_id,
      },
    });

    res.status(201).json({
      success: true,
      photo,
      cloudinaryUrl: result.secure_url,
    });
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo to Cloudinary' });
  }
});
router.get('/:matchId', async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { matchId: req.params.matchId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// POST add photo to match
router.post('/', async (req, res) => {
  try {
    const { matchId, url, cloudinaryId } = req.body;

    console.log('📸 Photo upload request received');
    console.log('matchId:', matchId);
    console.log('url type:', typeof url);
    console.log('url length (MB):', (url?.length || 0) / (1024 * 1024));

    if (!matchId || !url) {
      console.error('❌ Missing matchId or url');
      return res.status(400).json({ error: 'matchId and url are required' });
    }

    if (typeof url !== 'string') {
      console.error('❌ url is not a string:', typeof url);
      return res.status(400).json({ error: 'url must be a string' });
    }

    if (url.length > 5 * 1024 * 1024) {
      console.error('❌ url too large:', url.length, 'bytes');
      return res.status(413).json({ error: 'Image too large (max 5MB)' });
    }

    console.log('✅ Validation passed, creating photo record...');

    const photo = await prisma.photo.create({
      data: {
        matchId,
        url,
        cloudinaryId,
      },
    });

    console.log('✅ Photo record created:', photo.id);
    res.status(201).json(photo);
  } catch (error: any) {
    console.error('❌ Photo upload error:');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    if (error.code === 'P2003') {
      console.error('❌ Match not found (P2003)');
      return res.status(400).json({ error: 'Match not found' });
    }

    if (error.code === 'P2028') {
      console.error('❌ Transaction error (P2028)');
      return res.status(500).json({ error: 'Transaction error - try again' });
    }

    res.status(500).json({ error: error.message || 'Failed to add photo' });
  }
});

// DELETE photo
router.delete('/:id', async (req, res) => {
  try {
    const photo = await prisma.photo.delete({
      where: { id: req.params.id },
    });

    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
