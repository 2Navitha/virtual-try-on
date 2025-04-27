document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const cartButton = document.getElementById("cartButton");
    const cartCount = document.getElementById("cartCount");
    const profileButton = document.getElementById("profileButton");
    const userDropdown = document.getElementById("userDropdown");
    const logoutLink = document.getElementById("logoutLink");
    const searchInput = document.querySelector(".search-box input");
    const productContainer = document.querySelector(".product-container");
    const BASE_URL = "http://localhost:8081/api";

    // State
    let products = [];
    let user = null;
    let cart = [];

    // Initialize
    init();

    async function init() {
        try {
            await checkAuthStatus();
            await fetchProducts();
            await fetchCart();
            setupEventListeners();
            initSwiper();
        } catch (error) {
            console.error("Initialization error:", error);
            showError("Failed to initialize. Please refresh.");
        }
    }

    // Initialize Swiper
    function initSwiper() {
        new Swiper('.swiper-container', {
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
        });
    }

    // Authentication
    async function checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    user = await response.json();
                    profileButton.textContent = user.username || 'Profile';
                }
            } catch (error) {
                console.error("Auth error:", error);
            }
        }
    }

    // Product Fetching
    async function fetchProducts() {
        try {
            showLoading();
            const response = await fetch(`${BASE_URL}/products`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error("Fetch error:", error);
            // showError("Failed to load products. Please try later.");
        } finally {
            hideLoading();
        }
    }

    // Cart Functions
    async function fetchCart() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${BASE_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                cart = await response.json();
                updateCartCount();
            }
        } catch (error) {
            console.error("Cart fetch error:", error);
        }
    }

    async function addToCart(productId) {
        try {
            if (!user) {
                showNotification('Please login to add items to cart', 'error');
                return;
            }

            showLoading();
            const response = await fetch(`${BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });

            if (response.ok) {
                showNotification('Item added to cart!', 'success');
                await fetchCart();
            } else {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add item to cart', 'error');
        } finally {
            hideLoading();
        }
    }

    function updateCartCount() {
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0) || '0';
    }

    // Search Functionality
    async function searchProducts() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            renderProducts(products);
            return;
        }

        // Direct matches for quick redirects
        const quickRedirects = {
            'bag': 'bags.html',
            'bags': 'bags.html',
            'shoe': 'shoes.html',
            'shoes': 'shoes.html',
            'watch': 'smartwatches.html',
            'watches': 'smartwatches.html',
            'sunglass': 'sunglasses.html',
            'sunglasses': 'sunglasses.html',
            't-shirt': 't-shirts.html',
            't-shirts': 't-shirts.html',
            'headphone': 'headphones.html',
            'headphones': 'headphones.html',
            'mobile': 'smartphones.html',
            'mobiles': 'smartphones.html',
            'laptop': 'laptops.html',
            'laptops': 'laptops.html',
            'shirt': 'shirts.html',
            'shirts': 'shirts.html'
        };

        // Check for direct match first
        if (quickRedirects[query]) {
            window.location.href = `/Product-details/${quickRedirects[query]}`;
            return;
        }

        try {
            showLoading();
            const response = await fetch(`${BASE_URL}/products/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const results = await response.json();
            
            if (results.length === 0) {
                showNoResults(query);
            } else if (results.length === 1) {
                window.location.href = `/product-detail.html?id=${results[0].id}`;
            } else {
                renderProducts(results);
            }
        } catch (error) {
            console.error("Search failed:", error);
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.description && p.description.toLowerCase().includes(query))
            );
            filtered.length > 0 ? renderProducts(filtered) : showNoResults(query);
        } finally {
            hideLoading();
        }
    }

    function showNoResults(query) {
        productContainer.innerHTML = `
            <div class="no-results">
                <p>No products found for "${query}"</p>
                <button onclick="window.location.href='/UserDashboard.html'">Back to Home</button>
            </div>
        `;
    }

    // Product Rendering
    function renderProducts(productsToRender) {
        if (!productsToRender || productsToRender.length === 0) {
            productContainer.innerHTML = '<div class="no-products">No products available</div>';
            return;
        }

        productContainer.innerHTML = productsToRender.map(product => `
            <div class="product" data-id="${product.id}">
                <img src="${product.imageUrl || '/images/default-product.jpg'}" 
                     alt="${product.name}" 
                     onerror="this.src='/images/default-product.jpg'">
                <h3>${product.name}</h3>
                <p class="price">₹${(product.price || 0).toFixed(2)}</p>
                ${product.discount ? `<p class="offer">${product.discount}% Off</p>` : ''}
                <div class="product-actions">
                    <button class="view-btn" onclick="viewProduct(${product.id})">View Product</button>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        `).join('');
    }

    // Profile Dropdown Functions
    function toggleProfileDropdown() {
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    }

    function closeProfileDropdown() {
        userDropdown.style.display = 'none';
    }

    function logout() {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }

    // Cart Modal Functions
    function openCartModal() {
        // Implement your cart modal opening logic here
        console.log("Cart opened");
        renderCartItems();
    }

    async function renderCartItems() {
        // Implement your cart items rendering logic here
        console.log("Rendering cart items");
    }

    // UI Helpers
    function showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loading);
    }

    function hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) loading.remove();
    }

    function showError(message) {
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(el => el.remove());
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        productContainer.appendChild(errorElement);
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Event Listeners
    function setupEventListeners() {
        // Profile dropdown
        profileButton.addEventListener('click', toggleProfileDropdown);
        logoutLink.addEventListener('click', logout);
        
        // Cart button
        cartButton.addEventListener('click', openCartModal);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#profileButton') && !e.target.closest('#userDropdown')) {
                closeProfileDropdown();
            }
        });

        // Search input
        searchInput.addEventListener('input', debounce(searchProducts, 500));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchProducts();
        });
    }

    // Utility
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Global functions
    window.viewProduct = (id) => {
        window.location.href = `/product-detail.html?id=${id}`;
    };

    window.addToCart = addToCart;
});