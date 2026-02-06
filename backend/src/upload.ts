import express from 'express';
import multer from 'multer';
import { imageSize } from 'image-size';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });
const router = express.Router();

// Default required size
const REQUIRED_WIDTH = 1080;
const REQUIRED_HEIGHT = 1080;

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  try {
    const buffer = fs.readFileSync(req.file.path);
    const metadata = imageSize(buffer);
    if (metadata.width !== REQUIRED_WIDTH || metadata.height !== REQUIRED_HEIGHT) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Image must be ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}` });
    }
    res.json({ url: `/uploads/${path.basename(req.file.path)}` });
  } catch (err) {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

export default router;
