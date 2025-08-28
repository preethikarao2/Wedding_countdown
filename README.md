# Wedding Countdown App

A beautiful web application that sends daily morning email notifications with sweet messages counting down to your engagement (October 16, 2025) and wedding (November 1, 2025). Perfect for couples in long-distance relationships who want to stay connected and excited about their upcoming special days.

## Features

- Daily morning email notifications to both partners
- Countdown timers for engagement and wedding dates
- Sweet personalized messages delivered every morning
- Photo gallery to store and share your favorite memories
- Long-distance relationship journal to capture thoughts, feelings, and activities
- Beautiful animations and visual effects
- Responsive design for all devices
- Easy to set up and customize

## Setup Instructions

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with your configuration (see `.env.example`)
   - For email notifications, you'll need to set up your Gmail account with an App Password

## Deployment Instructions

### Deploying to Netlify

1. Create a Netlify account at [netlify.com](https://www.netlify.com/)
2. Install the Netlify CLI: `npm install -g netlify-cli`
3. Login to Netlify: `netlify login`
4. Initialize your site: `netlify init`
5. Deploy your site: `netlify deploy --prod`

Alternatively, you can deploy directly from the Netlify website:

1. Go to [app.netlify.com](https://app.netlify.com/)
2. Click "New site from Git"
3. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Configure build settings:
   - Build command: `npm install && npm run build`
   - Publish directory: `public`
6. Click "Deploy site"

### Important Notes for Deployment

- The app uses serverless functions for backend functionality
- Photos are stored in Cloudinary cloud storage
- Make sure to set up environment variables in the Netlify dashboard

### Setting Up Cloudinary for Photo Storage

1. Create a free Cloudinary account at [cloudinary.com](https://cloudinary.com/)
2. From your Cloudinary dashboard, get your Cloud Name, API Key, and API Secret
3. Add these as environment variables in your Netlify dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

This ensures your photos are properly stored in the cloud and accessible from your deployed site.
4. Run `npm start` to start the server
5. Open the web application in your browser at http://localhost:3000
6. Enter both email addresses to receive daily notifications
7. Start adding photos and journal entries to document your journey

## Customization

### Changing Dates
To change the engagement and wedding dates, edit the constants in `src/server.js`:
```javascript
const WEDDING_DATE = new Date('2025-11-01');
const ENGAGEMENT_DATE = new Date('2025-10-16');
```

### Adding Photos
Place your photos in the `public/images` directory and update the references in `public/js/gallery.js`.

### Customizing Messages
Edit the `sweetMessages` array in `src/server.js` to add your own personalized messages.

## Technologies Used

- **Backend**: Node.js, Express, Nodemailer for emails
- **Frontend**: HTML5, CSS3, JavaScript
- **Animations**: CSS animations and JavaScript effects
- **Storage**: Local storage for journal entries and settings
- **Email**: Gmail SMTP for sending notifications

## Long-Distance Relationship Features

- **Journal**: Document your thoughts, feelings, and daily activities
- **Photo Sharing**: Upload and view photos together
- **Daily Messages**: Stay connected with sweet daily messages
- **Countdown**: Watch as you get closer to being together permanently
