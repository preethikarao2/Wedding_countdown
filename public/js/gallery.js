// Gallery functionality for wedding countdown app

// Store photos in memory
let journeyPhotos = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeGallery();
  setupPhotoUpload();
});

// Initialize gallery with photos
async function initializeGallery() {
  // Load photos from server
  await loadPhotos();
  
  // Get gallery container
  const galleryContainer = document.querySelector('.gallery-container');
  if (!galleryContainer) return;
  
  // Clear existing gallery items
  galleryContainer.innerHTML = '';
  
  // Create gallery items
  journeyPhotos.forEach((photo, index) => {
    createGalleryItem(photo, index);
  });
  
  // Create gallery modal
  createGalleryModal();
}

// Compress image before uploading
async function compressImage(imgSrc, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions if image is larger than maxWidth
      if (width > maxWidth) {
        height = Math.floor(height * (maxWidth / width));
        width = maxWidth;
      }
      
      // Set canvas dimensions and draw resized image
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.src = imgSrc;
  });
}

// Save photo to server
async function savePhoto(photoData) {
  try {
    // Compress the image if it's a data URL
    if (photoData.src && photoData.src.startsWith('data:')) {
      photoData.src = await compressImage(photoData.src);
    }
    
    console.log('Saving photo to server...');
    
    // Try the simplified API path first
    let response;
    try {
      response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(photoData)
      });
    } catch (e) {
      // If that fails, try the direct Netlify functions path
      console.log('Trying direct Netlify functions path for saving...');
      response = await fetch('/.netlify/functions/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(photoData)
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    const savedPhoto = await response.json();
    console.log('Photo saved successfully:', savedPhoto);
    return savedPhoto;
  } catch (error) {
    console.error('Error saving photo to server:', error);
    return null;
  }
}

// Load photos from server
async function loadPhotos() {
  try {
    // Try the simplified API path first (with our redirect)
    let response;
    try {
      response = await fetch('/api/photos');
    } catch (e) {
      // If that fails, try the direct Netlify functions path
      console.log('Trying direct Netlify functions path...');
      response = await fetch('/.netlify/functions/api/photos');
    }
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    journeyPhotos = await response.json();
    console.log('Loaded photos:', journeyPhotos);
  } catch (error) {
    console.error('Error loading photos from server:', error);
    journeyPhotos = [];
  }
}


function createGalleryItem(photo, index) {
  const galleryContainer = document.querySelector('.gallery-container');
  if (!galleryContainer) return;
  
  const galleryItem = document.createElement('div');
  galleryItem.className = 'gallery-item';
  galleryItem.dataset.index = index;
  
  // Create menu button (three dots)
  const menuButton = document.createElement('button');
  menuButton.className = 'gallery-item-menu';
  menuButton.innerHTML = '⋮';
  menuButton.title = 'Options';
  menuButton.onclick = function(e) {
    e.stopPropagation(); // Prevent modal from opening
    e.preventDefault();
    showPhotoMenu(index, this);
    return false;
  };
  
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.title || 'Wedding journey photo';
  
  // Add error handler to debug image loading issues
  img.onerror = function() {
    console.error('Failed to load image:', photo.src);
    // Fallback to a text placeholder if image fails to load
    this.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'image-fallback';
    fallback.textContent = photo.title.charAt(0);
    galleryItem.insertBefore(fallback, this);
  };
  
  const photoInfo = document.createElement('div');
  photoInfo.className = 'photo-info';
  
  const photoTitle = document.createElement('h3');
  photoTitle.textContent = photo.title;
  photoInfo.appendChild(photoTitle);
  
  if (photo.date) {
    const photoDate = document.createElement('p');
    photoDate.className = 'photo-date';
    photoDate.textContent = formatDate(photo.date);
    photoInfo.appendChild(photoDate);
  }
  
  galleryItem.appendChild(menuButton);
  galleryItem.appendChild(img);
  galleryItem.appendChild(photoInfo);
  galleryContainer.appendChild(galleryItem);
  
  // Add click event to open modal
  galleryItem.addEventListener('click', () => {
    openGalleryModal(index);
  });
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function setupPhotoUpload() {
  const photoForm = document.getElementById('photo-upload-form');
  const photoFileInput = document.getElementById('photo-file');
  const photoPreview = document.getElementById('photo-preview');
  
  if (!photoForm || !photoFileInput || !photoPreview) return;
  
  // Set default date to today
  const photoDateInput = document.getElementById('photo-date');
  if (photoDateInput) {
    const today = new Date();
    photoDateInput.value = today.toISOString().split('T')[0];
  }
  
  // Show preview when file is selected
  photoFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      photoPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = event.target.result;
      img.className = 'preview-image';
      photoPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
  
  // Handle form submission
  photoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('photo-title').value || 'Our Special Moment';
    const date = document.getElementById('photo-date').value;
    const description = document.getElementById('photo-description').value || '';
    const file = photoFileInput.files[0];
    
    if (!file) {
      alert('Please select a photo to upload');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(event) {
      const photoData = {
        src: event.target.result,
        title: title,
        date: date,
        description: description
      };
      
      // Save to server
      const savedPhoto = await savePhoto(photoData);
      
      if (savedPhoto) {
        // Add to photos array
        journeyPhotos.push(savedPhoto);
        
        // Add to gallery
        createGalleryItem(savedPhoto, journeyPhotos.length - 1);
        
        // Reset form
        photoForm.reset();
        photoPreview.innerHTML = '<p>Preview will appear here</p>';
      } else {
        alert('Failed to upload photo. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  });
}

function createGalleryModal() {
  // Check if modal already exists
  if (document.querySelector('.gallery-modal')) return;
  
  // Create modal elements
  const modal = document.createElement('div');
  modal.className = 'gallery-modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'gallery-modal-content';
  
  const closeBtn = document.createElement('span');
  closeBtn.className = 'gallery-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closeGalleryModal);
  
  const modalImg = document.createElement('img');
  
  const caption = document.createElement('div');
  caption.className = 'gallery-caption';
  
  // Create navigation buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'gallery-nav prev';
  prevBtn.innerHTML = '❮';
  prevBtn.addEventListener('click', () => navigateGallery('prev'));
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'gallery-nav next';
  nextBtn.innerHTML = '❯';
  nextBtn.addEventListener('click', () => navigateGallery('next'));
  
  // Assemble modal
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalImg);
  modalContent.appendChild(caption);
  modal.appendChild(modalContent);
  modal.appendChild(prevBtn);
  modal.appendChild(nextBtn);
  
  // Add modal to document
  document.body.appendChild(modal);
  
  // Close modal when clicking outside of content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeGalleryModal();
    }
  });
}

function openGalleryModal(index) {
  const modal = document.querySelector('.gallery-modal');
  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.gallery-caption');
  
  if (index >= 0 && index < journeyPhotos.length) {
    const photo = journeyPhotos[index];
    
    modalImg.src = photo.src;
    modalImg.alt = photo.title;
    
    // Create caption content with title, date and description
    caption.innerHTML = `
      <h3>${photo.title}</h3>
      ${photo.date ? `<p class="modal-date">${formatDate(photo.date)}</p>` : ''}
      ${photo.description ? `<p class="modal-description">${photo.description}</p>` : ''}
    `;
    
    modal.style.display = 'flex';
    modal.dataset.currentIndex = index;
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleGalleryKeydown);
  }
}

