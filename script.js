function toggleLoginDropdown() {
    document.getElementById("loginDropdown").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.login-btn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
};
        function viewProduct() {
            // Check if user is logged in (this is a placeholder, modify as needed)
            let isLoggedIn = false; // Replace with actual login check (e.g., from localStorage or session)
        
            if (!isLoggedIn) {
                alert("Please log in first to view this product!");
                window.location.href = "login.html"; // Redirect to login page
            } else {
                // Redirect to product details page (modify accordingly)
                window.location.href = "product-details.html";
            }
        }

        function isLoggedIn() {
            return localStorage.getItem("userLoggedIn") === "true";
        }
        
        // Function to handle cart click
        function handleCart() {
            if (isLoggedIn()) {
                // Redirect to the cart page if logged in
                window.location.href = "cart.html";
            } else {
                // Redirect to login page if not logged in
                alert("Please log in to access your cart.");
                window.location.href = "login.html";
            }
        }
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

        document.addEventListener("DOMContentLoaded", function() {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Unauthorized! Please log in.");
                window.location.href = "login.html";
            }
        });
    
         
        