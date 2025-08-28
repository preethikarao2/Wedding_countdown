const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// In-memory database for serverless environment
const db = {
  photos: [],
  journal: [],
  subscriptions: []
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
// Get all photos
app.get('/photos', (req, res) => {
  res.json(db.photos);
});

// Add a new photo
app.post('/photos', async (req, res) => {
  try {
    const photoData = req.body;
    
    // Check if we have a base64 image to upload to Cloudinary
    if (photoData.src && photoData.src.startsWith('data:')) {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(photoData.src, {
        folder: 'wedding_countdown_app',
        resource_type: 'image'
      });
      
      // Create new photo object with Cloudinary URL
      const newPhoto = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        src: uploadResult.secure_url,
        cloudinary_id: uploadResult.public_id,
        title: photoData.title || 'Our Special Moment',
        date: photoData.date || new Date().toISOString().split('T')[0],
        description: photoData.description || '',
        timestamp: Date.now()
      };
      
      // Add to our in-memory database
      db.photos.push(newPhoto);
      
      res.status(201).json(newPhoto);
    } else {
      res.status(400).json({ error: 'No valid image data provided' });
    }
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo: ' + error.message });
  }
});

// Update a photo
app.put('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const updates = req.body;
  
  // Don't allow updating the src through this endpoint
  delete updates.src;
  
  // Find and update the photo
  const photoIndex = db.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex !== -1) {
    // Update the photo
    db.photos[photoIndex] = { ...db.photos[photoIndex], ...updates };
    res.json({ message: 'Photo updated successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Delete a photo
app.delete('/photos/:id', async (req, res) => {
  const photoId = req.params.id;
  
  // Find the photo
  const photoIndex = db.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex !== -1) {
    const photo = db.photos[photoIndex];
    
    // If it has a Cloudinary ID, delete from Cloudinary
    if (photo.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(photo.cloudinary_id);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue anyway to remove from our database
      }
    }
    
    // Remove from our database
    db.photos.splice(photoIndex, 1);
    res.json({ message: 'Photo deleted successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Journal API endpoints
app.get('/journal', (req, res) => {
  res.json(db.journal);
});

app.post('/journal', (req, res) => {
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    ...req.body,
    timestamp: Date.now()
  };
  db.journal.push(newEntry);
  res.status(201).json(newEntry);
});

// Journal entry update
app.put('/journal/:id', (req, res) => {
  const entryId = req.params.id;
  const updates = req.body;
  
  const entryIndex = db.journal.findIndex(entry => entry.id === entryId);
  if (entryIndex !== -1) {
    db.journal[entryIndex] = { ...db.journal[entryIndex], ...updates };
    res.json({ message: 'Journal entry updated successfully' });
  } else {
    res.status(404).json({ error: 'Journal entry not found' });
  }
});

// Journal entry delete
app.delete('/journal/:id', (req, res) => {
  const entryId = req.params.id;
  
  const entryIndex = db.journal.findIndex(entry => entry.id === entryId);
  if (entryIndex !== -1) {
    db.journal.splice(entryIndex, 1);
    res.json({ message: 'Journal entry deleted successfully' });
  } else {
    res.status(404).json({ error: 'Journal entry not found' });
  }
});

// Subscription endpoints
app.post('/subscribe', (req, res) => {
  const subscription = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    ...req.body,
    timestamp: Date.now()
  };
  db.subscriptions.push(subscription);
  res.status(201).json({ message: 'Subscription added successfully!' });
});

// Export the serverless function
module.exports.handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});
