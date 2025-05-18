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
  
  // Get all selected sizes
  const selectedSizes = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(cb => cb.value);
  
  // Get all selected colors
  const selectedColors = Array.from(document.querySelectorAll('input[name="color"]:checked')).map(cb => cb.value);
  
  // Get all selected materials
  const selectedMaterials = Array.from(document.querySelectorAll('input[name="material"]:checked')).map(cb => cb.value);
  
  // Get selected discount
  const selectedDiscount = Array.from(document.querySelectorAll('input[name="discount"]:checked')).map(cb => parseInt(cb.value));
  
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
    
    // Size filter
    if (selectedSizes.length > 0 && !selectedSizes.some(size => product.size.includes(size))) {
      return false;
    }
    
    // Color filter
    if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
      return false;
    }
    
    // Material filter
    if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) {
      return false;
    }
    
    // Discount filter
    if (selectedDiscount.length > 0 && !selectedDiscount.some(d => product.discount >= d)) {
      return false;
    }
    
    // Price filter
    if (selectedPrice) {
      if (selectedPrice === "5000+") {
        if (product.price < 5000) return false;
      } else {
        const [min, max] = selectedPrice.split('-').map(Number);
        if (product.price < min || (max && product.price > max)) {
          return false;
        }
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
let isDragging = false;
let offsetX, offsetY;
let shoeOverlay = null;
let shoeScale = 1;
let shoeRotation = 0;
const zoomLevels = [0.2, 0.5, 0.8, 1, 1.2, 1.5, 1.8, 2.0];
let currentZoomIndex = 3; // Default to 1.0 (index 3 in the array)

function initVirtualTryOn() {
  // No pose detection needed for shoes
}

function openTryOnModal(product) {
  currentProduct = product;
  const modal = document.getElementById('tryOnModal');
  if (!modal) {
    console.error("Try-on modal not found in DOM");
    return;
  }

  const shoeVariantsContainer = document.getElementById('shoeVariants');
  
  // Reset shoe transformations
  shoeScale = zoomLevels[currentZoomIndex];
  shoeRotation = 0;
  
  // Clear previous variants
  shoeVariantsContainer.innerHTML = '';
  
  // Create variant item with error handling for image
  const variantItem = document.createElement('div');
  variantItem.className = 'shoe-variant active';
  
  // Create image with error handling
  const variantImg = document.createElement('img');
  variantImg.src = product.image;
  variantImg.alt = product.name;
  variantImg.onerror = function() {
    this.src = 'https://via.placeholder.com/150x180?text=Shoe+Image';
    console.warn("Failed to load product image, using placeholder");
  };
  
  variantItem.appendChild(variantImg);
  variantItem.addEventListener('click', () => {
    document.querySelectorAll('.shoe-variant').forEach(v => v.classList.remove('active'));
    variantItem.classList.add('active');
    updateShoeOverlay(variantImg.src);
  });
  shoeVariantsContainer.appendChild(variantItem);
  
  // Show modal
  modal.style.display = 'flex';
  
  // Initialize webcam by default
  initWebcam();
  
  // Setup event listeners for modal
  setupTryOnModalEvents();
}

function setupTryOnModalEvents() {
  const modal = document.getElementById('tryOnModal');
  if (!modal) return;

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
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');
  
  shoeOverlay = document.getElementById('shoeOverlay');
  if (!shoeOverlay) {
    console.error("Shoe overlay element not found");
    return;
  }

  // Close modal
  closeBtn?.addEventListener('click', closeTryOnModal);
  
  // Webcam vs Upload option
  webcamOption?.addEventListener('click', function() {
    webcamOption.classList.add('active');
    uploadOption.classList.remove('active');
    stopImagePreview();
    initWebcam();
  });
  
  uploadOption?.addEventListener('click', function() {
    uploadOption.classList.add('active');
    webcamOption.classList.remove('active');
    stopWebcam();
    imageUpload?.click();
  });
  
  // Image upload
  imageUpload?.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) return;
        
        imagePreview.onerror = function() {
          showToast("Failed to load uploaded image", "error");
          console.error("Error loading uploaded image");
        };
        
        imagePreview.src = event.target.result;
        imagePreview.style.display = 'block';
        
        const previewInstructions = document.getElementById('previewInstructions');
        if (previewInstructions) {
          previewInstructions.style.display = 'none';
        }
        
        positionShoeOverlay();
      };
      reader.onerror = function() {
        showToast("Error reading file", "error");
        console.error("FileReader error");
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  
  // Capture button
  captureBtn?.addEventListener('click', function() {
    try {
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
        
        // Draw shoe overlay if visible
        if (shoeOverlay.style.display === 'block') {
          ctx.save();
          const shoeX = parseInt(shoeOverlay.style.left) + shoeOverlay.width/2;
          const shoeY = parseInt(shoeOverlay.style.top) + shoeOverlay.height/2;
          ctx.translate(shoeX, shoeY);
          ctx.rotate(shoeRotation * Math.PI / 180);
          ctx.scale(shoeScale, shoeScale);
          ctx.drawImage(
            shoeOverlay, 
            -shoeOverlay.width/2, 
            -shoeOverlay.height/2, 
            shoeOverlay.width, 
            shoeOverlay.height
          );
          ctx.restore();
        }
        
        image.src = canvas.toDataURL('image/png');
        image.style.display = 'block';
        video.style.display = 'none';
        stopWebcam();
      } else if (image.style.display === 'block') {
        // For uploaded images
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth || image.width;
        tempCanvas.height = image.naturalHeight || image.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
        
        if (shoeOverlay.style.display === 'block') {
          tempCtx.save();
          const shoeX = parseInt(shoeOverlay.style.left) + shoeOverlay.width/2;
          const shoeY = parseInt(shoeOverlay.style.top) + shoeOverlay.height/2;
          tempCtx.translate(shoeX, shoeY);
          tempCtx.rotate(shoeRotation * Math.PI / 180);
          tempCtx.scale(shoeScale, shoeScale);
          tempCtx.drawImage(
            shoeOverlay, 
            -shoeOverlay.width/2, 
            -shoeOverlay.height/2, 
            shoeOverlay.width, 
            shoeOverlay.height
          );
          tempCtx.restore();
        }
        
        image.src = tempCanvas.toDataURL('image/png');
      }
      
      showToast('Image captured! Right-click to save.', 'success');
    } catch (error) {
      console.error("Capture error:", error);
      showToast("Error capturing image", "error");
    }
  });
  
  // Cancel button
  cancelBtn?.addEventListener('click', closeTryOnModal);
  
  // Zoom buttons
  zoomInBtn?.addEventListener('click', () => {
    if (currentZoomIndex < zoomLevels.length - 1) {
      currentZoomIndex++;
      shoeScale = zoomLevels[currentZoomIndex];
      updateShoeTransform();
      showToast(`Zoom: ${shoeScale.toFixed(1)}x`);
    } else {
      showToast("Maximum zoom reached", "warning");
    }
  });
  
  zoomOutBtn?.addEventListener('click', () => {
    if (currentZoomIndex > 0) {
      currentZoomIndex--;
      shoeScale = zoomLevels[currentZoomIndex];
      updateShoeTransform();
      showToast(`Zoom: ${shoeScale.toFixed(1)}x`);
    } else {
      showToast("Minimum zoom reached", "warning");
    }
  });
  
  zoomResetBtn?.addEventListener('click', () => {
    currentZoomIndex = 3; // Reset to index 3 (1.0)
    shoeScale = zoomLevels[currentZoomIndex];
    updateShoeTransform();
    showToast(`Zoom reset to ${shoeScale.toFixed(1)}x`);
  });
  
  // Rotation buttons
  rotateLeftBtn?.addEventListener('click', () => {
    shoeRotation -= 15;
    if (shoeRotation < 0) shoeRotation = 345;
    updateShoeTransform();
  });
  
  rotateRightBtn?.addEventListener('click', () => {
    shoeRotation += 15;
    if (shoeRotation >= 360) shoeRotation = 0;
    updateShoeTransform();
  });
  
  // Make shoe overlay draggable
  shoeOverlay.addEventListener('mousedown', startDrag);
  previewContainer?.addEventListener('mousemove', drag);
  previewContainer?.addEventListener('mouseup', endDrag);
  previewContainer?.addEventListener('mouseleave', endDrag);
  
  // Touch events for mobile
  shoeOverlay.addEventListener('touchstart', startDrag);
  previewContainer?.addEventListener('touchmove', drag);
  previewContainer?.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  try {
    isDragging = true;
    const rect = shoeOverlay.getBoundingClientRect();
    
    if (e.type === 'mousedown') {
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    } else if (e.type === 'touchstart') {
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
      e.preventDefault();
    }
  } catch (error) {
    console.error("Drag start error:", error);
    isDragging = false;
  }
}

