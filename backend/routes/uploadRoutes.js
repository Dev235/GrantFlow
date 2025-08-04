// backend/routes/uploadRoutes.js
const path = require('path');
const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Multer Configuration for Secure File Uploads ---

// 1. Storage Configuration: Define where and how files should be saved.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Files will be saved in the 'uploads/' directory.
    // Ensure this directory exists at the root of your backend folder.
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // To avoid filename conflicts, we create a unique filename.
    // It combines the fieldname, the current timestamp, and the original file extension.
    // e.g., 'file-1678886400000.jpg'
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// 2. File Type Validation: A function to check if the uploaded file is an allowed type.
function checkFileType(file, cb) {
  // Define allowed file extensions.
  const filetypes = /jpeg|jpg|png|pdf/;
  // Check the file's extension.
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the file's MIME type.
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    // If both extension and MIME type are valid, allow the upload.
    return cb(null, true);
  } else {
    // If not, reject the file with an error message.
    cb('Error: Images and PDFs Only!');
  }
}

// 3. Initialize Multer Middleware with the defined storage, limits, and file filter.
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit for security
  },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

// --- API Endpoint for File Upload ---
// @route   POST /api/upload
// @desc    Upload a file
// @access  Private (requires user to be logged in)
router.post('/', protect, upload.single('file'), (req, res) => {
  // If multer processing is successful, req.file will contain file information.
  if (!req.file) {
    return res.status(400).json({ message: 'Please select a file to upload.' });
  }

  // We send back the path to the uploaded file.
  // The path is constructed to be a URL-friendly format.
  // e.g., "/uploads/file-1678886400000.jpg"
  res.status(201).json({
    message: 'File uploaded successfully',
    filePath: `/${req.file.path.replace(/\\/g, "/")}`, // Normalize path for web
  });
});

module.exports = router;
