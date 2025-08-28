const express = require('express');
const path = require('path');
const cors = require('cors');
const webpush = require('web-push');
const schedule = require('node-schedule');
const fs = require('fs');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { journalDb, subscriptionDb, photoDb } = require('./db');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Serve photos from data directory
app.use('/photos', express.static(path.join(__dirname, '../data/photos')));

// If VAPID keys don't exist in .env, generate them
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log('VAPID keys not found in .env, generating new keys...');
  const vapidKeys = webpush.generateVAPIDKeys();
  
  // Create or update .env file with the keys
  const envContent = `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
PORT=3000`;
  
  fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
  
  // Load the newly created environment variables
  dotenv.config();
  console.log('New VAPID keys generated and saved to .env file');
}

// Set VAPID details
webpush.setVapidDetails(
  'mailto:gujjulapreethika2000@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions and emails (in a real app, you'd use a database)
const subscriptions = [];
const emailSubscriptions = [];

// Wedding and engagement dates
const WEDDING_DATE = new Date('2025-11-01');
const ENGAGEMENT_DATE = new Date('2025-10-16');

// Sweet messages for notifications
const sweetMessages = [
  "Every day brings us closer to forever together!",
  "Can't wait to spend the rest of my life with you!",
  "Counting down the days until we say 'I do'!",
  "Our love story is my favorite!",
  "Forever won't be long enough with you!",
  "You're the best part of all my days!",
  "So excited for our big day!",
  "You make every day brighter!",
  "My heart is yours, forever and always!",
  "Building our future together, one day at a time!"
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  
  // Store the subscription
  subscriptions.push(subscription);
  
  // Send a welcome notification
  const payload = JSON.stringify({
    title: 'Wedding Countdown Started!',
    body: 'You will now receive daily sweet messages counting down to your special day!',
    icon: '/images/heart.png'
  });
  
  webpush.sendNotification(subscription, payload)
    .catch(err => console.error('Error sending notification:', err));
  
  res.status(201).json({ message: 'Subscription added successfully!' });
});

// Photo API endpoints
// Get all photos
app.get('/api/photos', (req, res) => {
  const photos = photoDb.getAllPhotos();
  res.json(photos);
});

