const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { journalDb, subscriptionDb, photoDb } = require('../src/db');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
// Get all photos
app.get('/photos', (req, res) => {
  const photos = photoDb.getAllPhotos();
  res.json(photos);
});

// Add a new photo
app.post('/photos', (req, res) => {
  try {
    const photoData = req.body;
    const newPhoto = photoDb.addPhoto(photoData);
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Update a photo
app.put('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const updates = req.body;
  
  // Don't allow updating the src through this endpoint
  delete updates.src;
  
  const success = photoDb.updatePhoto(photoId, updates);
  if (success) {
    res.json({ message: 'Photo updated successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Delete a photo
app.delete('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const success = photoDb.deletePhoto(photoId);
  if (success) {
    res.json({ message: 'Photo deleted successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Journal API endpoints
app.get('/journal', (req, res) => {
  const entries = journalDb.getAllEntries();
  res.json(entries);
});

app.post('/journal', (req, res) => {
  const entry = journalDb.addEntry(req.body);
  res.status(201).json(entry);
});

// Subscription endpoints
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptionDb.addSubscription(subscription);
  res.status(201).json({ message: 'Subscription added successfully!' });
});

// Export the serverless function
module.exports.handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});
