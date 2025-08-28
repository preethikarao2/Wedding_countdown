// Wedding and engagement dates
const WEDDING_DATE = new Date('2025-11-01');
const ENGAGEMENT_DATE = new Date('2025-10-16');

// Sweet messages for daily display
const sweetMessages = [
  "Every day brings us closer to forever together! 💍",
  "Can't wait to spend the rest of my life with you! 💕",
  "Counting down the days until we say 'I do'! 👰🤵",
  "Our love story is my favorite! 📖❤️",
  "Forever won't be long enough with you! ⏱️💞",
  "You're the best part of all my days! 🌞💫",
  "So excited for our big day! 🎉💒",
  "You make every day brighter! ☀️😊",
  "My heart is yours, forever and always! 💘",
  "Building our future together, one day at a time! 🏡💑",
  "Every moment with you is a blessing! 🙏💖",
  "You are my today and all of my tomorrows! 📅❤️",
  "I fall in love with you more each day! 💓",
  "You're my favorite hello and my hardest goodbye! 👋💔",
  "I can't wait to marry my best friend! 👫💍",
  "You make my heart skip a beat! 💓",
  "Together is my favorite place to be! 🏠💑",
  "You're worth every minute of waiting! ⏰💕",
  "Our wedding will be the first day of forever! 📆💒",
  "I'm counting down to the best day of our lives! 🎊👰🤵"
];

// Couple images for daily rotation
const coupleImages = [
];

// DOM elements
const dailyMessage = document.getElementById('daily-message');
const dailyImage = document.getElementById('daily-image');
const refreshMessageButton = document.getElementById('refresh-message');

// Countdown elements
const engagementDays = document.getElementById('engagement-days');
const engagementHours = document.getElementById('engagement-hours');
const engagementMinutes = document.getElementById('engagement-minutes');
const engagementSeconds = document.getElementById('engagement-seconds');

const weddingDays = document.getElementById('wedding-days');
const weddingHours = document.getElementById('wedding-hours');
const weddingMinutes = document.getElementById('wedding-minutes');
const weddingSeconds = document.getElementById('wedding-seconds');

// Function to update countdown
function updateCountdown() {
  const now = new Date();

  // Update engagement countdown
  const engagementDiff = ENGAGEMENT_DATE - now;
  if (engagementDiff > 0) {
    const days = Math.floor(engagementDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((engagementDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((engagementDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((engagementDiff % (1000 * 60)) / 1000);

    engagementDays.textContent = days;
    engagementHours.textContent = hours.toString().padStart(2, '0');
    engagementMinutes.textContent = minutes.toString().padStart(2, '0');
    engagementSeconds.textContent = seconds.toString().padStart(2, '0');
  } else {
    engagementDays.textContent = '0';
    engagementHours.textContent = '00';
    engagementMinutes.textContent = '00';
    engagementSeconds.textContent = '00';
  }

  // Update wedding countdown
  const weddingDiff = WEDDING_DATE - now;
  if (weddingDiff > 0) {
    const days = Math.floor(weddingDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((weddingDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((weddingDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((weddingDiff % (1000 * 60)) / 1000);

    weddingDays.textContent = days;
    weddingHours.textContent = hours.toString().padStart(2, '0');
    weddingMinutes.textContent = minutes.toString().padStart(2, '0');
    weddingSeconds.textContent = seconds.toString().padStart(2, '0');
  } else {
    weddingDays.textContent = '0';
    weddingHours.textContent = '00';
    weddingMinutes.textContent = '00';
    weddingSeconds.textContent = '00';
  }
}

// Update countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();

// Function to get a random sweet message
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * sweetMessages.length);
  return sweetMessages[randomIndex];
}

// Function to get a random couple image
function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * coupleImages.length);
  return coupleImages[randomIndex];
}

// Function to update the daily message and image with animation
function updateDailyMessage(withAnimation = true) {
  const message = getRandomMessage();
  const weddingDaysRemaining = Math.ceil((WEDDING_DATE - new Date()) / (1000 * 60 * 60 * 24));
  const engagementDaysRemaining = Math.ceil((ENGAGEMENT_DATE - new Date()) / (1000 * 60 * 60 * 24));

  let countdownText = '';

  if (engagementDaysRemaining > 0) {
    countdownText += `${engagementDaysRemaining} days until your engagement! `;
  } else if (engagementDaysRemaining === 0) {
    countdownText += "Today is your engagement day! ";
  } else {
    countdownText += "You're engaged! ";
  }

  if (weddingDaysRemaining > 0) {
    countdownText += `${weddingDaysRemaining} days until your wedding! `;
  } else if (weddingDaysRemaining === 0) {
    countdownText += "Today is your wedding day! ";
  } else {
    countdownText += "You're married! ";
  }

  if (dailyMessage) {
    if (withAnimation) {
      // Fade out
      dailyMessage.style.opacity = 0;

      setTimeout(() => {
        // Update content
        dailyMessage.innerHTML = `${message}<br><br>${countdownText}`;
        // Fade in
        dailyMessage.style.opacity = 1;
      }, 500);
    } else {
      dailyMessage.innerHTML = `${message}<br><br>${countdownText}`;
    }
  }

  if (dailyImage) {
    if (withAnimation) {
      // Fade out
      dailyImage.style.opacity = 0;

      setTimeout(() => {
        // Update image
        dailyImage.src = getRandomImage();
        // Fade in after image loads
        dailyImage.onload = function() {
          dailyImage.style.opacity = 1;
        };
      }, 500);
    } else {
      dailyImage.src = getRandomImage();
    }
  }
}

// Initialize the app
function initializeApp() {
  // Set up daily message and image rotation
  updateDailyMessage(false); // Initial update without animation

  // Set up refresh message button
  if (refreshMessageButton) {
    refreshMessageButton.addEventListener('click', function() {
      updateDailyMessage(true); // Update with animation
      if (typeof createHeartBurst === 'function') {
        createHeartBurst(this); // Create heart burst animation on button click
      }
    });
  }

  // Update daily message every day at midnight
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeUntilMidnight = tomorrow - now;

  setTimeout(() => {
    updateDailyMessage();
    // After the first midnight update, schedule it to happen daily
    setInterval(updateDailyMessage, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  // Register service worker for offline functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  }
}

// Initialize the app when the page loads
window.addEventListener('load', initializeApp);
