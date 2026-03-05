/* ================================================================
   McDONALD'S MENU SYSTEM — Shared JS engine (v2 — SCart powered)
   Used by: apparel.html, accessories.html, tech.html
   Requires: cart.js (SCart) loaded before this file.
   ================================================================ */

window.initMenuSystem = function (config) {

    if (config.stock && window.SCart) {
        Object.entries(config.stock).forEach(function (e) { SCart.registerStock(e[0], e[1]); });
    }

    var catTabs     = document.querySelectorAll('.cat-tab');
    var billSlides  = document.querySelectorAll('.billboard-slide');
    var cards       = document.querySelectorAll('.menu-card');
    var searchEl    = config.searchId ? document.getElementById(config.searchId) : null;
    var upsellStrip = document.getElementById('upsellStrip');
    var upsellRow   = document.getElementById('upsellRow');
    var trayBar     = document.getElementById('trayBar');
    var trayCount   = document.getElementById('trayCount');
    var trayTotal   = document.getElementById('trayTotal');
    var cartPanel   = document.getElementById('cartPanel');
    var cartBack    = document.getElementById('cartBackdrop');
    var cartClose   = document.getElementById('cartPanelClose');
    var cartItems   = document.getElementById('cartPanelItems');
    var cartPanelTotal = document.getElementById('cartPanelTotal');
    var modal       = document.getElementById('productModal');
    var modalBack   = document.getElementById('modalBackdrop');
    var modalClose  = document.getElementById('modalCloseBtn');
    var modalImg    = document.getElementById('modalImg');
    var modalName   = document.getElementById('modalName');
    var modalPrice  = document.getElementById('modalPrice');
    var modalDesc   = document.getElementById('modalDesc');
    var modalSpecs  = document.getElementById('modalSpecs');
    var modalAddBtn = document.getElementById('modalAddBtn');

    function getCardData(id) {
        var card = document.querySelector('.menu-card[data-id="' + id + '"]');
        if (!card) return null;
        return {
            id: id, name: card.dataset.name, price: parseInt(card.dataset.price),
            img: card.dataset.img || '', desc: card.dataset.desc || '',
            specs: JSON.parse(card.dataset.specs || '[]'),
            stock: card.dataset.stock !== undefined ? parseInt(card.dataset.stock) : Infinity,
            variants: card.dataset.variants || null,
        };
    }

    function switchCat(cat) {
        catTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.cat === cat); });
        billSlides.forEach(function (s) { s.classList.toggle('active', s.dataset.cat === cat); });
        cards.forEach(function (c) { c.style.display = (cat === 'all' || c.dataset.cat === cat) ? '' : 'none'; });
        renderUpsells(cat);
        if (searchEl && searchEl.value) filterSearch(searchEl.value);
    }
    catTabs.forEach(function (t) { t.addEventListener('click', function () { switchCat(t.dataset.cat); }); });

    function filterSearch(term) {
        term = term.toLowerCase();
        cards.forEach(function (c) {
            if (c.style.display === 'none' && term === '') return;
            var n = (c.querySelector('h3') || {}).textContent || '';
            var s = (c.querySelector('.card-sub') || {}).textContent || '';
            c.style.display = (n + s).toLowerCase().includes(term) ? '' : 'none';
        });
    }
    if (searchEl) searchEl.addEventListener('input', function () { filterSearch(searchEl.value); });

    function renderUpsells(cat) {
        var ids = (config.upsells || {})[cat];
        if (!ids || !ids.length || cat === 'all') { if (upsellStrip) upsellStrip.classList.remove('visible'); return; }
        if (!upsellRow) return;
        upsellRow.innerHTML = '';
        ids.forEach(function (id) {
            var d = getCardData(id); if (!d) return;
            var chip = document.createElement('div'); chip.className = 'upsell-chip';
            chip.innerHTML = '<img src="' + d.img + '" alt="' + d.name + '"><div class="upsell-chip-info"><span>' + d.name + '</span><small>R ' + d.price.toLocaleString() + '</small></div><button class="upsell-chip-add">+</button>';
            chip.querySelector('.upsell-chip-add').addEventListener('click', function (e) { e.stopPropagation(); addToCart(d.id, d.name, d.price, d.img); });
            upsellRow.appendChild(chip);
        });
        upsellStrip.classList.add('visible');
    }

    function addToCart(id, name, price, img, variant) {
        if (!window.SCart) return false;
        var ok = SCart.add(id, name, price, img, variant || null);
        if (ok) { updateTray(); renderCart(); flashTray(); }
        return ok;
    }

    function changeQty(key, delta) {
        if (!window.SCart) return;
        SCart.changeQty(key, delta); updateTray(); renderCart();
    }

    function flashTray() {
        if (!trayBar) return;
        trayBar.style.transform = 'translateY(-4px) scale(1.02)';
        setTimeout(function () { trayBar.style.transform = ''; }, 280);
    }

    function updateTray() {
        if (!window.SCart) return;
        var qty = SCart.itemCount(); var total = SCart.subtotal();
        if (trayCount) trayCount.textContent = qty;
        if (trayTotal) trayTotal.textContent = 'R ' + total.toLocaleString();
        if (trayBar) trayBar.classList.toggle('visible', qty > 0);
        document.querySelectorAll('#navBagCount, #bagCount, .bag-count').forEach(function (el) {
            el.textContent = qty; el.classList.toggle('visible', qty > 0); el.style.display = qty > 0 ? '' : 'none';
        });
    }

    function renderCart() {
        if (!cartItems || !window.SCart) return;
        var cart = SCart.getAll(); var entries = Object.entries(cart);
        if (entries.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart-msg"><div class="empty-cart-icon">🛍</div><p>Your bag is empty.</p><p class="empty-cart-sub">Browse the menu and add something.</p></div>';
        } else {
            cartItems.innerHTML = entries.map(function (e) {
                var key = e[0]; var item = e[1];
                return '<div class="cart-line"><img class="cart-line-img" src="' + item.img + '" alt="" onerror="this.style.display=\'none\'"><div class="cart-line-info"><h4>' + item.name + '</h4><span>R ' + item.price.toLocaleString() + ' each</span></div><div class="qty-stepper"><button class="qty-btn" data-key="' + key + '" data-d="-1">−</button><span class="qty-num">' + item.qty + '</span><button class="qty-btn" data-key="' + key + '" data-d="1">+</button></div><div class="cart-line-price">R ' + (item.price * item.qty).toLocaleString() + '</div></div>';
            }).join('');
            cartItems.querySelectorAll('.qty-btn').forEach(function (btn) {
                btn.addEventListener('click', function () { changeQty(btn.dataset.key, parseInt(btn.dataset.d)); });
            });
        }
        if (cartPanelTotal) cartPanelTotal.textContent = 'R ' + SCart.subtotal().toLocaleString();
    }

    function openCart() {
        if (!cartPanel) return;
        cartPanel.classList.add('open'); if (cartBack) cartBack.classList.add('visible');
        if (trayBar) trayBar.classList.add('open'); document.body.style.overflow = 'hidden'; renderCart();
    }
    function closeCart() {
        if (!cartPanel) return;
        cartPanel.classList.remove('open'); if (cartBack) cartBack.classList.remove('visible');
        if (trayBar) trayBar.classList.remove('open'); document.body.style.overflow = '';
    }

    if (trayBar) trayBar.addEventListener('click', function () { cartPanel && cartPanel.classList.contains('open') ? closeCart() : openCart(); });
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartBack) cartBack.addEventListener('click', closeCart);
    var navBagBtn = document.getElementById('navBagBtn');
    if (navBagBtn) navBagBtn.addEventListener('click', function () { cartPanel && cartPanel.classList.contains('open') ? closeCart() : openCart(); });

    if (window.SCart) SCart.onChange(function () { updateTray(); if (cartPanel && cartPanel.classList.contains('open')) renderCart(); });
    window.addEventListener('scart:update', function () { updateTray(); if (cartPanel && cartPanel.classList.contains('open')) renderCart(); });

    /* ── PRODUCT MODAL ── */
    function openModal(id) {
        var d = getCardData(id); if (!d || !modal) return;
        if (d.stock !== Infinity && window.SCart) SCart.registerStock(id, d.stock);
        modalImg.src = d.img; modalImg.alt = d.name;
        modalName.textContent = d.name; modalPrice.textContent = 'R ' + d.price.toLocaleString();
        modalDesc.textContent = d.desc;
        modalSpecs.innerHTML = d.specs.map(function (s) { return '<div class="modal-spec"><span>' + s[0] + '</span><strong>' + s[1] + '</strong></div>'; }).join('');

        // Variants
        var existingV = modal.querySelector('.modal-variants'); if (existingV) existingV.remove();
        if (d.variants) {
            try {
                var variants = JSON.parse(d.variants);
                var vEl = document.createElement('div'); vEl.className = 'modal-variants';
                vEl.innerHTML = Object.entries(variants).map(function (v) {
                    return '<div class="modal-variant-group"><div class="modal-variant-label">' + v[0] + '</div><div class="modal-variant-options">' +
                        v[1].map(function (opt) { return '<button class="modal-variant-btn" data-group="' + v[0] + '" data-val="' + opt + '">' + opt + '</button>'; }).join('') + '</div></div>';
                }).join('');
                modalSpecs.insertAdjacentElement('afterend', vEl);
                vEl.querySelectorAll('.modal-variant-btn').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        vEl.querySelectorAll('[data-group="' + btn.dataset.group + '"]').forEach(function (b) { b.classList.remove('active'); });
                        btn.classList.add('active');
                    });
                });
            } catch (e) {}
        }

        modalAddBtn.onclick = function () {
            var selectedVariant = null;
            var groups = modal.querySelectorAll('.modal-variant-group');
            if (groups.length > 0) {
                selectedVariant = {}; var allOk = true;
                groups.forEach(function (g) {
                    var active = g.querySelector('.modal-variant-btn.active');
                    var label  = g.querySelector('.modal-variant-label').textContent;
                    if (active) selectedVariant[label] = active.dataset.val;
                    else { allOk = false; g.querySelector('.modal-variant-options').classList.add('needs-selection'); setTimeout(function () { g.querySelector('.modal-variant-options').classList.remove('needs-selection'); }, 800); }
                });
                if (!allOk) return;
            }
            addToCart(d.id, d.name, d.price, d.img, selectedVariant);
            closeModal();
        };
        modal.classList.add('open'); document.body.style.overflow = 'hidden';
    }
    function closeModal() { if (modal) modal.classList.remove('open'); document.body.style.overflow = ''; }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBack) modalBack.addEventListener('click', closeModal);

    document.querySelectorAll('.icon-btn.info-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); openModal(btn.dataset.id); });
    });
    document.querySelectorAll('.icon-btn.add-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var d = getCardData(btn.dataset.id); if (!d) return;
            if (d.variants) { openModal(btn.dataset.id); return; }
            var ok = addToCart(d.id, d.name, d.price, d.img);
            if (ok) { btn.textContent = '✓'; btn.classList.add('added'); setTimeout(function () { btn.textContent = '🛒'; btn.classList.remove('added'); }, 900); }
        });
    });

    /* ── INIT ── */
    switchCat('all'); updateTray(); renderCart();
    if (window.SCart) {
        document.querySelectorAll('.menu-card[data-stock]').forEach(function (card) {
            var s = parseInt(card.dataset.stock); if (!isNaN(s)) SCart.registerStock(card.dataset.id, s);
        });
    }
};