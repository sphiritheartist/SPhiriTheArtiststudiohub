/* ================================================================
   SPHIRI UNIFIED CART ENGINE — cart.js
   Cross-page persistent cart using localStorage.
   Replaces per-page cart state in menu-system.js and skate.js.
   All shop pages use window.SCart API.
   ================================================================ */

(function () {
    'use strict';

    const STORAGE_KEY    = 'sphiri_cart_v2';
    const DELIVERY_FEE   = 100;
    const FREE_DELIVERY_THRESHOLD = 1500; // free delivery above this

    /* ── STOCK REGISTRY (keyed by product id) ─────────────────
       Pages can register stock via: SCart.registerStock(id, qty)
       Defaults to Infinity if unregistered.
    ─────────────────────────────────────────────────────────── */
    var stockRegistry = {};

    /* ── LOAD / SAVE ─────────────────────────────────────────── */
    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch (e) { return {}; }
    }
    function save(cart) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
        catch (e) { console.warn('SCart: save failed', e); }
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

    /* ── PUBLIC API ──────────────────────────────────────────── */
    var SCart = {

        DELIVERY_FEE: DELIVERY_FEE,
        FREE_DELIVERY_THRESHOLD: FREE_DELIVERY_THRESHOLD,

        registerStock: function (id, qty) {
            stockRegistry[id] = qty;
        },

        getAll: function () { return load(); },

        add: function (id, name, price, img, variant, source) {
            var cart = load();
            var key  = cartKey(id, variant);
            var stock = stockRegistry[id] !== undefined ? stockRegistry[id] : Infinity;

            if (cart[key]) {
                if (cart[key].qty >= stock) {
                    SCart._toast('Only ' + stock + ' in stock', true);
                    return false;
                }
                cart[key].qty++;
            } else {
                if (stock < 1) {
                    SCart._toast('Out of stock', true);
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
            var stock = stockRegistry[id] !== undefined ? stockRegistry[id] : Infinity;
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
            catch (e) {}
        },

        // Order history
        saveOrder: function (order) {
            try {
                var orders = JSON.parse(localStorage.getItem('sphiri_orders') || '[]');
                orders.unshift(order);
                if (orders.length > 50) orders = orders.slice(0, 50);
                localStorage.setItem('sphiri_orders', JSON.stringify(orders));
            } catch (e) {}
        },
        getOrders: function () {
            try { return JSON.parse(localStorage.getItem('sphiri_orders') || '[]'); }
            catch (e) { return []; }
        },

        /* ── TOAST ── */
        _toast: function (msg, isErr) {
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
        },

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
    });

    window.SCart = SCart;

})();