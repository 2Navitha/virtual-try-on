

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
        <button class="try-on">View Details</button>
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
}// Initialize when DOM is loaded
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
          <button class="try-on">View Details</button>
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