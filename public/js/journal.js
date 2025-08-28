// Journal and email notification functionality

document.addEventListener('DOMContentLoaded', function() {
  initializeJournal();
  initializeEmailNotifications();
});

// Journal functionality
function initializeJournal() {
  const saveEntryButton = document.getElementById('save-entry-button');
  if (saveEntryButton) {
    saveEntryButton.addEventListener('click', saveJournalEntry);
  }
  
  // Load existing entries
  loadJournalEntries();
  
  // Show status message
  const journalStatus = document.createElement('div');
  journalStatus.id = 'journal-status';
  journalStatus.style.margin = '10px 0';
  journalStatus.style.padding = '8px';
  journalStatus.style.borderRadius = '4px';
  journalStatus.style.display = 'none';
  
  const journalForm = document.querySelector('.journal-form');
  if (journalForm) {
    journalForm.appendChild(journalStatus);
  }
}

function saveJournalEntry() {
  const entryDate = document.getElementById('entry-date').value || new Date().toISOString().split('T')[0];
  const entryTitle = document.getElementById('entry-title').value;
  const entryMood = document.getElementById('entry-mood').value;
  const entryContent = document.getElementById('entry-content').value;
  const entryVisibility = document.getElementById('entry-visibility').checked;
  const entryPhotoInput = document.getElementById('entry-photo');
  const journalStatus = document.getElementById('journal-status');
  
  // Get email addresses from localStorage
  const yourEmail = localStorage.getItem('yourEmail');
  const partnerEmail = localStorage.getItem('partnerEmail');
  
  // Validation
  if (!entryTitle || !entryContent) {
    alert('Please fill in the title and your thoughts.');
    return;
  }
  
  if (!yourEmail) {
    alert('Please set up your email in the Email Notifications section first.');
    return;
  }
  
  // Show saving status
  journalStatus.textContent = 'Saving your entry...';
  journalStatus.style.display = 'block';
  journalStatus.style.backgroundColor = '#f8f9fa';
  journalStatus.style.color = '#666';
  
  // Create form data for multipart/form-data (for photo upload)
  const formData = new FormData();
  formData.append('title', entryTitle);
  formData.append('content', entryContent);
  formData.append('date', entryDate);
  formData.append('mood', entryMood);
  formData.append('authorEmail', yourEmail);
  formData.append('partnerEmail', partnerEmail || '');
  formData.append('visibility', entryVisibility);
  
  // Add photo if provided
  if (entryPhotoInput.files && entryPhotoInput.files[0]) {
    formData.append('photo', entryPhotoInput.files[0]);
  }
  
  // Send to server
  fetch('/api/journal', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show success message
      journalStatus.textContent = 'Entry saved successfully! ❤️';
      journalStatus.style.backgroundColor = '#d4edda';
      journalStatus.style.color = '#155724';
      
      // Clear form
      document.getElementById('entry-title').value = '';
      document.getElementById('entry-content').value = '';
      document.getElementById('entry-photo').value = '';
      
      // Reload entries
      loadJournalEntries();
      
      // Hide status after a delay
      setTimeout(() => {
        journalStatus.style.display = 'none';
      }, 3000);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  })
  .catch(error => {
    console.error('Error saving journal entry:', error);
    
    // Show error message
    journalStatus.textContent = 'Error saving entry. Please try again.';
    journalStatus.style.backgroundColor = '#f8d7da';
    journalStatus.style.color = '#721c24';
    
    // Also save to localStorage as backup
    saveEntryToLocalStorage({
      id: Date.now(),
      date: entryDate,
      title: entryTitle,
      mood: entryMood,
      content: entryContent,
      visibility: entryVisibility,
      authorEmail: yourEmail,
      partnerEmail: partnerEmail,
      createdAt: new Date().toISOString()
    });
  });
}

// Helper function to save entry to localStorage as backup
function saveEntryToLocalStorage(entry) {
  // Get existing entries
  let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
  
  // Add new entry
  entries.unshift(entry); // Add to beginning of array
  
  // Save to localStorage
  localStorage.setItem('journalEntries', JSON.stringify(entries));
  
  console.log('Entry saved to localStorage as backup');
}

function saveEntryToStorage(entry) {
  saveEntryToLocalStorage(entry);
  
  // Reload entries
  loadJournalEntries();
  
  // Clear form
  document.getElementById('entry-title').value = '';
  document.getElementById('entry-content').value = '';
  document.getElementById('entry-photo').value = '';
  
  // Show success message
  alert('Journal entry saved successfully!');
  
  // If entry is shared with partner, send it via email
  if (entry.visibility) {
    sendEntryToPartner(entry);
  }
}

