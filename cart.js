document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    updateCartUI();
    
    // Event delegation for dynamic elements
    document.getElementById('cartContent').addEventListener('click', function(e) {
      // Handle quantity decrease
      if (e.target.classList.contains('minus') || e.target.parentElement.classList.contains('minus')) {
        const button = e.target.classList.contains('minus') ? e.target : e.target.parentElement;
        const productId = parseInt(button.getAttribute('data-id'));
        updateQuantity(productId, -1);
      }
      
      // Handle quantity increase
      if (e.target.classList.contains('plus') || e.target.parentElement.classList.contains('plus')) {
        const button = e.target.classList.contains('plus') ? e.target : e.target.parentElement;
        const productId = parseInt(button.getAttribute('data-id'));
        updateQuantity(productId, 1);
      }
      
      // Handle item removal
      if (e.target.classList.contains('remove-item') || 
          e.target.parentElement.classList.contains('remove-item')) {
        const button = e.target.classList.contains('remove-item') ? e.target : e.target.parentElement;
        const productId = parseInt(button.getAttribute('data-id'));
        removeItem(productId);
      }
    });
    
    // Checkout button
    document.getElementById('checkoutBtn')?.addEventListener('click', proceedToCheckout);
  });
  
  function updateCartUI() {
    const cart = getCart();
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    const itemCount = document.getElementById('itemCount');
    
    // Update item count
    const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    itemCount.textContent = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`;
    
    // Empty cart state
    if (cart.length === 0) {
      emptyCart.style.display = 'flex';
      cartContent.innerHTML = '';
      updateOrderSummary();
      updateHeaderCounters();
      return;
    }
    
    emptyCart.style.display = 'none';
    
    // Render cart items
    cartContent.innerHTML = cart.map(item => {
      // Ensure price is properly formatted
      const price = typeof item.price === 'number' ? item.price : 
                   typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g,"")) : 0;
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      
      return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img">
          <img src="${item.image || 'https://via.placeholder.com/120?text=Product+Image'}" alt="${item.name || 'Product'}">
        </div>
        <div class="cart-item-details">
          <h3>${item.name || 'Product'}</h3>
          <p class="desc">${item.desc || 'No description available'}</p>
          <div class="price">₹${price.toLocaleString('en-IN')}</div>
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-id="${item.id}">
              <i class='bx bx-minus'></i>
            </button>
            <span class="quantity">${quantity}</span>
            <button class="quantity-btn plus" data-id="${item.id}">
              <i class='bx bx-plus'></i>
            </button>
          </div>
        </div>
        <div class="cart-item-actions">
          <button class="remove-item" data-id="${item.id}" title="Remove item">
            <i class='bx bx-trash'></i>
          </button>
          <div class="item-total">₹${itemTotal.toLocaleString('en-IN')}</div>
        </div>
      </div>
      `;
    }).join('');
    
    updateOrderSummary();
    updateHeaderCounters();
  }
  
  function updateOrderSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : 
                   typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g,"")) : 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
    
    const discount = calculateDiscount(cart, subtotal);
    const total = subtotal - discount;
    
    document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('discount').textContent = `-₹${discount.toLocaleString('en-IN')}`;
    document.getElementById('total').textContent = `₹${total.toLocaleString('en-IN')}`;
  }
  
  function calculateDiscount(cart, subtotal) {
    // Apply 10% discount if subtotal is over ₹5000
    return subtotal > 5000 ? Math.round(subtotal * 0.1) : 0;
  }
  
  function updateQuantity(productId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex >= 0) {
      cart[itemIndex].quantity = (cart[itemIndex].quantity || 1) + change;
      
      // Remove item if quantity becomes 0 or less
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
        showToast('Item removed from cart', 'error');
      } else {
        showToast(`Quantity updated to ${cart[itemIndex].quantity}`, 'success');
      }
      
      saveCart(cart);
      updateCartUI();
    }
  }
  
  function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    showToast('Item removed from cart', 'error');
    updateCartUI();
  }
  
  function proceedToCheckout() {
    const cart = getCart();
    
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    showToast('Proceeding to checkout', 'success');
    // window.location.href = '/checkout.html';
  }
  
  // Helper functions
  function getCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Ensure all items have proper quantity
    return cart.map(item => ({
      ...item,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1
    }));
  }
  
  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  
  function updateHeaderCounters() {
    const cart = getCart();
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // Update cart counter
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
      const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      cartCounter.textContent = totalItems;
      cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update wishlist counter
    const wishlistCounter = document.getElementById('wishlistCounter');
    if (wishlistCounter) {
      wishlistCounter.textContent = wishlist.length;
      wishlistCounter.style.display = wishlist.length > 0 ? 'flex' : 'none';
    }
  }
  
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error'}'>${type === 'success' ? '✓' : '✗'}</i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }