// ================= GLOBAL STATE =================
window.cart = [];

// ================= THEME LOGIC =================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

// ================= COMPONENT LOADER =================
async function loadComponents() {
    // 1. Load Navigation
    const navSpace = document.getElementById('nav-placeholder');
    if (navSpace) {
        try {
            const response = await fetch('nav.html');
            const data = await response.text();
            navSpace.innerHTML = data;
            
            // CRITICAL: Initialize listener ONLY after the nav HTML is on the page
            initBagListener(); 
        } catch (err) {
            console.error("Nav load failed:", err);
        }
    }

    // 2. Load Footer
    const footerSpace = document.getElementById('footer-placeholder');
    if (footerSpace) {
        try {
            const response = await fetch('footer.html');
            const data = await response.text();
            footerSpace.innerHTML = data;
        } catch (err) {
            console.error("Footer load failed:", err);
        }
    }
}

// ================= SHOPPING BAG LOGIC =================
function initBagListener() {
    const bagBtn = document.querySelector('.bag-btn');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeCart');

    if (bagBtn && cartSidebar) {
        bagBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('open');
            overlay.classList.add('active');
            renderCart();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ================= 3D STUDIO CALCULATOR (PLA ONLY) =================
window.updateCalculator = function() {
    const qualitySelect = document.getElementById('quality');
    const totalDisplay = document.getElementById('totalDisplay');

    if (qualitySelect && totalDisplay) {
        const baseFee = 150; // Starting price for Ender 6 / Replicator+
        const qualityMultiplier = parseFloat(qualitySelect.value);
        
        // Note: PLA material multiplier is fixed at 1.0 for this version
        const total = baseFee * qualityMultiplier;
        totalDisplay.innerText = `R ${total.toFixed(2)}`;
    }
};

// ================= CART ENGINE =================
window.addToBag = function(item = null) {
    // If no item passed, it's a 3D Print request from the configurator
    if (!item) {
        const type = document.getElementById('projectType').value;
        const total = document.getElementById('totalDisplay').innerText;
        item = {
            id: '3d-' + Date.now(),
            name: `3D Print: ${type}`,
            price: total,
            img: 'assets/images/studio/3d-placeholder.jpg'
        };
    }

    window.cart.push(item);
    updateBagCount();
    renderCart();
    
    // Auto-open bag to show success
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (cartSidebar && overlay) {
        cartSidebar.classList.add('open');
        overlay.classList.add('active');
    }
};

function updateBagCount() {
    const bagBtn = document.querySelector('.bag-btn');
    if (bagBtn) {
        bagBtn.innerText = `Bag (${window.cart.length})`;
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems) return;

    cartItems.innerHTML = window.cart.map((item, index) => `
        <li class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>${item.price}</span>
            </div>
            <button onclick="removeFromCart(${index})" class="remove-item">&times;</button>
        </li>
    `).join('');

    // Sum logic (stripping "R " and parsing)
    const sum = window.cart.reduce((acc, item) => {
        const value = parseFloat(item.price.replace('R ', '').replace(',', ''));
        return acc + value;
    }, 0);

    if (cartTotal) cartTotal.innerText = `Total: R ${sum.toFixed(2)}`;
}

window.removeFromCart = function(index) {
    window.cart.splice(index, 1);
    updateBagCount();
    renderCart();
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadComponents();
    
    // Initialize 3D calculator if on studio page
    if (document.getElementById('calcForm')) {
        updateCalculator();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});