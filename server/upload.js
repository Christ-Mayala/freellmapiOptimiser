// Simple Express server for file uploads
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow requests from client dev server

const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Respond with basic file info
  res.json({
    id: req.file.filename,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    path: req.file.path,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Upload server listening on port ${PORT}`);
});
