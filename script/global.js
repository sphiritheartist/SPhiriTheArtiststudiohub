/* =============================================================
   SPHIRITHEARTIST — global.js
   Handles: theme, nav load, lightbox, reveal
   Cart is now handled by SCart (cart.js)
   ============================================================= */

// Wait for cart.js to load first
function waitForSCart(callback) {
    if (window.SCart) {
        callback();
    } else {
        setTimeout(function() { waitForSCart(callback); }, 50);
    }
}

// ---------- THEME ----------
function initTheme() {
    const t = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
}
window.toggleTheme = function() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
};

// ---------- COMPONENT LOADER ----------
async function loadComponents() {
    // Determine which nav to load based on current page
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const isSkatePage = page === 'skate.html';
    const navFile = isSkatePage ? 'skate-nav.html' : 'nav.html';
    
    // Nav
    const navEl = document.getElementById('nav-placeholder');
    if (navEl) {
        try {
            const html = await fetch(navFile).then(r => r.text());
            navEl.innerHTML = html;
            initNav();
            initBagBtn();
            initAccountBtn();
            highlightActiveLink();
        } catch(e) { console.warn('nav load failed', e); }
    }
    // Footer
    const footEl = document.getElementById('footer-placeholder');
    if (footEl) {
        try {
            const html = await fetch('footer.html').then(r => r.text());
            footEl.innerHTML = html;
        } catch(e) { console.warn('footer load failed', e); }
    }
}

// ---------- NAV: HAMBURGER + BACKDROP ----------
function initNav() {
    const btn      = document.getElementById('hamburgerBtn');
    const links    = document.getElementById('navLinks');
    const backdrop = document.getElementById('navBackdrop');
    if (!btn || !links) return;

    function openMenu() {
        links.classList.add('open');
        backdrop.classList.add('visible');
        btn.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        links.classList.remove('open');
        backdrop.classList.remove('visible');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', () => {
        btn.classList.contains('open') ? closeMenu() : openMenu();
    });
    backdrop.addEventListener('click', closeMenu);

    // Close on link click (mobile)
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMenu);
    });
}

// ---------- HIGHLIGHT ACTIVE NAV LINK ----------
function highlightActiveLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === page) a.classList.add('active');
    });
}

// ---------- NAV BAG BUTTON ----------
function initBagBtn() {
    const btn = document.getElementById('navBagBtn');
    if (btn) {
        btn.addEventListener('click', openCart);
    }
}

// ---------- NAV ACCOUNT BUTTON ----------
function initAccountBtn() {
    const btn = document.getElementById('navAccountBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        // Evaluate studioAuth at click time, not wire time
        const auth = window.studioAuth;
        if (!auth) {
            // auth.js not ready — dashboard will handle the gate
            window.location.href = 'dashboard.html';
            return;
        }
        if (auth.isSignedIn) {
            window.location.href = 'dashboard.html';
        } else {
            auth.openSignIn();
        }
    });

    // Signal to auth.js that nav DOM exists and icon can be rendered
    window.dispatchEvent(new CustomEvent('navReady'));
}

// ---------- CART OPEN / CLOSE ----------
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    renderCart();
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
}
function closeCartUI() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ---------- CART ENGINE (using SCart) ----------
function updateBagCount() {
    if (!window.SCart) return;
    const count = window.SCart.itemCount();
    // Shared nav count badge
    const badge = document.getElementById('navBagCount');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('visible', count > 0);
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    // Legacy text button (some pages)
    const legacyBtn = document.querySelector('.bag-btn');
    if (legacyBtn) legacyBtn.innerText = 'Bag (' + count + ')';
}

function renderCart() {
    const list  = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    if (!list || !window.SCart) return;

    const cart = window.SCart.getAll();
    const entries = Object.entries(cart);

    if (entries.length === 0) {
        list.innerHTML = '<li style="color:var(--muted);font-size:13px;text-align:center;padding:40px 0;">Your bag is empty.</li>';
    } else {
        list.innerHTML = entries.map(function(e, i) {
            var item = e[1];
            return '<li class="cart-item">' +
                '<div class="cart-item-info">' +
                    '<h4>' + item.name + '</h4>' +
                    '<span>R ' + item.price.toLocaleString() + '</span>' +
                '</div>' +
                '<button class="remove-item" data-key="' + e[0] + '">×</button>' +
            '</li>';
        }).join('');

        // Wire remove buttons
        list.querySelectorAll('.remove-item').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.SCart.remove(btn.dataset.key);
            });
        });
    }

    const subtotal = window.SCart.subtotal();
    if (total) total.innerText = 'Total: R ' + subtotal.toLocaleString();
}

