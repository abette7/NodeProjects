const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve images directory under /images
app.use('/images', express.static(path.join(__dirname, 'Images')));

// Helper to list directories
async function listDirectories(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(d => d.name);
  } catch (err) {
    return [];
  }
}

// API: list available sets (subfolders of Images/Styles)
app.get('/api/sets', async (req, res) => {
  const stylesPath = path.join(__dirname, 'Images', 'Styles');
  const sets = await listDirectories(stylesPath);
  res.json(sets);
});

// API: list images for a set (swatches + mapping to rooms)
app.get('/api/sets/:setName/images', async (req, res) => {
  const { setName } = req.params;
  const swatchesPath = path.join(__dirname, 'Images', 'Styles', setName, 'Swatches');
  const roomsPath = path.join(__dirname, 'Images', 'Styles', setName, 'Rooms');

  try {
    // Read swatches and rooms once
    const swatchEntries = await fs.readdir(swatchesPath, { withFileTypes: true });
    const roomEntries = await fs.readdir(roomsPath, { withFileTypes: true }).catch(()=>[]);

    const roomFiles = roomEntries.filter(e => e.isFile()).map(e => e.name);

    // Build a map keyed by the filename without extension and extra suffixes
    const roomMap = new Map();
    function getBaseKey(filename){
      // Get everything before .jpg (or other extension)
      const withoutExt = filename.split('.')[0].toLowerCase();
      return withoutExt;
    }
    for(const rn of roomFiles){
      const k = getBaseKey(rn);
      roomMap.set(k, rn);
    }

    const images = [];
    for (const f of swatchEntries) {
      if (!f.isFile()) continue;
      const name = f.name;
      const swatchUrl = path.posix.join('/images', 'Styles', setName, 'Swatches', name);

      // Find room file whose first-two segments match the swatch's first-two segments
      // Get base key from swatch (without extension)
      const swKey = getBaseKey(name);
      
      // Find matching room by trying the exact base name first
      let matchedRoomName = roomMap.get(swKey);
      
      // If no exact match, look for a room that starts with the swatch name
      if (!matchedRoomName) {
        for (const [roomKey, roomName] of roomMap.entries()) {
          if (roomKey.startsWith(swKey)) {
            matchedRoomName = roomName;
            break;
          }
        }
      }
      
      const roomUrl = matchedRoomName
        ? path.posix.join('/images', 'Styles', setName, 'Rooms', matchedRoomName)
        : swatchUrl; // fallback to swatch if no match

      images.push({ name, swatch: swatchUrl, room: roomUrl });
    }
    res.json(images);
  } catch (err) {
    res.status(404).json({ error: 'Set not found or no swatches' });
  }
});

// Fallback to index.html for SPA routes (use app.use to avoid path-to-regexp parsing issues)
app.use((req, res) => {
  // If request looks like an API or static image request, let it 404 normally
  if (req.path.startsWith('/api/') || req.path.startsWith('/images/')) {
    return res.status(404).end();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
