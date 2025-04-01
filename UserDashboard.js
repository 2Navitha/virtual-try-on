document.addEventListener("DOMContentLoaded", () => {
    const cart = document.getElementById("cart");
    const wishlist = document.getElementById("wishlist");
    const cartCount = document.getElementById("cartCount");
    const userDropdown = document.getElementById("userDropdown");
    let cartItems = [];

    function openCart() {
        cart.classList.add("open");
        closeUserMenu(); // Hide profile dropdown when opening cart
    }

    function closeCart() {
        cart.classList.remove("open");
    }

    function openWishlist() {
        wishlist.classList.add("open");
    }

    function closeWishlist() {
        wishlist.classList.remove("open");
    }

    function toggleUserMenu() {
        if (userDropdown.style.display === "block") {
            userDropdown.style.display = "none";
        } else {
            userDropdown.style.display = "block";
        }
    }

    function closeUserMenu() {
        userDropdown.style.display = "none"; // Hide the dropdown
    }

    function addToCart(item) {
        cartItems.push(item);
        cartCount.textContent = cartItems.length;
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const cartList = document.getElementById("cartItems");
        cartList.innerHTML = cartItems.map(item => `<p>${item}</p>`).join('');
    }

    document.getElementById("cartButton").addEventListener("click", openCart);
    document.getElementById("profileButton").addEventListener("click", toggleUserMenu);

    window.openCart = openCart;
    window.closeCart = closeCart;
    window.openWishlist = openWishlist;
    window.closeWishlist = closeWishlist;
    window.toggleUserMenu = toggleUserMenu;
    window.addToCart = addToCart;
});

var swiper = new Swiper(".swiper-container", {
    loop: true,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
});