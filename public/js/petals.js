// Falling petals animation for wedding countdown app

document.addEventListener('DOMContentLoaded', function() {
  createPetalsAnimation();
});

function createPetalsAnimation() {
  const container = document.querySelector('.container');
  const petalColors = ['#ffcad4', '#f4acb7', '#ff8fa3', '#ffb7c5', '#ffc8dd'];
  const petalCount = 30;
  
  // Create petals container
  const petalsContainer = document.createElement('div');
  petalsContainer.className = 'petals-container';
  document.body.appendChild(petalsContainer);
  
  // Create petals
  for (let i = 0; i < petalCount; i++) {
    createPetal(petalsContainer, petalColors);
  }
  
  // Continue creating petals at intervals
  setInterval(() => {
    createPetal(petalsContainer, petalColors);
  }, 3000);
}

function createPetal(container, colors) {
  // Create petal element
  const petal = document.createElement('div');
  petal.className = 'petal';
  
  // Random properties
  const size = Math.random() * 15 + 10;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const animationDuration = Math.random() * 10 + 8;
  const delay = Math.random() * 5;
  const rotation = Math.random() * 360;
  
  // Apply styles
  petal.style.width = `${size}px`;
  petal.style.height = `${size * 1.2}px`;
  petal.style.backgroundColor = color;
  petal.style.left = `${left}vw`;
  petal.style.animationDuration = `${animationDuration}s`;
  petal.style.animationDelay = `${delay}s`;
  petal.style.transform = `rotate(${rotation}deg)`;
  
  // Add to container
  container.appendChild(petal);
  
  // Remove petal after animation completes
  setTimeout(() => {
    petal.remove();
  }, (animationDuration + delay) * 1000);
}

// Add special effects for special dates
function checkSpecialDates() {
  const today = new Date();
  const weddingDate = new Date('2025-11-01');
  const engagementDate = new Date('2025-10-16');
  
  // Check if today is wedding or engagement day
  if (today.toDateString() === weddingDate.toDateString()) {
    createSpecialEffect('wedding');
  } else if (today.toDateString() === engagementDate.toDateString()) {
    createSpecialEffect('engagement');
  }
}

function createSpecialEffect(type) {
  // Create a special celebration effect
  const effectContainer = document.createElement('div');
  effectContainer.className = `special-effect ${type}-effect`;
  document.body.appendChild(effectContainer);
  
  // Add celebration message
  const message = document.createElement('div');
  message.className = 'celebration-message';
  
  if (type === 'wedding') {
    message.textContent = 'Today is your Wedding Day! ❤️';
  } else {
    message.textContent = 'Today is your Engagement Day! ❤️';
  }
  
  effectContainer.appendChild(message);
  
  // Create lots of confetti
  for (let i = 0; i < 200; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'celebration-confetti';
    
    // Random styles
    const size = Math.random() * 10 + 5;
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8fa3', '#ffc8dd', '#gold', '#silver'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    confetti.style.animationDelay = `${Math.random() * 5}s`;
    
    effectContainer.appendChild(confetti);
  }
  
  // Remove after some time
  setTimeout(() => {
    effectContainer.classList.add('fade-out');
    setTimeout(() => {
      effectContainer.remove();
    }, 1000);
  }, 20000);
}

// Check for special dates when page loads
checkSpecialDates();
