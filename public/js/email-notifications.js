// Email notification functionality for wedding countdown app

document.addEventListener('DOMContentLoaded', function() {
  initializeEmailNotifications();
});

function initializeEmailNotifications() {
  const saveEmailsButton = document.getElementById('save-emails-button');
  if (saveEmailsButton) {
    saveEmailsButton.addEventListener('click', saveEmailSettings);
  }
  
  // Load saved email settings
  loadEmailSettings();
}

function saveEmailSettings() {
  const yourEmail = document.getElementById('your-email').value;
  const partnerEmail = document.getElementById('partner-email').value;
  const emailStatus = document.getElementById('email-status');
  
  // Validate emails
  if (!isValidEmail(yourEmail) || !isValidEmail(partnerEmail)) {
    emailStatus.textContent = 'Please enter valid email addresses';
    emailStatus.style.color = 'red';
    return;
  }
  
  // Show loading state
  emailStatus.textContent = 'Saving and sending welcome emails...';
  emailStatus.style.color = '#666';
  
  // Save to local storage
  localStorage.setItem('yourEmail', yourEmail);
  localStorage.setItem('partnerEmail', partnerEmail);
  
  // Send to server
  fetch('/api/subscribe-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ yourEmail, partnerEmail })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show success with animation
      emailStatus.textContent = 'Success! You will both receive daily notifications ❤️';
      emailStatus.style.color = 'green';
      
      // Add animation to the status message
      emailStatus.style.animation = 'pulse 2s';
      
      // Show a confirmation dialog
      setTimeout(() => {
        alert('Email notifications have been set up successfully! You and your partner will receive daily sweet messages counting down to your special days.');
      }, 500);
    } else {
      emailStatus.textContent = data.error || 'Failed to save email settings';
      emailStatus.style.color = 'red';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    emailStatus.textContent = 'Failed to save email settings. Please try again.';
    emailStatus.style.color = 'red';
    
    // Show more detailed error in console for debugging
    console.log('Detailed error:', error);
    
    // Fallback message if server is not running
    if (error.message.includes('Failed to fetch')) {
      emailStatus.textContent = 'Server connection failed. Make sure the server is running.';
    }
  });
}

function loadEmailSettings() {
  const yourEmailInput = document.getElementById('your-email');
  const partnerEmailInput = document.getElementById('partner-email');
  
  // Load from local storage
  const yourEmail = localStorage.getItem('yourEmail');
  const partnerEmail = localStorage.getItem('partnerEmail');
  
  if (yourEmail) {
    yourEmailInput.value = yourEmail;
  }
  
  if (partnerEmail) {
    partnerEmailInput.value = partnerEmail;
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
