
        document.querySelector('.seller-btn').addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'seller.html'; // Redirect to seller page
        });
        
        // Dropdown functionality for mobile (would need additional CSS for mobile)
        // This is a basic implementation for demonstration
        document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) { // Only for mobile
                    e.preventDefault();
                    const dropdown = this.nextElementSibling;
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                }
            });
        });
   