function drag(e) {
  if (!isDragging || !shoeOverlay) return;
  
  try {
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
    
    let newLeft = clientX - containerRect.left - offsetX;
    let newTop = clientY - containerRect.top - offsetY;
    
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - shoeOverlay.width * shoeScale));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - shoeOverlay.height * shoeScale));
    
    shoeOverlay.style.left = newLeft + 'px';
    shoeOverlay.style.top = newTop + 'px';
  } catch (error) {
    console.error("Drag error:", error);
    endDrag();
  }
}

function endDrag() {
  isDragging = false;
}

function updateShoeTransform() {
  if (shoeOverlay) {
    shoeOverlay.style.transform = `rotate(${shoeRotation}deg) scale(${shoeScale})`;
  }
}

function initWebcam() {
  const videoPreview = document.getElementById('videoPreview');
  const previewInstructions = document.getElementById('previewInstructions');
  
  if (!videoPreview || !previewInstructions) return;
  
  const imagePreview = document.getElementById('imagePreview');
  if (imagePreview) {
    imagePreview.style.display = 'none';
  }
  
  // Stop any existing stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  
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
    
    videoPreview.onerror = function() {
      showToast('Error with video stream', 'error');
      console.error("Video element error");
    };
    
    videoPreview.addEventListener('play', function() {
      positionShoeOverlay();
    });
  })
  .catch(function(err) {
    console.error("Webcam access error:", err);
    showToast('Could not access webcam. Please try uploading a photo instead.', 'error');
    document.getElementById('uploadOption')?.click();
  });
}

