document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('productSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    // ================= SEARCH & FILTER LOGIC =================
    function filterProducts() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

        products.forEach(product => {
            const title = product.querySelector('h3').innerText.toLowerCase();
            const category = product.getAttribute('data-category');

            const matchesSearch = title.includes(searchTerm);
            const matchesFilter = (activeFilter === 'all' || category === activeFilter);

            if (matchesSearch && matchesFilter) {
                product.style.display = 'block';
                product.style.opacity = '1';
            } else {
                product.style.display = 'none';
                product.style.opacity = '0';
            }
        });
    }

    // Listener for Search
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // Listener for Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts();
        });
    });

    // ================= ADD TO BAG LOGIC =================
    const addButtons = document.querySelectorAll('.quick-add');
    
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const name = card.querySelector('h3').innerText;
            const price = card.querySelector('.price').innerText;

            const newItem = { name, price };

            // Push to the global cart and update UI
            if (window.cart && window.updateCartUI) {
                window.cart.push(newItem);
                window.updateCartUI();
                
                // Open Sidebar for feedback
                document.getElementById('cartSidebar').classList.add('open');
                document.getElementById('overlay').classList.add('active');
                
                // Button feedback
                const originalText = btn.innerText;
                btn.innerText = "Added!";
                setTimeout(() => { btn.innerText = originalText; }, 1000);
            }
        });
    });
});