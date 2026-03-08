/* ================================================================
   SPHIRI UNIFIED CART ENGINE — cart.js
   Cross-page persistent cart using localStorage.
   Replaces per-page cart state in menu-system.js and skate.js.
   All shop pages use window.SCart API.
   ================================================================ */

(function () {
    'use strict';

    const STORAGE_KEY    = 'sphiri_cart_v2';
    const STOCK_KEY      = 'sphiri_stock_v1';
    const DELIVERY_FEE   = 100;
    const FREE_DELIVERY_THRESHOLD = 1500; // free delivery above this

    /* ── STOCK REGISTRY (keyed by product id) ─────────────────
       Pages can register stock via: SCart.registerStock(id, qty)
       Defaults to Infinity if unregistered.
       Suppliers can add/remove/update stock
    ─────────────────────────────────────────────────────────── */
    var stockRegistry = {};

    /* ── LOAD / SAVE with error handling ───────────────────── */
    function load() {
        try { 
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); 
        } catch (e) { 
            console.warn('SCart: load failed', e);
            return {}; 
        }
    }
    function save(cart) {
        try { 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); 
        } catch (e) { 
            console.warn('SCart: save failed', e);
            // Handle private browsing mode
            showToast('Storage unavailable. Some features may not work.', true);
        }
    }

    // Stock management
    function loadStock() {
        try {
            return JSON.parse(localStorage.getItem(STOCK_KEY) || '{}');
        } catch (e) { return {}; }
    }
    function saveStock(stock) {
        try {
            localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
        } catch (e) { console.warn('SCart: saveStock failed', e); }
    }

    /* ── COMPUTATIONS ─────────────────────────────────────────── */
    function subtotal(cart) {
        return Object.values(cart).reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    }
    function itemCount(cart) {
        return Object.values(cart).reduce(function (s, i) { return s + i.qty; }, 0);
    }
    function deliveryFee(cart, method) {
        if (method !== 'delivery') return 0;
        return subtotal(cart) >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    }
    function grandTotal(cart, method) {
        return subtotal(cart) + deliveryFee(cart, method);
    }

    /* ── CART KEY: id + variant hash ─────────────────────────── */
    function cartKey(id, variant) {
        if (!variant) return id;
        return id + '__' + Object.values(variant).join('_').replace(/\s+/g, '-').toLowerCase();
    }

    /* ── TOAST NOTIFICATION ── */
    function showToast(msg, isErr) {
        var t = document.getElementById('scartToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'scartToast';
            t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(12px);' +
                'background:#1d1d1f;color:#fff;padding:10px 22px;border-radius:980px;font-size:13px;font-weight:700;' +
                'z-index:99999;opacity:0;transition:opacity 0.25s,transform 0.25s;pointer-events:none;white-space:nowrap;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.background = isErr ? '#ff3b30' : '#1d1d1f';
        t.style.opacity    = '1';
        t.style.transform  = 'translateX(-50%) translateY(0)';
        clearTimeout(t._timer);
        t._timer = setTimeout(function () {
            t.style.opacity   = '0';
            t.style.transform = 'translateX(-50%) translateY(12px)';
        }, 2200);
    }

    /* ── PUBLIC API ──────────────────────────────────────────── */
    var SCart = {

        DELIVERY_FEE: DELIVERY_FEE,
        FREE_DELIVERY_THRESHOLD: FREE_DELIVERY_THRESHOLD,

        // Stock management
        registerStock: function (id, qty) {
            stockRegistry[id] = qty;
        },

        // Get current stock level for a product
        getStock: function(id) {
            if (stockRegistry[id] !== undefined) return stockRegistry[id];
            var saved = loadStock();
            return saved[id] !== undefined ? saved[id] : Infinity;
        },

        // Supplier/Admin: Update stock for a product
        setStock: function(id, qty) {
            stockRegistry[id] = qty;
            var saved = loadStock();
            saved[id] = qty;
            saveStock(saved);
            // Notify all open tabs
            window.dispatchEvent(new CustomEvent('scart:stockUpdate', { detail: { id: id, qty: qty } }));
        },

        // Supplier/Admin: Add stock (increase)
        addStock: function(id, qty) {
            var current = SCart.getStock(id);
            if (current === Infinity) current = 0;
            SCart.setStock(id, current + qty);
        },

        // Supplier/Admin: Remove stock (decrease)
        removeStock: function(id, qty) {
            var current = SCart.getStock(id);
            if (current === Infinity) return;
            SCart.setStock(id, Math.max(0, current - qty));
        },

        // Get all stock levels
        getAllStock: function() {
            var saved = loadStock();
            return Object.assign({}, stockRegistry, saved);
        },

        getAll: function () { return load(); },

        add: function (id, name, price, img, variant, source) {
            var cart = load();
            var key  = cartKey(id, variant);
            var stock = SCart.getStock(id);

            if (cart[key]) {
                if (cart[key].qty >= stock) {
                    showToast('Only ' + stock + ' in stock', true);
                    return false;
                }
                cart[key].qty++;
            } else {
                if (stock < 1) {
                    showToast('Out of stock', true);
                    return false;
                }
                cart[key] = {
                    id: id,
                    name: name + (variant ? ' — ' + Object.values(variant).join(' / ') : ''),
                    price: price,
                    img: img || '',
                    qty: 1,
                    variant: variant || null,
                    source: source || window.location.pathname.split('/').pop() || '',
                    addedAt: Date.now(),
                };
            }
            save(cart);
            SCart._broadcast();
            return true;
        },

        remove: function (key) {
            var cart = load();
            delete cart[key];
            save(cart);
            SCart._broadcast();
        },

        changeQty: function (key, delta) {
            var cart = load();
            if (!cart[key]) return;
            var id    = cart[key].id;
            var stock = SCart.getStock(id);
            cart[key].qty = Math.max(0, Math.min(cart[key].qty + delta, stock));
            if (cart[key].qty === 0) delete cart[key];
            save(cart);
            SCart._broadcast();
        },

        clear: function () {
            save({});
            SCart._broadcast();
        },

        subtotal: function () { return subtotal(load()); },
        itemCount: function () { return itemCount(load()); },
        deliveryFee: function (method) { return deliveryFee(load(), method); },
        grandTotal: function (method) { return grandTotal(load(), method); },

        // Saved addresses (for return customers)
        getSavedAddress: function () {
            try { return JSON.parse(localStorage.getItem('sphiri_saved_address') || 'null'); }
            catch (e) { return null; }
        },
        saveAddress: function (addr) {
            try { localStorage.setItem('sphiri_saved_address', JSON.stringify(addr)); }
            catch (e) { showToast('Could not save address', true); }
        },

        // Order history
        saveOrder: function (order) {
            try {
                var orders = JSON.parse(localStorage.getItem('sphiri_orders') || '[]');
                orders.unshift(order);
                if (orders.length > 50) orders = orders.slice(0, 50);
                localStorage.setItem('sphiri_orders', JSON.stringify(orders));
                
                // Decrease stock for each item ordered
                order.items.forEach(function(item) {
                    SCart.removeStock(item.id, item.qty);
                });
            } catch (e) { 
                console.error('SCart: saveOrder failed', e);
                showToast('Could not save order', true);
            }
        },
        getOrders: function () {
            try { return JSON.parse(localStorage.getItem('sphiri_orders') || '[]'); }
            catch (e) { return []; }
        },

        /* ── TOAST (exposed) ── */
        _toast: showToast,

        /* ── BROADCAST changes to all listeners on this page ── */
        _listeners: [],
        onChange: function (fn) { SCart._listeners.push(fn); },
        _broadcast: function () {
            var cart = load();
            SCart._listeners.forEach(function (fn) { try { fn(cart); } catch (e) {} });
            // Also fire storage event manually for same-tab detection
            window.dispatchEvent(new CustomEvent('scart:update', { detail: cart }));
        },
    };

    // Listen to storage events for cross-tab sync
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) SCart._broadcast();
        if (e.key === STOCK_KEY) window.dispatchEvent(new CustomEvent('scart:stockUpdate'));
    });

    window.SCart = SCart;

})();