function closeGalleryModal() {
  const modal = document.querySelector('.gallery-modal');
  modal.classList.remove('active');
  
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleGalleryKeydown);
}

function navigateGallery(direction) {
  const modal = document.querySelector('.gallery-modal');
  const currentIndex = parseInt(modal.dataset.currentIndex);
  
  let newIndex;
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % journeyPhotos.length;
  } else {
    newIndex = (currentIndex - 1 + journeyPhotos.length) % journeyPhotos.length;
  }
  
  openGalleryModal(newIndex);
}

function handleGalleryKeydown(e) {
  const modal = document.querySelector('.gallery-modal');
  if (!modal || modal.style.display !== 'flex') return;
  
  if (e.key === 'ArrowLeft') {
    navigateGallery('prev');
  } else if (e.key === 'ArrowRight') {
    navigateGallery('next');
  } else if (e.key === 'Escape') {
    closeGalleryModal();
  }
}

// Show photo menu with options
function showPhotoMenu(photoIndex, buttonElement) {
  console.log('Opening menu for photo:', photoIndex);
  
  // Use simple confirm/prompt dialogs instead of custom menu
  const action = window.confirm('What would you like to do with this photo?\n\nOK = Edit Title\nCancel = Delete Photo');
  
  if (action) {
    // Edit title (OK was clicked)
    editPhotoTitle(photoIndex);
  } else {
    // Delete photo (Cancel was clicked)
    if (window.confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(photoIndex);
    }
  }
}

// Edit photo title
async function editPhotoTitle(photoIndex) {
  const photo = journeyPhotos[photoIndex];
  if (!photo) return;
  
  const newTitle = prompt('Edit photo title:', photo.title);
  if (newTitle === null) return; // User cancelled
  
  try {
    console.log('Updating photo title...');
    
    // Try the simplified API path first
    let response;
    try {
      response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (e) {
      // If that fails, try the direct Netlify functions path
      console.log('Trying direct Netlify functions path for updating...');
      response = await fetch(`/.netlify/functions/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    // Update local data
    journeyPhotos[photoIndex].title = newTitle;
    console.log('Photo title updated successfully');
    
    // Update UI
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems[photoIndex]) {
      const titleElement = galleryItems[photoIndex].querySelector('h3');
      if (titleElement) {
        titleElement.textContent = newTitle;
      }
    }
  } catch (error) {
    console.error('Error updating photo title:', error);
    alert('Failed to update photo title. Please try again.');
  }
}

// Delete photo
async function deletePhoto(photoIndex) {
  const photo = journeyPhotos[photoIndex];
  if (!photo) return;
  
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this photo?')) {
    return; // User cancelled
  }
  
  try {
    console.log('Deleting photo...');
    
    // Try the simplified API path first
    let response;
    try {
      response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      // If that fails, try the direct Netlify functions path
      console.log('Trying direct Netlify functions path for deleting...');
      response = await fetch(`/.netlify/functions/api/photos/${photo.id}`, {
        method: 'DELETE'
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    console.log('Photo deleted successfully');
    
    // Remove from array
    journeyPhotos.splice(photoIndex, 1);
    
    // Refresh gallery
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
      galleryContainer.innerHTML = '';
      journeyPhotos.forEach((photo, index) => {
        createGalleryItem(photo, index);
      });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    alert('Failed to delete photo. Please try again.');
  }
}
