// Simple JSON file database for wedding countdown app
const fs = require('fs');
const path = require('path');

// Database file paths
const DB_DIR = path.join(__dirname, '../data');
const JOURNAL_DB = path.join(DB_DIR, 'journal.json');
const SUBSCRIPTIONS_DB = path.join(DB_DIR, 'subscriptions.json');
const PHOTOS_DB = path.join(DB_DIR, 'photos.json');
const PHOTOS_DIR = path.join(DB_DIR, 'photos');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log('Created data directory');
}

// Ensure photos directory exists
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  console.log('Created photos directory');
}

// Initialize database files if they don't exist
function initDatabases() {
  if (!fs.existsSync(JOURNAL_DB)) {
    fs.writeFileSync(JOURNAL_DB, JSON.stringify({ entries: [] }));
    console.log('Created journal database');
  }
  
  if (!fs.existsSync(SUBSCRIPTIONS_DB)) {
    fs.writeFileSync(SUBSCRIPTIONS_DB, JSON.stringify({ 
      emailSubscriptions: [],
      pushSubscriptions: []
    }));
    console.log('Created subscriptions database');
  }
  
  if (!fs.existsSync(PHOTOS_DB)) {
    fs.writeFileSync(PHOTOS_DB, JSON.stringify({ photos: [] }));
    console.log('Created photos database');
  }
}

// Journal database functions
const journalDb = {
  // Get all journal entries
  getAllEntries: () => {
    try {
      const data = fs.readFileSync(JOURNAL_DB, 'utf8');
      return JSON.parse(data).entries;
    } catch (error) {
      console.error('Error reading journal database:', error);
      return [];
    }
  },
  
  // Add a new journal entry
  addEntry: (entry) => {
    try {
      const data = fs.readFileSync(JOURNAL_DB, 'utf8');
      const journal = JSON.parse(data);
      
      // Add new entry
      journal.entries.unshift(entry);
      
      // Save to file
      fs.writeFileSync(JOURNAL_DB, JSON.stringify(journal, null, 2));
      return true;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      return false;
    }
  },
  
  // Delete a journal entry
  deleteEntry: (entryId) => {
    try {
      const data = fs.readFileSync(JOURNAL_DB, 'utf8');
      const journal = JSON.parse(data);
      
      // Filter out the entry to delete
      journal.entries = journal.entries.filter(entry => entry.id !== entryId);
      
      // Save to file
      fs.writeFileSync(JOURNAL_DB, JSON.stringify(journal, null, 2));
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }
  },
  
  // Get entries for a specific user
  getUserEntries: (userEmail) => {
    try {
      const data = fs.readFileSync(JOURNAL_DB, 'utf8');
      const journal = JSON.parse(data);
      
      // Return entries created by this user or shared with them
      return journal.entries.filter(entry => 
        entry.authorEmail === userEmail || 
        (entry.visibility && entry.partnerEmail === userEmail)
      );
    } catch (error) {
      console.error('Error getting user entries:', error);
      return [];
    }
  }
};

// Subscription database functions
const subscriptionDb = {
  // Get all email subscriptions
  getEmailSubscriptions: () => {
    try {
      const data = fs.readFileSync(SUBSCRIPTIONS_DB, 'utf8');
      return JSON.parse(data).emailSubscriptions;
    } catch (error) {
      console.error('Error reading email subscriptions:', error);
      return [];
    }
  },
  
  // Add a new email subscription
  addEmailSubscription: (subscription) => {
    try {
      const data = fs.readFileSync(SUBSCRIPTIONS_DB, 'utf8');
      const subscriptions = JSON.parse(data);
      
      // Check if subscription already exists
      const exists = subscriptions.emailSubscriptions.some(
        sub => sub.email === subscription.email
      );
      
      if (!exists) {
        // Add new subscription
        subscriptions.emailSubscriptions.push(subscription);
        
        // Save to file
        fs.writeFileSync(SUBSCRIPTIONS_DB, JSON.stringify(subscriptions, null, 2));
      }
      
      return !exists; // Return true if added, false if already existed
    } catch (error) {
      console.error('Error adding email subscription:', error);
      return false;
    }
  },
  
  // Get all push subscriptions
  getPushSubscriptions: () => {
    try {
      const data = fs.readFileSync(SUBSCRIPTIONS_DB, 'utf8');
      return JSON.parse(data).pushSubscriptions;
    } catch (error) {
      console.error('Error reading push subscriptions:', error);
      return [];
    }
  },
  
  // Add a new push subscription
  addPushSubscription: (subscription) => {
    try {
      const data = fs.readFileSync(SUBSCRIPTIONS_DB, 'utf8');
      const subscriptions = JSON.parse(data);
      
      // Add new subscription (no need to check for duplicates as they have unique endpoints)
      subscriptions.pushSubscriptions.push(subscription);
      
      // Save to file
      fs.writeFileSync(SUBSCRIPTIONS_DB, JSON.stringify(subscriptions, null, 2));
      return true;
    } catch (error) {
      console.error('Error adding push subscription:', error);
      return false;
    }
  }
};

