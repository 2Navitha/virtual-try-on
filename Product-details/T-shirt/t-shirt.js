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
  
  // Initialize try-on functionality
  initVirtualTryOn();
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
        <button class="try-on" data-product-id="${product.id}">Virtual Try-On</button>
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
  
  // Virtual try-on functionality
  document.querySelectorAll('.try-on').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const productId = parseInt(this.getAttribute('data-product-id'));
      const product = products.find(p => p.id === productId);
      openTryOnModal(product);
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
      if (product.price < min || (max && product.price > max)) {
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

// Virtual Try-On Implementation
let currentStream = null;
let currentProduct = null;
let poseDetectionModel = null;
let isDragging = false;
let offsetX, offsetY;
let tshirtOverlay = null;
let tshirtScale = 1;
let tshirtRotation = 0;
let bodyPosition = { x: 0, y: 0, width: 0, height: 0 };
// Added zoom levels array
const zoomLevels = [0.5, 0.8, 1, 1.2, 1.5, 1.8];
let currentZoomIndex = 2; // Default to 1 (middle of the array)

async function initVirtualTryOn() {
  try {
    // Load TensorFlow.js and Pose Detection model if available
    if (typeof tf !== 'undefined' && typeof poseDetection !== 'undefined') {
      await tf.ready();
      poseDetectionModel = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
      );
      console.log("Pose detection model loaded successfully");
    }
  } catch (error) {
    console.error("Error loading pose detection model:", error);
    showToast("Advanced body detection not available", "warning");
  }
}

