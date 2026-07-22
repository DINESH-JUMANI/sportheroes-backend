import multer from 'multer';
import { BadRequestError } from '../utils/errors';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new BadRequestError('Unsupported image type. Use jpeg, png, webp, or gif'));
      return;
    }
    cb(null, true);
  },
});
