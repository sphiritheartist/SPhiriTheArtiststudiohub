document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    // ================= SEARCH & FILTER =================
    function filterProducts() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

        products.forEach(function(product) {
            const titleEl = product.querySelector('h3');
            const title = titleEl ? titleEl.innerText.toLowerCase() : '';
            const category = product.getAttribute('data-category');

            const matchesSearch = title.includes(searchTerm);
            const matchesFilter = (activeFilter === 'all' || category === activeFilter);

            product.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterProducts);

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            filterProducts();
        });
    });

    // ================= ADD TO BAG =================
    document.querySelectorAll('.quick-add').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = btn.closest('.product-card');
            const nameEl = card.querySelector('h3');
            const priceEl = card.querySelector('.price');
            if (!nameEl || !priceEl) return;

            const item = { name: nameEl.innerText, price: priceEl.innerText };
            window.cart.push(item);

            // Use the shared cart renderer from global.js
            if (typeof window.updateCartUI === 'function') window.updateCartUI();

            // Open sidebar
            const cartSidebar = document.getElementById('cartSidebar');
            const overlay = document.getElementById('overlay');
            if (cartSidebar) cartSidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');

            const orig = btn.innerText;
            btn.innerText = 'Added!';
            setTimeout(function() { btn.innerText = orig; }, 1000);
        });
    });
});