// Unified addToBag that works with SCart
window.addToBag = function(item) {
    if (!window.SCart) return false;
    
    if (!item) {
        // 3D studio configurator fallback
        const typeEl  = document.getElementById('projectType');
        const totalEl = document.getElementById('totalDisplay');
        if (!typeEl || !totalEl) return;
        var price = parseFloat(totalEl.innerText.replace(/[^\d.]/g, '')) || 0;
        item = { 
            name: '3D Print (' + typeEl.options[typeEl.selectedIndex].text + ')', 
            price: price,
            img: ''
        };
    }

    // Handle both object and legacy formats
    var id = item.id || 'item_' + Date.now();
    var name = item.name;
    var price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
    var img = item.img || '';

    var ok = window.SCart.add(id, name, price, img);
    if (ok) {
        updateBagCount();
        renderCart();
        openCart();
    }
    return ok;
};

window.removeFromCart = function(key) {
    if (!window.SCart) return;
    window.SCart.remove(key);
    updateBagCount();
    renderCart();
};

// Alias for menu-system.js
window.updateCartUI = function() { 
    updateBagCount(); 
    renderCart(); 
};

// ---------- 3D CALCULATOR ----------
window.updateCalculator = function() {
    const q = document.getElementById('quality');
    const d = document.getElementById('totalDisplay');
    if (q && d) d.innerText = `R ${(150 * parseFloat(q.value)).toFixed(2)}`;
};

// ---------- LIGHTBOX ----------
function initLightbox() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');

    document.querySelectorAll('.media-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const i = card.querySelector('img');
            const c = card.querySelector('.overlay span');
            if (!i) return;
            img.src = i.src;
            img.alt = i.alt;
            if (cap && c) cap.innerText = c.innerText;
            box.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    box.addEventListener('click', () => {
        box.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// ---------- CART SIDEBAR CLOSE WIRING ----------
function initCartSidebar() {
    const closeBtn = document.getElementById('closeCart');
    const overlay  = document.getElementById('overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeCartUI);
    if (overlay)  overlay.addEventListener('click', closeCartUI);

    // Checkout expand
    const trigger = document.getElementById('checkoutTrigger');
    const form    = document.getElementById('checkoutForm');
    if (trigger && form) {
        trigger.addEventListener('click', () => {
            const open = form.style.display !== 'none';
            form.style.display = open ? 'none' : 'block';
            trigger.innerText = open ? 'Proceed to Checkout' : '← Back';
        });
    }
}

// ---------- REVEAL OBSERVER ----------
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    els.forEach(el => obs.observe(el));

    // Fallback: activate any .reveal elements already in viewport after a short delay
    setTimeout(() => {
        els.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('active');
            }
        });
    }, 300);
}

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadComponents();
    initCartSidebar();
    initReveal();
    initLightbox();
    if (document.getElementById('calcForm')) window.updateCalculator();
    
    // Initialize cart listeners after SCart is ready
    waitForSCart(function() {
        window.SCart.onChange(function() {
            updateBagCount();
            renderCart();
        });
        // Initial badge update
        updateBagCount();
    });
});

// ---------- LOADING OVERLAY ----------
window.showLoading = function(message) {
    var existing = document.getElementById('sphiriLoading');
    if (existing) {
        existing.remove();
    }
    var overlay = document.createElement('div');
    overlay.id = 'sphiriLoading';
    overlay.innerHTML = '<div class="sphiri-loading-box"><div class="sphiri-spinner"></div><p>' + (message || 'Loading...') + '</p></div>';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
};

window.hideLoading = function() {
    var overlay = document.getElementById('sphiriLoading');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
    }
};
