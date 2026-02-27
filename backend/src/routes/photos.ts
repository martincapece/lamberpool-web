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

// GET all photos for a match
router.get('/:matchId', async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { matchId: req.params.matchId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// POST upload photo from base64 to Cloudinary
router.post('/upload', async (req, res) => {
  try {
    const { matchId, imageBase64, photoType } = req.body;

    if (!matchId || !imageBase64) {
      return res.status(400).json({ error: 'matchId and imageBase64 are required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: 'lamberpool/matches',
      resource_type: 'auto',
      quality: 'auto',
    });

    // Save photo record to DB
    const photo = await prisma.photo.create({
      data: {
        matchId,
        url: result.secure_url,
        cloudinaryId: result.public_id,
      },
    });

    console.log('✅ Photo uploaded to Cloudinary:', result.public_id);

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

// POST create photo record (without upload - for manual URLs)
router.post('/', async (req, res) => {
  try {
    const { matchId, url, cloudinaryId } = req.body;

    if (!matchId || !url) {
      return res.status(400).json({ error: 'matchId and url are required' });
    }

    const photo = await prisma.photo.create({
      data: {
        matchId,
        url,
        cloudinaryId,
      },
    });

    res.status(201).json(photo);
  } catch (error: any) {
    console.error('Error creating photo:', error);
    res.status(500).json({ error: 'Failed to create photo' });
  }
});

// DELETE photo (removes from Cloudinary and DB)
router.delete('/:id', async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: req.params.id },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from Cloudinary if cloudinaryId exists
    if (photo.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(photo.cloudinaryId);
        console.log('✅ Photo deleted from Cloudinary:', photo.cloudinaryId);
      } catch (cloudError) {
        console.error('Warning: Failed to delete from Cloudinary:', cloudError);
      }
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: req.params.id },
    });

    console.log('✅ Photo deleted from database:', req.params.id);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;