// Add a new photo
app.post('/api/photos', upload.single('photo'), (req, res) => {
  try {
    // If file was uploaded through multer
    if (req.file) {
      const photoData = JSON.parse(req.body.photoData || '{}');
      photoData.src = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const newPhoto = photoDb.addPhoto(photoData);
      res.status(201).json(newPhoto);
    } 
    // If base64 data was sent directly
    else if (req.body.src) {
      const newPhoto = photoDb.addPhoto(req.body);
      res.status(201).json(newPhoto);
    } 
    else {
      res.status(400).json({ error: 'No photo data provided' });
    }
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Update a photo
app.put('/api/photos/:id', (req, res) => {
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
app.delete('/api/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const success = photoDb.deletePhoto(photoId);
  if (success) {
    res.json({ message: 'Photo deleted successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Function to calculate days remaining
function getDaysRemaining(targetDate) {
  const today = new Date();
  const timeDiff = targetDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Function to send daily notifications
function sendDailyNotifications() {
  const weddingDaysRemaining = getDaysRemaining(WEDDING_DATE);
  const engagementDaysRemaining = getDaysRemaining(ENGAGEMENT_DATE);
  
  // Choose a random sweet message
  const randomMessage = sweetMessages[Math.floor(Math.random() * sweetMessages.length)];
  
  let notificationText = randomMessage + '\n\n';
  
  // Add countdown information
  if (engagementDaysRemaining > 0) {
    notificationText += `${engagementDaysRemaining} days until your engagement! `;
  } else if (engagementDaysRemaining === 0) {
    notificationText += "Today is your engagement day! ";
  }
  
  if (weddingDaysRemaining > 0) {
    notificationText += `${weddingDaysRemaining} days until your wedding!`;
  } else if (weddingDaysRemaining === 0) {
    notificationText += "Today is your wedding day!";
  }
  
  const payload = JSON.stringify({
    title: 'Wedding Countdown ',
    body: notificationText,
    icon: '/images/heart.png'
  });
  
  // Send to all subscriptions
  subscriptions.forEach(subscription => {
    webpush.sendNotification(subscription, payload)
      .catch(err => {
        console.error('Error sending notification:', err);
        // Remove failed subscriptions
        const index = subscriptions.indexOf(subscription);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }
      });
  });
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set this in .env file
    pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Set this in .env file
  }
});

// Function to send email notifications
async function sendEmailNotifications() {
  if (emailSubscriptions.length === 0) {
    console.log('No email subscriptions found');
    return;
  }
  
  const today = new Date();
  const weddingDaysRemaining = getDaysRemaining(WEDDING_DATE);
  const engagementDaysRemaining = getDaysRemaining(ENGAGEMENT_DATE);
  
  // Get sweet message for today
  const sweetMessages = [
    'Every day with you is a blessing. Can\'t wait to spend forever together!',
    'Counting down the moments until we say "I do"!',
    'My heart beats for you more each day as we get closer to our special day.',
    'You are my today and all of my tomorrows.',
    'Forever won\'t be long enough with you.',
    'I fall in love with you more every day.',
    'You\'re the reason I believe in love.',
    'My favorite place in the world is next to you.',
    'I can\'t wait to marry my best friend!',
    'Every love story is beautiful, but ours is my favorite.',
    'You\'re the missing piece I\'ve been looking for.',
    'I never knew what love was until I met you.',
    'You make my heart smile.',
    'I\'m so lucky to have found you.',
    'You\'re my favorite hello and my hardest goodbye.',
  ];
  
  const randomIndex = Math.floor(Math.random() * sweetMessages.length);
  const todaysMessage = sweetMessages[randomIndex];
  
  // Create email content
  let notificationText = '';
  
  if (today > WEDDING_DATE) {
    const daysSinceWedding = Math.abs(weddingDaysRemaining);
    notificationText = `It's been ${daysSinceWedding} days since we said "I do"! ${todaysMessage}`;
  } else if (today > ENGAGEMENT_DATE && today < WEDDING_DATE) {
    notificationText = `${weddingDaysRemaining} days until our wedding! ${todaysMessage}`;
  } else {
    notificationText = `${engagementDaysRemaining} days until our engagement and ${weddingDaysRemaining} days until our wedding! ${todaysMessage}`;
  }
  
  // Email options
  const mailOptions = {
    from: '"Wedding Countdown" <' + (process.env.EMAIL_USER || 'your-email@gmail.com') + '>',
    subject: '❤️ Your Daily Wedding Countdown ❤️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f8bbd0; border-radius: 10px;">
        <h1 style="color: #e91e63; text-align: center;">Wedding Countdown</h1>
        <p style="font-size: 18px; color: #333; text-align: center;">${notificationText}</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://i.imgur.com/JFHjdNE.png" alt="Heart" style="width: 100px;">
        </div>
        <p style="text-align: center; color: #888; font-size: 14px;">With love, on the journey to forever ❤️</p>
      </div>
    `
  };
  
  // Send emails to all subscribers
  for (const subscription of emailSubscriptions) {
    try {
      mailOptions.to = subscription.email;
      await transporter.sendMail(mailOptions);
      console.log(`Email notification sent to ${subscription.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${subscription.email}:`, error);
    }
  }
}

// API endpoint to subscribe for email notifications
app.post('/api/subscribe-email', (req, res) => {
  const { yourEmail, partnerEmail } = req.body;
  
  // Validate emails
  if (!yourEmail || !partnerEmail) {
    return res.status(400).json({ success: false, error: 'Both email addresses are required' });
  }
  
  // Add to email subscriptions in memory
  emailSubscriptions.push({ yourEmail, partnerEmail });
  
  // Add to persistent database
  subscriptionDb.addEmailSubscription({ email: yourEmail, type: 'primary', date: new Date() });
  subscriptionDb.addEmailSubscription({ email: partnerEmail, type: 'partner', date: new Date() });
  
  // Send welcome emails
  const welcomeSubject = 'Welcome to Wedding Countdown!';  
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #ff6b6b;">Wedding Countdown Started!</h2>
      <p>Hello there!</p>
      <p>You've successfully subscribed to daily wedding countdown notifications.</p>
      <p>You'll receive sweet messages and countdown updates every morning at 8:00 AM.</p>
      <p>Your wedding date: <strong>${WEDDING_DATE.toDateString()}</strong></p>
      <p>Your engagement date: <strong>${ENGAGEMENT_DATE.toDateString()}</strong></p>
      <p>We're so excited to be part of your journey to forever!</p>
      <p>With love,<br>Wedding Countdown App</p>
    </div>
  `;
  
  // Send to both emails
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: yourEmail,
    subject: welcomeSubject,
    html: welcomeHtml
  });
  
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: partnerEmail,
    subject: welcomeSubject,
    html: welcomeHtml
  });
  
  res.status(200).json({ success: true, message: 'Email subscriptions added successfully' });
});

// Journal API endpoints

// Get all journal entries for a user
app.get('/api/journal/:email', (req, res) => {
  const userEmail = req.params.email;
  
  if (!userEmail) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  
  const entries = journalDb.getUserEntries(userEmail);
  res.json({ success: true, entries });
});

// Add a new journal entry
app.post('/api/journal', upload.single('photo'), (req, res) => {
  const { title, content, date, mood, authorEmail, partnerEmail, visibility } = req.body;
  let photoData = null;
  
  // Process photo if uploaded
  if (req.file) {
    photoData = req.file.buffer.toString('base64');
  }
  
  // Validate required fields
  if (!title || !content || !authorEmail) {
    return res.status(400).json({ success: false, error: 'Title, content, and author email are required' });
  }
  
  // Create entry object
  const entry = {
    id: Date.now().toString(),
    title,
    content,
    date: date || new Date().toISOString(),
    mood,
    authorEmail,
    partnerEmail,
    visibility: visibility === 'true',
    photo: photoData,
    createdAt: new Date().toISOString()
  };
  
  // Save to database
  const success = journalDb.addEntry(entry);
  
  if (success) {
    res.json({ success: true, entry });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save journal entry' });
  }
});

// Delete a journal entry
app.delete('/api/journal/:id', (req, res) => {
  const entryId = req.params.id;
  
  if (!entryId) {
    return res.status(400).json({ success: false, error: 'Entry ID is required' });
  }
  
  const success = journalDb.deleteEntry(entryId);
  
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to delete journal entry' });
  }
});

// Schedule daily notifications at 8:00 AM
schedule.scheduleJob('0 8 * * *', () => {
  console.log('Sending daily notifications...');
  sendDailyNotifications();
  sendEmailNotifications();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Wedding Countdown App is now active!`);
  console.log(`Wedding date: ${WEDDING_DATE.toDateString()}`);
  console.log(`Engagement date: ${ENGAGEMENT_DATE.toDateString()}`);
});