function openTryOnModal(product) {
  currentProduct = product;
  const modal = document.getElementById('tryOnModal');
  if (!modal) {
    console.error("Try-on modal not found in DOM");
    return;
  }

  const tshirtVariantsContainer = document.getElementById('tshirtVariants');
  
  // Reset t-shirt transformations
  tshirtScale = zoomLevels[currentZoomIndex]; // Use the default zoom level
  tshirtRotation = 0;
  
  // Clear previous variants
  tshirtVariantsContainer.innerHTML = '';
  
  // For demo, we'll just use the main product image
  const variantItem = document.createElement('div');
  variantItem.className = 'tshirt-variant active';
  variantItem.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
  variantItem.addEventListener('click', () => {
    document.querySelectorAll('.tshirt-variant').forEach(v => v.classList.remove('active'));
    variantItem.classList.add('active');
    updateTshirtOverlay(product.image);
  });
  tshirtVariantsContainer.appendChild(variantItem);
  
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
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  
  tshirtOverlay = document.getElementById('tshirtOverlay');
  if (!tshirtOverlay) {
    console.error("T-shirt overlay element not found");
    return;
  }

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
        if (!imagePreview) return;
        
        imagePreview.src = event.target.result;
        imagePreview.style.display = 'block';
        
        const previewInstructions = document.getElementById('previewInstructions');
        if (previewInstructions) {
          previewInstructions.style.display = 'none';
        }
        
        // Process the image for body detection
        detectBodyInImage(imagePreview);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  
  // Capture button
  captureBtn.addEventListener('click', function() {
    const canvas = document.getElementById('canvasPreview');
    const video = document.getElementById('videoPreview');
    const image = document.getElementById('imagePreview');
    
    if (!canvas || !video || !image) return;
    
    if (video.style.display === 'block') {
      // Capture from webcam
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw t-shirt overlay on canvas with transparency
      if (tshirtOverlay.style.display === 'block') {
        // Save the current context
        ctx.save();
        
        // Move to the center of the t-shirt
        const tshirtX = parseInt(tshirtOverlay.style.left) + tshirtOverlay.width/2;
        const tshirtY = parseInt(tshirtOverlay.style.top) + tshirtOverlay.height/2;
        ctx.translate(tshirtX, tshirtY);
        
        // Apply rotation
        ctx.rotate(tshirtRotation * Math.PI / 180);
        
        // Apply scale
        ctx.scale(tshirtScale, tshirtScale);
        
        // Draw the t-shirt image (adjusted for center)
        ctx.drawImage(
          tshirtOverlay, 
          -tshirtOverlay.width/2, 
          -tshirtOverlay.height/2, 
          tshirtOverlay.width, 
          tshirtOverlay.height
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
      // For uploaded images, we'll create a new canvas with the t-shirt
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.naturalWidth || image.width;
      tempCanvas.height = image.naturalHeight || image.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw the original image
      tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the t-shirt overlay
      if (tshirtOverlay.style.display === 'block') {
        tempCtx.save();
        
        const tshirtX = parseInt(tshirtOverlay.style.left) + tshirtOverlay.width/2;
        const tshirtY = parseInt(tshirtOverlay.style.top) + tshirtOverlay.height/2;
        tempCtx.translate(tshirtX, tshirtY);
        tempCtx.rotate(tshirtRotation * Math.PI / 180);
        tempCtx.scale(tshirtScale, tshirtScale);
        
        tempCtx.drawImage(
          tshirtOverlay, 
          -tshirtOverlay.width/2, 
          -tshirtOverlay.height/2, 
          tshirtOverlay.width, 
          tshirtOverlay.height
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
  
  // Zoom in button
  zoomInBtn.addEventListener('click', () => {
    if (currentZoomIndex < zoomLevels.length - 1) {
      currentZoomIndex++;
      tshirtScale = zoomLevels[currentZoomIndex];
      updateTshirtTransform();
      positionTshirtOverlay();
      showToast(`Zoom: ${tshirtScale.toFixed(1)}x`);
    } else {
      showToast("Maximum zoom reached", "warning");
    }
  });
  
  // Zoom out button
  zoomOutBtn.addEventListener('click', () => {
    if (currentZoomIndex > 0) {
      currentZoomIndex--;
      tshirtScale = zoomLevels[currentZoomIndex];
      updateTshirtTransform();
      positionTshirtOverlay();
      showToast(`Zoom: ${tshirtScale.toFixed(1)}x`);
    } else {
      showToast("Minimum zoom reached", "warning");
    }
  });
  
  // Reset zoom button
  zoomResetBtn.addEventListener('click', () => {
    currentZoomIndex = 2; // Reset to middle index (1.0)
    tshirtScale = zoomLevels[currentZoomIndex];
    updateTshirtTransform();
    positionTshirtOverlay();
    showToast(`Zoom reset to ${tshirtScale.toFixed(1)}x`);
  });
  
  // Make t-shirt overlay draggable
  tshirtOverlay.addEventListener('mousedown', startDrag);
  previewContainer.addEventListener('mousemove', drag);
  previewContainer.addEventListener('mouseup', endDrag);
  previewContainer.addEventListener('mouseleave', endDrag);
  
  // Touch events for mobile
  tshirtOverlay.addEventListener('touchstart', startDrag);
  previewContainer.addEventListener('touchmove', drag);
  previewContainer.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  isDragging = true;
  
  const rect = tshirtOverlay.getBoundingClientRect();
  
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
  if (!previewContainer) return;
  
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
  newLeft = Math.max(0, Math.min(newLeft, containerRect.width - tshirtOverlay.width * tshirtScale));
  newTop = Math.max(0, Math.min(newTop, containerRect.height - tshirtOverlay.height * tshirtScale));
  
  // Apply new position
  tshirtOverlay.style.left = newLeft + 'px';
  tshirtOverlay.style.top = newTop + 'px';
}

function endDrag() {
  isDragging = false;
}

function updateTshirtTransform() {
  tshirtOverlay.style.transform = `rotate(${tshirtRotation}deg) scale(${tshirtScale})`;
}

function initWebcam() {
  const videoPreview = document.getElementById('videoPreview');
  const previewInstructions = document.getElementById('previewInstructions');
  
  if (!videoPreview || !previewInstructions) return;
  
  // Hide image preview if showing
  const imagePreview = document.getElementById('imagePreview');
  if (imagePreview) {
    imagePreview.style.display = 'none';
  }
  
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
    
    // When video starts playing, detect body
    videoPreview.addEventListener('play', function() {
      // Position t-shirt overlay initially
      positionTshirtOverlay();
      
      // Start body detection
      if (poseDetectionModel) {
        detectBodyInVideo(videoPreview);
      } else {
        // Fallback if pose detection model didn't load
        positionTshirtOverlay();
      }
    });
  })
  .catch(function(err) {
    console.error("Error accessing webcam:", err);
    showToast('Could not access webcam. Please try uploading a photo instead.', 'error');
    document.getElementById('uploadOption').click();
  });
}

async function detectBodyInVideo(video) {
  if (!poseDetectionModel) return;
  
  try {
    const poses = await poseDetectionModel.estimatePoses(video);
    
    if (poses.length > 0 && poses[0].keypoints) {
      // Get keypoints for shoulders and hips
      const leftShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
      const rightShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
      const leftHip = poses[0].keypoints.find(k => k.name === 'left_hip');
      const rightHip = poses[0].keypoints.find(k => k.name === 'right_hip');
      
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Convert coordinates to screen space
        const videoRect = video.getBoundingClientRect();
        const scaleX = videoRect.width / video.videoWidth;
        const scaleY = videoRect.height / video.videoHeight;
        
        // Calculate body position
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2 * scaleX;
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2 * scaleY;
        const hipCenterX = (leftHip.x + rightHip.x) / 2 * scaleX;
        const hipCenterY = (leftHip.y + rightHip.y) / 2 * scaleY;
        
        const bodyWidth = Math.abs(leftShoulder.x - rightShoulder.x) * scaleX * 1.5;
        const bodyHeight = Math.abs(shoulderCenterY - hipCenterY) * 2;
        
        bodyPosition = {
          x: shoulderCenterX - bodyWidth/2,
          y: shoulderCenterY,
          width: bodyWidth,
          height: bodyHeight
        };
        
        // Position t-shirt overlay
        positionTshirtOnBody();
      }
    }
  } catch (error) {
    console.error("Error detecting body:", error);
  }
  
  // Continue detection
  if (currentStream) {
    requestAnimationFrame(() => detectBodyInVideo(video));
  }
}

function positionTshirtOnBody() {
  if (!tshirtOverlay) return;
  
  // Set t-shirt size based on detected body
  const tshirtWidth = bodyPosition.width;
  const tshirtHeight = bodyPosition.height;
  
  tshirtOverlay.style.width = tshirtWidth + 'px';
  tshirtOverlay.style.height = 'auto';
  
  // Position the t-shirt
  tshirtOverlay.style.left = bodyPosition.x + 'px';
  tshirtOverlay.style.top = bodyPosition.y + 'px';
  tshirtOverlay.style.display = 'block';
  
  // Update with current product image
  updateTshirtOverlay(currentProduct.image);
}

function positionTshirtOverlay() {
  const previewContainer = document.getElementById('previewContainer');
  if (!previewContainer || !tshirtOverlay) return;
  
  const containerRect = previewContainer.getBoundingClientRect();
  
  // Set t-shirt overlay size
  const tshirtWidth = containerRect.width * 0.4;
  const tshirtHeight = tshirtWidth * 1.5;
  
  tshirtOverlay.style.width = tshirtWidth + 'px';
  tshirtOverlay.style.height = 'auto';
  
  // Center the t-shirt overlay
  const left = (containerRect.width - tshirtWidth) / 2;
  const top = (containerRect.height - tshirtHeight) / 2;
  
  tshirtOverlay.style.left = left + 'px';
  tshirtOverlay.style.top = top + 'px';
  tshirtOverlay.style.display = 'block';
  
  // Update with current product image
  updateTshirtOverlay(currentProduct.image);
}

function updateTshirtOverlay(imageSrc) {
  if (!tshirtOverlay) return;
  tshirtOverlay.src = imageSrc;
}

async function detectBodyInImage(img) {
  if (poseDetectionModel) {
    try {
      const poses = await poseDetectionModel.estimatePoses(img);
      
      if (poses.length > 0 && poses[0].keypoints) {
        // Get keypoints for shoulders and hips
        const leftShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
        const rightShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
        const leftHip = poses[0].keypoints.find(k => k.name === 'left_hip');
        const rightHip = poses[0].keypoints.find(k => k.name === 'right_hip');
        
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          // Calculate body position
          const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
          const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
          const hipCenterX = (leftHip.x + rightHip.x) / 2;
          const hipCenterY = (leftHip.y + rightHip.y) / 2;
          
          const bodyWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 1.5;
          const bodyHeight = Math.abs(shoulderCenterY - hipCenterY) * 2;
          
          bodyPosition = {
            x: shoulderCenterX - bodyWidth/2,
            y: shoulderCenterY,
            width: bodyWidth,
            height: bodyHeight
          };
          
          // Position t-shirt overlay
          positionTshirtOnBody();
          return;
        }
      }
    } catch (error) {
      console.error("Error detecting body in image:", error);
    }
  }
  
  // Fallback if pose detection fails or not available
  positionTshirtOverlay();
}

function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  const videoPreview = document.getElementById('videoPreview');
  if (videoPreview) {
    videoPreview.style.display = 'none';
  }
}

function stopImagePreview() {
  const imagePreview = document.getElementById('imagePreview');
  const previewInstructions = document.getElementById('previewInstructions');
  
  if (imagePreview) {
    imagePreview.style.display = 'none';
  }
  if (previewInstructions) {
    previewInstructions.style.display = 'flex';
  }
}

function closeTryOnModal() {
  const modal = document.getElementById('tryOnModal');
  if (!modal) return;
  
  modal.style.display = 'none';
  
  // Stop webcam if active
  stopWebcam();
  
  // Reset preview
  stopImagePreview();
  
  // Clear canvas
  const canvas = document.getElementById('canvasPreview');
  if (canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Hide t-shirt overlay
  const tshirtOverlay = document.getElementById('tshirtOverlay');
  if (tshirtOverlay) {
    tshirtOverlay.style.display = 'none';
  }
  
  // Reset zoom to default
  currentZoomIndex = 2;
  tshirtScale = zoomLevels[currentZoomIndex];
}