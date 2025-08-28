const webpush = require('web-push');
require('dotenv').config();

// In-memory storage for subscriptions (in a real app, you'd use a database)
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

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  // Handle GET request for public key
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ publicKey: vapidPublicKey })
    };
  }

  // Handle POST request for subscription
  if (event.httpMethod === 'POST') {
    try {
      const subscription = JSON.parse(event.body);
      
      // Store the subscription
      subscriptions.push(subscription);
      
      // Send a welcome notification
      const payload = JSON.stringify({
        title: 'Wedding Countdown Started!',
        body: 'You will now receive daily sweet messages counting down to your special day!',
        icon: '/images/heart.png'
      });
      
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
      
      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Subscription added successfully!' })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  }

  // Handle unsupported methods
  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