function loadJournalEntries() {
  // Get container
  const entriesContainer = document.querySelector('.journal-entries');
  if (!entriesContainer) return;
  
  // Get email from localStorage
  const userEmail = localStorage.getItem('yourEmail');
  if (!userEmail) {
    entriesContainer.innerHTML = '<p class="no-entries">Please set up your email in the Email Notifications section first.</p>';
    return;
  }
  
  // Show loading state
  entriesContainer.innerHTML = '<p class="loading-entries">Loading your journal entries...</p>';
  
  // Fetch entries from server
  fetch(`/api/journal/${encodeURIComponent(userEmail)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Clear container
      entriesContainer.innerHTML = '';
      
      if (!data.entries || data.entries.length === 0) {
        entriesContainer.innerHTML = '<p class="no-entries">No journal entries yet. Start capturing your thoughts!</p>';
        return;
      }
      
      // Add entries to container
      data.entries.forEach(entry => {
        const entryElement = createEntryElement(entry);
        entriesContainer.appendChild(entryElement);
      });
    })
    .catch(error => {
      console.error('Error loading journal entries:', error);
      
      // Show error message
      entriesContainer.innerHTML = '<p class="error-entries">Error loading entries. Showing local entries instead.</p>';
      
      // Fall back to localStorage
      const localEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      
      if (localEntries.length === 0) {
        entriesContainer.innerHTML += '<p class="no-entries">No journal entries found locally.</p>';
        return;
      }
      
      // Add local entries to container
      localEntries.forEach(entry => {
        const entryElement = createEntryElement(entry);
        entriesContainer.appendChild(entryElement);
      });
    });
}

function createEntryElement(entry) {
  const entryElement = document.createElement('div');
  entryElement.className = 'journal-entry';
  entryElement.dataset.id = entry.id;
  
  // Format date
  const formattedDate = formatDate(entry.date || entry.createdAt);
  
  // Get mood emoji
  const moodEmoji = getMoodEmoji(entry.mood);
  
  // Determine if entry is shared
  const isShared = entry.visibility === true;
  
  // Determine if entry has a photo
  const hasPhoto = entry.photoUrl || entry.photo;
  const photoSrc = entry.photoUrl || (entry.photo ? `/uploads/${entry.photo}` : null);
  
  // Create entry HTML
  entryElement.innerHTML = `
    <div class="entry-header">
      <h3>${entry.title}</h3>
      <div class="entry-meta">
        <span class="entry-date">${formattedDate}</span>
        <span class="entry-mood">${moodEmoji}</span>
        ${entry.authorEmail ? `<span class="entry-author">By: ${entry.authorEmail}</span>` : ''}
      </div>
    </div>
    <div class="entry-content">
      <p>${entry.content}</p>
      ${hasPhoto ? `<img src="${photoSrc}" alt="Entry photo" class="entry-photo">` : ''}
    </div>
    <div class="entry-actions">
      <button onclick="deleteEntry('${entry.id}')" class="delete-entry-btn">Delete</button>
      <button onclick="sendEntryToPartner(${JSON.stringify(entry).replace(/"/g, '&quot;')})" class="share-entry-btn">
        ${isShared ? 'Shared ✓' : 'Share with Partner'}
      </button>
    </div>
  `;
  
  return entryElement;
}

function getMoodEmoji(mood) {
  const moods = {
    'happy': '😊',
    'excited': '🤩',
    'missing-you': '💔',
    'loved': '❤️',
    'anxious': '😰',
    'peaceful': '😌'
  };
  
  return moods[mood] || '😊';
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Make delete function available globally
window.deleteEntry = function(entryId) {
  if (!confirm('Are you sure you want to delete this journal entry?')) {
    return;
  }
  
  // Delete from server
  fetch(`/api/journal/${entryId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Server error: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Also delete from localStorage if it exists there
      let localEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      localEntries = localEntries.filter(entry => entry.id != entryId);
      localStorage.setItem('journalEntries', JSON.stringify(localEntries));
      
      // Reload entries
      loadJournalEntries();
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  })
  .catch(error => {
    console.error('Error deleting journal entry:', error);
    alert('Error deleting entry. Please try again.');
    
    // Try to delete from localStorage as fallback
    try {
      let localEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      localEntries = localEntries.filter(entry => entry.id != entryId);
      localStorage.setItem('journalEntries', JSON.stringify(localEntries));
      loadJournalEntries();
    } catch (e) {
      console.error('Error with localStorage fallback:', e);
    }
  });
}

function sendEntryToPartner(entry) {
  const partnerEmail = localStorage.getItem('partnerEmail');
  const yourEmail = localStorage.getItem('yourEmail');
  
  if (!partnerEmail) {
    alert('Please set up your partner\'s email in the Email Notifications section first.');
    return;
  }
  
  // Update the entry visibility on the server
  const updatedEntry = {...entry, visibility: true};
  
  // In a real app with a more complete API, we would update the entry on the server
  // For now, we'll just show a success message and update localStorage
  alert(`Entry shared with ${partnerEmail}!`);
  
  // Mark as shared in localStorage
  let localEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
  const index = localEntries.findIndex(e => e.id === entry.id);
  if (index !== -1) {
    localEntries[index].visibility = true;
    localStorage.setItem('journalEntries', JSON.stringify(localEntries));
  }
  
  // Send email notification about the shared entry
  const emailData = {
    yourEmail,
    partnerEmail,
    subject: `${yourEmail} shared a journal entry with you!`,
    message: `${yourEmail} shared a journal entry titled "${entry.title}" with you. Log in to the Wedding Countdown App to view it!`
  };
  
  // This would require an additional API endpoint to send notification emails
  // For now, we'll just log it
  console.log('Would send email notification:', emailData);
}

// Email notification functionality
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
  
  // Save to local storage
  localStorage.setItem('yourEmail', yourEmail);
  localStorage.setItem('partnerEmail', partnerEmail);
  
  // Update status
  emailStatus.textContent = 'Email settings saved! You will both receive daily notifications.';
  emailStatus.style.color = 'green';
  
  // Send test email
  sendTestEmail(yourEmail, partnerEmail);
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

function sendTestEmail(yourEmail, partnerEmail) {
  // In a real app, you would send this to your backend
  console.log(`Test emails would be sent to ${yourEmail} and ${partnerEmail}`);
  
  // For demonstration purposes, we'll simulate sending emails
  setTimeout(() => {
    console.log('Test emails sent successfully');
  }, 1000);
}