// Initialize databases on module load
initDatabases();

// Photo database functions
const photoDb = {
  // Get all photos
  getAllPhotos: () => {
    try {
      const data = fs.readFileSync(PHOTOS_DB, 'utf8');
      return JSON.parse(data).photos;
    } catch (error) {
      console.error('Error reading photos database:', error);
      return [];
    }
  },
  
  // Add a new photo
  addPhoto: (photoData) => {
    try {
      // Generate unique ID for the photo
      const photoId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // If photo contains base64 image data
      if (photoData.src && photoData.src.startsWith('data:image')) {
        // Extract the base64 data and file extension
        const matches = photoData.src.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1];
          const base64Data = matches[2];
          const fileName = `${photoId}.${fileExt}`;
          const filePath = path.join(PHOTOS_DIR, fileName);
          
          // Save the image file
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          
          // Update the src to point to the file path
          photoData.src = `/photos/${fileName}`;
        }
      }
      
      // Add ID and timestamp
      const newPhoto = {
        id: photoId,
        ...photoData,
        timestamp: Date.now()
      };
      
      // Read current photos
      const data = fs.readFileSync(PHOTOS_DB, 'utf8');
      const photosData = JSON.parse(data);
      
      // Add new photo
      photosData.photos.push(newPhoto);
      
      // Save to file
      fs.writeFileSync(PHOTOS_DB, JSON.stringify(photosData, null, 2));
      return newPhoto;
    } catch (error) {
      console.error('Error adding photo:', error);
      return null;
    }
  },
  
  // Update a photo
  updatePhoto: (photoId, updates) => {
    try {
      const data = fs.readFileSync(PHOTOS_DB, 'utf8');
      const photosData = JSON.parse(data);
      
      // Find and update the photo
      const photoIndex = photosData.photos.findIndex(photo => photo.id === photoId);
      if (photoIndex === -1) return false;
      
      // Apply updates
      photosData.photos[photoIndex] = {
        ...photosData.photos[photoIndex],
        ...updates,
        lastModified: Date.now()
      };
      
      // Save to file
      fs.writeFileSync(PHOTOS_DB, JSON.stringify(photosData, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating photo:', error);
      return false;
    }
  },
  
  // Delete a photo
  deletePhoto: (photoId) => {
    try {
      const data = fs.readFileSync(PHOTOS_DB, 'utf8');
      const photosData = JSON.parse(data);
      
      // Find the photo to delete
      const photoToDelete = photosData.photos.find(photo => photo.id === photoId);
      if (!photoToDelete) return false;
      
      // If photo has a file path, delete the file
      if (photoToDelete.src && photoToDelete.src.startsWith('/photos/')) {
        const fileName = photoToDelete.src.split('/').pop();
        const filePath = path.join(PHOTOS_DIR, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Remove from array
      photosData.photos = photosData.photos.filter(photo => photo.id !== photoId);
      
      // Save to file
      fs.writeFileSync(PHOTOS_DB, JSON.stringify(photosData, null, 2));
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }
};

module.exports = {
  initDatabases,
  journalDb,
  subscriptionDb,
  photoDb
};
