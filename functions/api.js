const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

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

// Try to load photos from photos.json
try {
  console.log('Attempting to load photos from photos.json');
  const photosPath = path.join(__dirname, '../data/photos.json');
  
  if (fs.existsSync(photosPath)) {
    const photosData = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
    if (photosData && photosData.photos && Array.isArray(photosData.photos)) {
      db.photos = photosData.photos;
      console.log(`Loaded ${db.photos.length} photos from photos.json`);
    }
  } else {
    console.log('photos.json does not exist yet');
  }
} catch (error) {
  console.error('Error loading photos from photos.json:', error);
}

// If no photos were loaded, use sample photos
if (db.photos.length === 0) {
  console.log('No photos found in photos.json, using sample photos');
  db.photos = [
    {
      id: 'sample1',
      src: '/images/1.jpeg',
      title: 'Our First Date',
      date: '2025-06-21',
      description: 'A beautiful memory together',
      timestamp: Date.now()
    },
    {
      id: 'sample2',
      src: '/images/2.jpeg',
      title: 'Together Forever',
      date: '2025-07-15',
      description: 'Making memories that last a lifetime',
      timestamp: Date.now()
    },
    {
      id: 'sample3',
      src: '/images/3.jpeg',
      title: 'Choco Love',
      date: '2025-08-20',
      description: 'Every moment with you is special',
      timestamp: Date.now()
    }
  ];
  
  // Save sample photos to photos.json
  try {
    const photosPath = path.join(__dirname, '../data/photos.json');
    const photosData = { photos: db.photos };
    fs.writeFileSync(photosPath, JSON.stringify(photosData, null, 2));
    console.log('Saved sample photos to photos.json');
  } catch (fileError) {
    console.error('Error saving sample photos to photos.json:', fileError);
  }
}

// Log that we've added the sample photos
console.log('Added 3 sample photos from public/images directory');

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
    console.log('Received photo upload request');
    const photoData = req.body;
    
    // Check if we have a base64 image
    if (photoData.src && photoData.src.startsWith('data:')) {
      console.log('Valid base64 image received');
      
      // Create new photo object
      const newPhoto = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        src: photoData.src, // Keep the base64 data
        title: photoData.title || 'Our Special Moment',
        date: photoData.date || new Date().toISOString().split('T')[0],
        description: photoData.description || '',
        timestamp: Date.now()
      };
      
      // Add to our in-memory database
      db.photos.push(newPhoto);
      
      // Try to save to photos.json file
      try {
        // Get the path to photos.json
        const photosPath = path.join(__dirname, '../data/photos.json');
        
        // Create a photos object with our current photos
        const photosData = { photos: db.photos };
        
        // Write to the file
        fs.writeFileSync(photosPath, JSON.stringify(photosData, null, 2));
        console.log('Photos saved to photos.json');
      } catch (fileError) {
        console.error('Error saving to photos.json:', fileError);
        // Continue anyway since we have the photo in memory
      }
      
      console.log('Photo saved successfully');
      return res.status(201).json(newPhoto);
    } else {
      console.log('No valid image data provided');
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
  
  console.log('Updating photo with ID:', photoId, 'Updates:', updates);
  
  // Don't allow updating the src through this endpoint
  delete updates.src;
  
  // Find and update the photo
  const photoIndex = db.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex !== -1) {
    // Update the photo
    db.photos[photoIndex] = { ...db.photos[photoIndex], ...updates };
    
    // Try to save to photos.json file
    try {
      // Get the path to photos.json
      const photosPath = path.join(__dirname, '../data/photos.json');
      
      // Create a photos object with our current photos
      const photosData = { photos: db.photos };
      
      // Write to the file
      fs.writeFileSync(photosPath, JSON.stringify(photosData, null, 2));
      console.log('Updated photos.json after editing photo');
    } catch (fileError) {
      console.error('Error saving to photos.json after editing:', fileError);
      // Continue anyway since we've updated in memory
    }
    
    console.log('Photo updated successfully');
    res.json({ message: 'Photo updated successfully' });
  } else {
    console.log('Photo not found for update:', photoId);
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Delete a photo
app.delete('/photos/:id', async (req, res) => {
  const photoId = req.params.id;
  
  console.log('Deleting photo with ID:', photoId);
  
  // Find the photo
  const photoIndex = db.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex !== -1) {
    const photo = db.photos[photoIndex];
    
    // Remove from our database
    db.photos.splice(photoIndex, 1);
    
    // Try to save to photos.json file
    try {
      // Get the path to photos.json
      const photosPath = path.join(__dirname, '../data/photos.json');
      
      // Create a photos object with our current photos
      const photosData = { photos: db.photos };
      
      // Write to the file
      fs.writeFileSync(photosPath, JSON.stringify(photosData, null, 2));
      console.log('Updated photos.json after deletion');
    } catch (fileError) {
      console.error('Error saving to photos.json after deletion:', fileError);
      // Continue anyway since we've removed from memory
    }
    
    console.log('Photo deleted successfully');
    res.json({ message: 'Photo deleted successfully' });
  } else {
    console.log('Photo not found for deletion:', photoId);
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