function positionShoeOverlay() {
  const previewContainer = document.getElementById('previewContainer');
  if (!previewContainer || !shoeOverlay) return;
  
  const containerRect = previewContainer.getBoundingClientRect();
  
  // Set shoe overlay size
  const shoeWidth = containerRect.width * 0.3;
  
  shoeOverlay.style.width = shoeWidth + 'px';
  shoeOverlay.style.height = 'auto';
  
  // Position the shoe overlay at the bottom (for feet)
  const left = (containerRect.width - shoeWidth) / 2;
  const top = containerRect.height - shoeWidth * 1.2;
  
  shoeOverlay.style.left = left + 'px';
  shoeOverlay.style.top = top + 'px';
  shoeOverlay.style.display = 'block';
  
  // Update with current product image
  updateShoeOverlay(currentProduct.image);
}

function updateShoeOverlay(imageSrc) {
  if (!shoeOverlay) return;
  shoeOverlay.src = imageSrc;
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
  stopWebcam();
  stopImagePreview();
  
  const canvas = document.getElementById('canvasPreview');
  if (canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  
  if (shoeOverlay) {
    shoeOverlay.style.display = 'none';
  }
  
  currentZoomIndex = 3; // Reset to index 3 (1.0)
  shoeScale = zoomLevels[currentZoomIndex];
  shoeRotation = 0;
}