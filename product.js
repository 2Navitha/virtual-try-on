// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize wishlist from localStorage
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  updateWishlistCounter(wishlist.length);
  
  // Initialize cart from localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartCounter(cart.reduce((total, item) => total + item.quantity, 0));
  
  // Render all products initially
  renderProducts(products, wishlist);
  
  // Setup search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    setupSearch(searchInput);
  }
  
  // Setup filter buttons
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);
});

// Render products to the page
function renderProducts(productsToRender, wishlist) {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;
  
  productGrid.innerHTML = '';
  
  if (productsToRender.length === 0) {
    productGrid.innerHTML = `
      <div class="no-products">
        <i class='bx bx-search-alt'></i>
        <p>No products found matching your criteria</p>
        <button class="reset-filters" id="resetFiltersFromEmpty" style="margin-top: 15px;">Reset Filters</button>
      </div>
    `;
    document.getElementById('resetFiltersFromEmpty').addEventListener('click', resetFilters);
    return;
  }
  
  productsToRender.forEach(product => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <i class='bx ${isInWishlist ? 'bxs-heart active' : 'bx-heart'} wishlist' data-product-id="${product.id}"></i>
      <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/220x200?text=Product+Image'">
      <h4>${product.name}</h4>
      <p class="desc">${product.desc}</p>
      <div class="rating">${product.rating}</div>
      <div class="price-container">
        <p>₹${product.price.toLocaleString()}</p>
        <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
        <span class="discount">${Math.round((1 - product.price/product.originalPrice)*100)}% OFF</span>
      </div>
      <div class="actions">
        <button class="add-cart" data-product-id="${product.id}">Add to Cart</button>
        <button class="try-on">Try-on</button>
      </div>
    `;
    
    productGrid.appendChild(productCard);
  });
  
  // Attach event listeners after rendering
  attachEventListeners();
}

// Attach event listeners to product cards
function attachEventListeners() {
  // Wishlist functionality
  document.querySelectorAll('.wishlist').forEach(heart => {
    heart.addEventListener('click', function(e) {
      e.stopPropagation();
      const productId = parseInt(this.getAttribute('data-product-id'));
      const product = products.find(p => p.id === productId);
      
      let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      const productIndex = wishlist.findIndex(item => item.id === productId);
      
      if (productIndex >= 0) {
        // Remove from wishlist
        wishlist.splice(productIndex, 1);
        this.classList.remove('bxs-heart', 'active');
        this.classList.add('bx-heart');
        showToast(`${product.name} removed from wishlist`, 'error');
      } else {
        // Add to wishlist
        wishlist.push(product);
        this.classList.remove('bx-heart');
        this.classList.add('bxs-heart', 'active');
        showToast(`${product.name} added to wishlist`);
      }
      
      // Save to localStorage
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      updateWishlistCounter(wishlist.length);
    });
  });

  // Try-on functionality
  document.querySelectorAll('.try-on').forEach(button => {
    button.addEventListener('click', function() {
      const productName = this.closest('.product-card').querySelector('h4').textContent;
      showToast(`Launching try-on for: ${productName}`);
    });
  });

  // Add to cart functionality
  document.querySelectorAll('.add-cart').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const productId = parseInt(this.getAttribute('data-product-id'));
      const product = products.find(p => p.id === productId);
      
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cart.find(item => item.id === productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
        showToast(`Another ${product.name} added to cart (Total: ${existingItem.quantity})`, 'warning');
      } else {
        const productToAdd = {...product, quantity: 1};
        cart.push(productToAdd);
        showToast(`${product.name} added to cart!`);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCounter(cart.reduce((total, item) => total + item.quantity, 0));
    });
  });
}

// Update wishlist counter
function updateWishlistCounter(count) {
  const counter = document.getElementById('wishlistCounter');
  if (counter) {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Update cart counter
function updateCartCounter(count) {
  const counter = document.getElementById('cartCounter');
  if (counter) {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = 'toast';
  toast.classList.add('show', type);
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Search Functionality
function searchProducts(searchInput) {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    applyFilters();
    return;
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(query) || 
    product.desc.toLowerCase().includes(query)
  );
  
  if (filteredProducts.length === 0) {
    showToast(`No products found for "${query}"`, 'error');
  }
  
  renderProducts(filteredProducts, JSON.parse(localStorage.getItem('wishlist')) || []);
}

// Setup search event listeners
function setupSearch(searchInput) {
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchProducts(searchInput);
    }
  });
  
  // Search with debounce on input
  searchInput.addEventListener('input', debounce(() => {
    searchProducts(searchInput);
  }, 500));
}

// Apply filters based on selected options
function applyFilters() {
  // Get all selected categories
  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
  
  // Get all selected brands
  const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
  
  // Get all selected materials
  const selectedMaterials = Array.from(document.querySelectorAll('input[name="material"]:checked')).map(cb => cb.value);
  
  // Get all selected colors
  const selectedColors = Array.from(document.querySelectorAll('input[name="color"]:checked')).map(cb => cb.value);
  
  // Get selected price range
  const selectedPrice = document.querySelector('input[name="price"]:checked')?.value;
  
  // Get wishlist to check which products are already in it
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  
  // Filter products based on selected criteria
  let filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    
    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }
    
    // Material filter
    if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) {
      return false;
    }
    
    // Color filter
    if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
      return false;
    }
    
    // Price filter
    if (selectedPrice) {
      const [min, max] = selectedPrice.split('-').map(Number);
      if (product.price < min || product.price > max) {
        return false;
      }
    }
    
    return true;
  });
  
  // Render the filtered products
  renderProducts(filteredProducts, wishlist);
  
  // Show message if no products found
  if (filteredProducts.length === 0) {
    showToast("No products match your filters", 'error');
  }
}

// Reset all filters to default
function resetFilters() {
  // Reset checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Reset radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.checked = false;
  });
  
  // Reapply filters (which will show all default products)
  applyFilters();
  
  // Clear search input if it exists
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  showToast("Filters reset to default");
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Global variables
let currentStream = null;
let currentProduct = null;
let handposeModel = null;
let isDragging = false;
let offsetX, offsetY;
let watchOverlay = null;
let watchScale = 1;
let watchRotation = 0;
let wristPosition = { x: 0, y: 0 };

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize handpose model
  loadHandposeModel();
  
  // Initialize try-on button event listeners
  document.querySelectorAll('.try-on').forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productId = parseInt(productCard.querySelector('.wishlist').getAttribute('data-product-id'));
      const product = products.find(p => p.id === productId);
      
      openTryOnModal(product);
    });
  });
});

// Load TensorFlow.js handpose model
async function loadHandposeModel() {
  try {
    await tf.ready();
    handposeModel = await handpose.load();
    console.log("Handpose model loaded successfully");
  } catch (error) {
    console.error("Error loading handpose model:", error);
    showToast("Advanced wrist detection not available", "warning");
  }
}

// Open the try-on modal
function openTryOnModal(product) {
  currentProduct = product;
  const modal = document.getElementById('tryOnModal');
  const watchVariantsContainer = document.getElementById('watchVariants');
  
  // Reset watch transformations
  watchScale = 1;
  watchRotation = 0;
  
  // Clear previous variants
  watchVariantsContainer.innerHTML = '';
  
  // For demo, we'll just use the main product image
  const variantItem = document.createElement('div');
  variantItem.className = 'watch-variant active';
  variantItem.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
  variantItem.addEventListener('click', () => {
    document.querySelectorAll('.watch-variant').forEach(v => v.classList.remove('active'));
    variantItem.classList.add('active');
    updateWatchOverlay(product.image);
  });
  watchVariantsContainer.appendChild(variantItem);
  
  // Show modal
  modal.style.display = 'flex';
  
  // Initialize webcam by default
  initWebcam();
  
  // Setup event listeners for modal
  setupTryOnModalEvents();
}

function setupTryOnModalEvents() {
  const modal = document.getElementById('tryOnModal');
  const closeBtn = document.getElementById('closeTryOn');
  const webcamOption = document.getElementById('webcamOption');
  const uploadOption = document.getElementById('uploadOption');
  const imageUpload = document.getElementById('imageUpload');
  const captureBtn = document.getElementById('captureBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const previewContainer = document.getElementById('previewContainer');
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  const resizeBtn = document.getElementById('resizeBtn');
  
  watchOverlay = document.getElementById('watchOverlay');
  
  // Close modal
  closeBtn.addEventListener('click', closeTryOnModal);
  
  // Webcam vs Upload option
  webcamOption.addEventListener('click', function() {
    webcamOption.classList.add('active');
    uploadOption.classList.remove('active');
    stopImagePreview();
    initWebcam();
  });
  
  uploadOption.addEventListener('click', function() {
    uploadOption.classList.add('active');
    webcamOption.classList.remove('active');
    stopWebcam();
    imageUpload.click();
  });
  
  // Image upload
  imageUpload.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.src = event.target.result;
        imagePreview.style.display = 'block';
        document.getElementById('previewInstructions').style.display = 'none';
        
        // Process the image for wrist detection
        detectWristInImage(imagePreview);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  
  // Capture button
  captureBtn.addEventListener('click', function() {
    const canvas = document.getElementById('canvasPreview');
    const video = document.getElementById('videoPreview');
    const image = document.getElementById('imagePreview');
    
    if (video.style.display === 'block') {
      // Capture from webcam
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw watch overlay on canvas with transparency
      if (watchOverlay.style.display === 'block') {
        // Save the current context
        ctx.save();
        
        // Move to the center of the watch
        const watchX = parseInt(watchOverlay.style.left) + watchOverlay.width/2;
        const watchY = parseInt(watchOverlay.style.top) + watchOverlay.height/2;
        ctx.translate(watchX, watchY);
        
        // Apply rotation
        ctx.rotate(watchRotation * Math.PI / 180);
        
        // Apply scale
        ctx.scale(watchScale, watchScale);
        
        // Draw the watch image (adjusted for center)
        ctx.drawImage(
          watchOverlay, 
          -watchOverlay.width/2, 
          -watchOverlay.height/2, 
          watchOverlay.width, 
          watchOverlay.height
        );
        
        // Restore the context
        ctx.restore();
      }
      
      // Show the captured image
      image.src = canvas.toDataURL('image/png');
      image.style.display = 'block';
      video.style.display = 'none';
      
      // Stop webcam
      stopWebcam();
    } else if (image.style.display === 'block') {
      // For uploaded images, we'll create a new canvas with the watch
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.naturalWidth || image.width;
      tempCanvas.height = image.naturalHeight || image.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw the original image
      tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the watch overlay
      if (watchOverlay.style.display === 'block') {
        tempCtx.save();
        
        const watchX = parseInt(watchOverlay.style.left) + watchOverlay.width/2;
        const watchY = parseInt(watchOverlay.style.top) + watchOverlay.height/2;
        tempCtx.translate(watchX, watchY);
        tempCtx.rotate(watchRotation * Math.PI / 180);
        tempCtx.scale(watchScale, watchScale);
        
        tempCtx.drawImage(
          watchOverlay, 
          -watchOverlay.width/2, 
          -watchOverlay.height/2, 
          watchOverlay.width, 
          watchOverlay.height
        );
        
        tempCtx.restore();
      }
      
      // Update the preview image
      image.src = tempCanvas.toDataURL('image/png');
    }
    
    showToast('Image captured! Right-click to save.', 'success');
  });
  
  // Cancel button
  cancelBtn.addEventListener('click', closeTryOnModal);
  
  // Watch controls
  rotateLeftBtn.addEventListener('click', () => {
    watchRotation -= 15;
    updateWatchTransform();
  });
  
  rotateRightBtn.addEventListener('click', () => {
    watchRotation += 15;
    updateWatchTransform();
  });
  
  resizeBtn.addEventListener('click', () => {
    // Toggle between two sizes
    watchScale = watchScale === 1 ? 1.3 : 1;
    updateWatchTransform();
  });
  
  // Make watch overlay draggable
  watchOverlay.addEventListener('mousedown', startDrag);
  previewContainer.addEventListener('mousemove', drag);
  previewContainer.addEventListener('mouseup', endDrag);
  previewContainer.addEventListener('mouseleave', endDrag);
  
  // Touch events for mobile
  watchOverlay.addEventListener('touchstart', startDrag);
  previewContainer.addEventListener('touchmove', drag);
  previewContainer.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  isDragging = true;
  
  const rect = watchOverlay.getBoundingClientRect();
  
  if (e.type === 'mousedown') {
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  } else if (e.type === 'touchstart') {
    offsetX = e.touches[0].clientX - rect.left;
    offsetY = e.touches[0].clientY - rect.top;
    e.preventDefault();
  }
}

function drag(e) {
  if (!isDragging) return;
  
  const previewContainer = document.getElementById('previewContainer');
  const containerRect = previewContainer.getBoundingClientRect();
  
  let clientX, clientY;
  if (e.type === 'mousemove') {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e.type === 'touchmove') {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
    e.preventDefault();
  }
  
  // Calculate new position (within container bounds)
  let newLeft = clientX - containerRect.left - offsetX;
  let newTop = clientY - containerRect.top - offsetY;
  
  // Constrain to container
  newLeft = Math.max(0, Math.min(newLeft, containerRect.width - watchOverlay.width * watchScale));
  newTop = Math.max(0, Math.min(newTop, containerRect.height - watchOverlay.height * watchScale));
  
  // Apply new position
  watchOverlay.style.left = newLeft + 'px';
  watchOverlay.style.top = newTop + 'px';
}

function endDrag() {
  isDragging = false;
}

function updateWatchTransform() {
  watchOverlay.style.transform = `rotate(${watchRotation}deg) scale(${watchScale})`;
}

function initWebcam() {
  const videoPreview = document.getElementById('videoPreview');
  const previewInstructions = document.getElementById('previewInstructions');
  
  // Hide image preview if showing
  document.getElementById('imagePreview').style.display = 'none';
  
  // Stop any existing stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  
  // Get user media
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user' 
    }, 
    audio: false 
  })
  .then(function(stream) {
    currentStream = stream;
    videoPreview.srcObject = stream;
    videoPreview.style.display = 'block';
    previewInstructions.style.display = 'none';
    
    // When video starts playing, detect wrist
    videoPreview.addEventListener('play', function() {
      // Position watch overlay initially
      positionWatchOverlay();
      
      // Start wrist detection
      if (handposeModel) {
        detectWristInVideo(videoPreview);
      } else {
        // Fallback if handpose model didn't load
        positionWatchOverlay();
      }
    });
  })
  .catch(function(err) {
    console.error("Error accessing webcam:", err);
    showToast('Could not access webcam. Please try uploading a photo instead.', 'error');
    document.getElementById('uploadOption').click();
  });
}

async function detectWristInVideo(video) {
  if (!handposeModel) return;
  
  try {
    const predictions = await handposeModel.estimateHands(video);
    
    if (predictions.length > 0) {
      // Get wrist landmark (landmark 0 is the wrist)
      const wrist = predictions[0].landmarks[0];
      
      // Convert coordinates to screen space
      const videoRect = video.getBoundingClientRect();
      const scaleX = videoRect.width / video.videoWidth;
      const scaleY = videoRect.height / video.videoHeight;
      
      wristPosition.x = wrist[0] * scaleX;
      wristPosition.y = wrist[1] * scaleY;
      
      // Position watch overlay
      positionWatchAtWrist();
    }
  } catch (error) {
    console.error("Error detecting wrist:", error);
  }
  
  // Continue detection
  if (currentStream) {
    requestAnimationFrame(() => detectWristInVideo(video));
  }
}

function positionWatchAtWrist() {
  if (!watchOverlay) return;
  
  const watchWidth = 150 * watchScale;
  const watchHeight = (150 * 1.5) * watchScale;
  
  watchOverlay.style.left = (wristPosition.x - watchWidth/2) + 'px';
  watchOverlay.style.top = (wristPosition.y - watchHeight/2) + 'px';
  watchOverlay.style.display = 'block';
}

function positionWatchOverlay() {
  const previewContainer = document.getElementById('previewContainer');
  const containerRect = previewContainer.getBoundingClientRect();
  
  // Set watch overlay size
  const watchWidth = 150;
  const watchHeight = watchWidth * 1.5;
  
  watchOverlay.style.width = watchWidth + 'px';
  watchOverlay.style.height = 'auto';
  
  // Center the watch overlay
  const left = (containerRect.width - watchWidth) / 2;
  const top = (containerRect.height - watchHeight) / 2;
  
  watchOverlay.style.left = left + 'px';
  watchOverlay.style.top = top + 'px';
  watchOverlay.style.display = 'block';
  
  // Update with current product image
  updateWatchOverlay(currentProduct.image);
}

function updateWatchOverlay(imageSrc) {
  // Simply set the watch overlay image source without any background processing
  watchOverlay.src = imageSrc;
}

function detectWristInImage(img) {
  // In a real app, you would analyze the image to find the wrist
  // For demo, we'll just position the watch in the center
  positionWatchOverlay();
  updateWatchOverlay(currentProduct.image);
}

function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  document.getElementById('videoPreview').style.display = 'none';
}

function stopImagePreview() {
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('previewInstructions').style.display = 'flex';
}

function closeTryOnModal() {
  const modal = document.getElementById('tryOnModal');
  modal.style.display = 'none';
  
  // Stop webcam if active
  stopWebcam();
  
  // Reset preview
  stopImagePreview();
  
  // Clear canvas
  const canvas = document.getElementById('canvasPreview');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  
  // Hide watch overlay
  document.getElementById('watchOverlay').style.display = 'none';
}