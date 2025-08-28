// Additional animations for the wedding countdown app

document.addEventListener('DOMContentLoaded', function() {
  // Add floating hearts animation
  createFloatingHearts();
  
  // Add scroll animations
  addScrollAnimations();
  
  // Add confetti effect on refresh button click
  const refreshButton = document.getElementById('refresh-message');
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      createConfetti();
      createHeartBurst(refreshButton);
    });
  }
});

// Function to create floating hearts
function createFloatingHearts() {
  const container = document.querySelector('.container');
  const heartColors = ['#ff6b6b', '#ff8e8e', '#ffb6b6', '#ff4d4d'];
  
  // Create 15 floating hearts
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.innerHTML = '❤';
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDuration = (Math.random() * 10 + 10) + 's';
      heart.style.opacity = Math.random() * 0.3 + 0.1;
      heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
      heart.style.color = heartColors[Math.floor(Math.random() * heartColors.length)];
      
      container.appendChild(heart);
      
      // Remove heart after animation completes
      setTimeout(() => {
        heart.remove();
      }, 20000);
    }, i * 2000);
  }
  
  // Continue creating hearts
  setInterval(createFloatingHearts, 30000);
}

// Function to add scroll animations
function addScrollAnimations() {
  const elements = document.querySelectorAll('.event-countdown, .notification-section, .message-preview');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });
  
  elements.forEach(element => {
    observer.observe(element);
  });
}

// Function to create confetti effect
function createConfetti() {
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8e8e', '#7bdff2'];
  const container = document.querySelector('.container');
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position, color, and size
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = (Math.random() * 10 + 5) + 'px';
    confetti.style.height = (Math.random() * 10 + 5) + 'px';
    confetti.style.opacity = Math.random() + 0.5;
    
    // Random animation duration and delay
    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
    confetti.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(confetti);
    
    // Remove confetti after animation completes
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}
