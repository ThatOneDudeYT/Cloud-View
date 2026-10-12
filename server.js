const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Shared secret token so only your PC can upload screenshots
const API_SECRET = process.env.API_SECRET || "my-super-secret-key";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up storage for desktop monitor screenshots
const uploadsDir = path.join(__dirname, 'public', 'desktops');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // Expected field name: desktop-0.png, desktop-1.png, etc.
    const desktopIndex = req.body.index || '0';
    cb(null, `desktop-${desktopIndex}.png`);
  }
});
const upload = multer({ storage });

// Endpoint for your PC to push fresh desktop captures
app.post('/api/upload', (req, res, next) => {
  if (req.headers['x-api-key'] !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}, upload.single('screen'), (req, res) => {
  res.json({ success: true, file: req.file.filename, updated: Date.now() });
});

// List all saved desktops
app.get('/api/desktops', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read directory" });
    const pngs = files
      .filter(f => f.startsWith('desktop-') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
      });
    res.json({ desktops: pngs });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});