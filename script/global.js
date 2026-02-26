/* =============================================================
   SPHIRITHEARTIST — global.js
   Handles: theme, nav load, cart engine, lightbox, reveal
   ============================================================= */

window.cart = window.cart || [];

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
    // Nav
    const navEl = document.getElementById('nav-placeholder');
    if (navEl) {
        try {
            const html = await fetch('nav.html').then(r => r.text());
            navEl.innerHTML = html;
            initNav();
            initBagBtn();
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

// ---------- CART ENGINE ----------
function updateBagCount() {
    const count = window.cart.length;
    // Shared nav count badge
    const badge = document.getElementById('navBagCount');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('visible', count > 0);
    }
    // Legacy text button (some pages)
    const legacyBtn = document.querySelector('.bag-btn');
    if (legacyBtn) legacyBtn.innerText = `Bag (${count})`;
}

function renderCart() {
    const list  = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    if (!list) return;

    if (window.cart.length === 0) {
        list.innerHTML = '<li style="color:var(--muted);font-size:13px;text-align:center;padding:40px 0;">Your bag is empty.</li>';
    } else {
        list.innerHTML = window.cart.map((item, i) => `
            <li class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>${item.price}</span>
                </div>
                <button class="remove-item" onclick="window.removeFromCart(${i})">×</button>
            </li>`).join('');
    }

    const sum = window.cart.reduce((acc, item) => {
        const v = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
        return acc + (isNaN(v) ? 0 : v);
    }, 0);
    if (total) total.innerText = `Total: R ${sum.toFixed(2)}`;
}

window.addToBag = function(item) {
    if (!item) {
        // 3D studio configurator fallback
        const typeEl  = document.getElementById('projectType');
        const totalEl = document.getElementById('totalDisplay');
        if (!typeEl || !totalEl) return;
        item = { name: `3D Print (${typeEl.options[typeEl.selectedIndex].text})`, price: totalEl.innerText };
    }
    if (typeof item.price === 'number') item.price = `R ${item.price.toFixed(2)}`;
    window.cart.push(item);
    updateBagCount();
    renderCart();
    openCart();
};

window.removeFromCart = function(i) {
    window.cart.splice(i, 1);
    updateBagCount();
    renderCart();
};

// Alias for shop.js
window.updateCartUI = function() { updateBagCount(); renderCart(); };

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
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadComponents();
    initCartSidebar();
    initReveal();
    initLightbox();
    if (document.getElementById('calcForm')) window.updateCalculator();
});