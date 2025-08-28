const webpush = require('web-push');
require('dotenv').config();

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

// In-memory storage for subscriptions (in a real app, you'd use a database)
// This is just for demonstration - in a real app, you'd use a database
let subscriptions = [];

// Set VAPID details from environment variables
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys are not set. Push notifications will not work.');
}

webpush.setVapidDetails(
  'mailto:gujjulapreethika2000@gmail.com',
  vapidPublicKey,
  vapidPrivateKey
);

// Function to calculate days remaining
function getDaysRemaining(targetDate) {
  const today = new Date();
  const timeDiff = targetDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

exports.handler = async (event, context) => {
  try {
    // This function would be triggered by a scheduled event
    // For example, using a cron job or AWS CloudWatch Events
    
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
      title: 'Wedding Countdown ❤️',
      body: notificationText,
      icon: '/images/heart.png'
    });
    
    // In a real app, you'd retrieve subscriptions from a database
    // For each subscription, send a notification
    const sendPromises = subscriptions.map(subscription => {
      return webpush.sendNotification(subscription, payload)
        .catch(err => {
          console.error('Error sending notification:', err);
          // Remove failed subscriptions in a real app
        });
    });
    
    await Promise.all(sendPromises);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notifications sent successfully!' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
