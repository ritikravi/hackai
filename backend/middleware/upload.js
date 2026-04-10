const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Cloudinary in production, local disk in development
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'hackai-resumes',
      allowed_formats: ['pdf'],
      resource_type: 'raw',
      public_id: (req) => `${req.user.id}-${Date.now()}`,
    },
  });

  module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
} else {
  // Local disk storage for development
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  };

  module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}
