/* ================================================================
   McDONALD'S MENU SYSTEM — Shared JS engine
   Used by: apparel.html, accessories.html, tech.html
   Each page calls: initMenuSystem(config)
   ================================================================ */

window.initMenuSystem = function (config) {
    /* config = {
         searchId:    'searchInput',
         gridId:      'menuGrid',
         upsells:     { cat: [ids...] },
       }
    */

    const catTabs     = document.querySelectorAll('.cat-tab');
    const billSlides  = document.querySelectorAll('.billboard-slide');
    const cards       = document.querySelectorAll('.menu-card');
    const searchEl    = config.searchId ? document.getElementById(config.searchId) : null;
    const upsellStrip = document.getElementById('upsellStrip');
    const upsellRow   = document.getElementById('upsellRow');

    const trayBar     = document.getElementById('trayBar');
    const trayCount   = document.getElementById('trayCount');
    const trayTotal   = document.getElementById('trayTotal');
    const cartPanel   = document.getElementById('cartPanel');
    const cartBack    = document.getElementById('cartBackdrop');
    const cartClose   = document.getElementById('cartPanelClose');
    const cartItems   = document.getElementById('cartPanelItems');
    const cartTotal   = document.getElementById('cartPanelTotal');

    const modal       = document.getElementById('productModal');
    const modalBack   = document.getElementById('modalBackdrop');
    const modalClose  = document.getElementById('modalCloseBtn');
    const modalImg    = document.getElementById('modalImg');
    const modalName   = document.getElementById('modalName');
    const modalPrice  = document.getElementById('modalPrice');
    const modalDesc   = document.getElementById('modalDesc');
    const modalSpecs  = document.getElementById('modalSpecs');
    const modalAddBtn = document.getElementById('modalAddBtn');

    // Cart: keyed by product id
    var cart = {};

    /* ── HELPERS ── */
    function getCardData(id) {
        var card = document.querySelector('.menu-card[data-id="' + id + '"]');
        if (!card) return null;
        return {
            id:    id,
            name:  card.dataset.name,
            price: parseInt(card.dataset.price),
            img:   card.dataset.img || '',
            desc:  card.dataset.desc || '',
            specs: JSON.parse(card.dataset.specs || '[]'),
        };
    }

    /* ── CATEGORY + BILLBOARD ── */
    function switchCat(cat) {
        catTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.cat === cat); });
        billSlides.forEach(function (s) { s.classList.toggle('active', s.dataset.cat === cat); });
        cards.forEach(function (c) {
            var show = cat === 'all' || c.dataset.cat === cat;
            c.style.display = show ? '' : 'none';
        });
        renderUpsells(cat);
        // Re-apply search if active
        if (searchEl && searchEl.value) filterSearch(searchEl.value);
    }

    catTabs.forEach(function (t) {
        t.addEventListener('click', function () { switchCat(t.dataset.cat); });
    });

    /* ── SEARCH ── */
    function filterSearch(term) {
        term = term.toLowerCase();
        cards.forEach(function (c) {
            if (c.style.display === 'none' && term === '') return; // respect cat filter
            var name = (c.querySelector('h3') || {}).textContent || '';
            var sub  = (c.querySelector('.card-sub') || {}).textContent || '';
            c.style.display = (name + sub).toLowerCase().includes(term) ? '' : 'none';
        });
    }

    if (searchEl) {
        searchEl.addEventListener('input', function () { filterSearch(searchEl.value); });
    }

    /* ── UPSELLS ── */
    function renderUpsells(cat) {
        var ids = (config.upsells || {})[cat];
        if (!ids || ids.length === 0 || cat === 'all') {
            if (upsellStrip) upsellStrip.classList.remove('visible');
            return;
        }
        if (!upsellRow) return;
        upsellRow.innerHTML = '';
        ids.forEach(function (id) {
            var d = getCardData(id);
            if (!d) return;
            var chip = document.createElement('div');
            chip.className = 'upsell-chip';
            chip.innerHTML =
                '<img src="' + d.img + '" alt="' + d.name + '">' +
                '<div class="upsell-chip-info">' +
                  '<span>' + d.name + '</span>' +
                  '<small>R ' + d.price.toLocaleString() + '</small>' +
                '</div>' +
                '<button class="upsell-chip-add">+</button>';
            chip.querySelector('.upsell-chip-add').addEventListener('click', function (e) {
                e.stopPropagation();
                addToCart(d.id, d.name, d.price, d.img);
            });
            upsellRow.appendChild(chip);
        });
        upsellStrip.classList.add('visible');
    }

    /* ── CART ENGINE ── */
    function addToCart(id, name, price, img) {
        if (cart[id]) { cart[id].qty++; }
        else { cart[id] = { name: name, price: price, img: img, qty: 1 }; }
        updateTray();
        renderCart();
        // Flash tray
        if (trayBar) {
            trayBar.style.transform = 'translateY(-4px) scale(1.02)';
            setTimeout(function () { trayBar.style.transform = ''; }, 280);
        }
    }

    function changeQty(id, delta) {
        if (!cart[id]) return;
        cart[id].qty += delta;
        if (cart[id].qty <= 0) delete cart[id];
        updateTray();
        renderCart();
    }

    function totalAmt() {
        return Object.values(cart).reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    }
    function totalQty() {
        return Object.values(cart).reduce(function (s, i) { return s + i.qty; }, 0);
    }

    function updateTray() {
        var qty = totalQty();
        if (trayCount) trayCount.textContent = qty;
        if (trayTotal) trayTotal.textContent  = 'R ' + totalAmt().toLocaleString();
        if (trayBar)   trayBar.classList.toggle('visible', qty > 0);
        // Update nav bag badge if it exists on this page
        var badge = document.getElementById('navBagCount');
        if (badge) {
            badge.textContent = qty;
            badge.classList.toggle('visible', qty > 0);
        }
    }

    function renderCart() {
        if (!cartItems) return;
        var entries = Object.entries(cart);
        if (entries.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart-msg">Your bag is empty.<br>Pick something from the menu.</div>';
        } else {
            cartItems.innerHTML = entries.map(function (e) {
                var id = e[0]; var item = e[1];
                return (
                    '<div class="cart-line">' +
                      '<img class="cart-line-img" src="' + item.img + '" alt="' + item.name + '">' +
                      '<div class="cart-line-info">' +
                        '<h4>' + item.name + '</h4>' +
                        '<span>R ' + item.price.toLocaleString() + ' each</span>' +
                      '</div>' +
                      '<div class="qty-stepper">' +
                        '<button class="qty-btn" data-id="' + id + '" data-d="-1">−</button>' +
                        '<span class="qty-num">' + item.qty + '</span>' +
                        '<button class="qty-btn" data-id="' + id + '" data-d="1">+</button>' +
                      '</div>' +
                      '<div class="cart-line-price">R ' + (item.price * item.qty).toLocaleString() + '</div>' +
                    '</div>'
                );
            }).join('');
            cartItems.querySelectorAll('.qty-btn').forEach(function (btn) {
                btn.addEventListener('click', function () { changeQty(btn.dataset.id, parseInt(btn.dataset.d)); });
            });
        }
        if (cartTotal) cartTotal.textContent = 'R ' + totalAmt().toLocaleString();
    }

    /* ── TRAY / PANEL OPEN-CLOSE ── */
    function openCart() {
        if (!cartPanel) return;
        cartPanel.classList.add('open');
        if (cartBack) cartBack.classList.add('visible');
        if (trayBar)  trayBar.classList.add('open');
        document.body.style.overflow = 'hidden';
        renderCart();
    }
    function closeCart() {
        if (!cartPanel) return;
        cartPanel.classList.remove('open');
        if (cartBack) cartBack.classList.remove('visible');
        if (trayBar)  trayBar.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (trayBar)   trayBar.addEventListener('click', function () {
        cartPanel.classList.contains('open') ? closeCart() : openCart();
    });
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartBack)  cartBack.addEventListener('click', closeCart);

    // Nav bag button if present
    var navBagBtn = document.getElementById('navBagBtn');
    if (navBagBtn) navBagBtn.addEventListener('click', function () {
        cartPanel.classList.contains('open') ? closeCart() : openCart();
    });

    /* ── INFO MODAL ── */
    function openModal(id) {
        var d = getCardData(id);
        if (!d || !modal) return;
        modalImg.src   = d.img;
        modalImg.alt   = d.name;
        modalName.textContent  = d.name;
        modalPrice.textContent = 'R ' + d.price.toLocaleString();
        modalDesc.textContent  = d.desc;
        modalSpecs.innerHTML   = d.specs.map(function (s) {
            return '<div class="modal-spec"><span>' + s[0] + '</span><strong>' + s[1] + '</strong></div>';
        }).join('');
        modalAddBtn.onclick = function () {
            addToCart(d.id, d.name, d.price, d.img);
            closeModal();
        };
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        if (modal) modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBack)  modalBack.addEventListener('click', closeModal);

    /* ── WIRE CARD BUTTONS ── */
    document.querySelectorAll('.icon-btn.info-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); openModal(btn.dataset.id); });
    });
    document.querySelectorAll('.icon-btn.add-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var d = getCardData(btn.dataset.id);
            if (!d) return;
            addToCart(d.id, d.name, d.price, d.img);
            btn.textContent = '✓';
            btn.classList.add('added');
            setTimeout(function () {
                btn.textContent = '🛒';
                btn.classList.remove('added');
            }, 900);
        });
    });

    /* ── CHECKOUT MODAL ── */
    var checkoutModal    = document.getElementById('checkoutModal');
    var checkoutBackdrop = document.getElementById('checkoutModalBackdrop');
    var checkoutClose    = document.getElementById('checkoutModalClose');
    var checkoutFormView = document.getElementById('checkoutFormView');
    var checkoutConfirm  = document.getElementById('checkoutConfirm');
    var confirmOrderNum  = document.getElementById('confirmOrderNum');
    var confirmDoneBtn   = document.getElementById('confirmDoneBtn');
    var placeOrderBtn    = document.getElementById('placeOrderBtn');
    var methodBtns       = document.querySelectorAll('.method-btn');
    var addressFields    = document.getElementById('addressFields');
    var checkoutSummaryLines = document.getElementById('checkoutSummaryLines');

    function openCheckout() {
        if (!checkoutModal) return;
        if (checkoutFormView) checkoutFormView.classList.remove('hidden');
        if (checkoutConfirm) checkoutConfirm.classList.remove('visible');
        renderCheckoutSummary();
        checkoutModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeCheckout() {
        if (!checkoutModal) return;
        checkoutModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    function renderCheckoutSummary() {
        if (!checkoutSummaryLines) return;
        var entries = Object.entries(cart);
        var lines = entries.map(function(e) {
            var item = e[1];
            var qty  = item.qty > 1 ? ' \xD7' + item.qty : '';
            return '<div class="checkout-summary-line">' +
                   '<span>' + item.name + qty + '</span>' +
                   '<span>R\u00a0' + (item.price * item.qty).toLocaleString() + '</span>' +
                   '</div>';
        }).join('');
        lines += '<div class="checkout-summary-line total-line">' +
                 '<span>Total</span>' +
                 '<span>R\u00a0' + totalAmt().toLocaleString() + '</span>' +
                 '</div>';
        checkoutSummaryLines.innerHTML = lines;
    }

    methodBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            methodBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            if (addressFields) {
                addressFields.classList.toggle('visible', btn.dataset.method === 'delivery');
            }
        });
    });

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function() {
            var nameInput  = document.getElementById('checkoutName');
            var emailInput = document.getElementById('checkoutEmail');
            if (nameInput && !nameInput.value.trim()) { nameInput.focus(); return; }
            if (emailInput && !emailInput.value.trim()) { emailInput.focus(); return; }
            var orderNum = 'STA-' + Math.random().toString(36).substr(2,6).toUpperCase();
            if (confirmOrderNum) confirmOrderNum.textContent = 'Order #\u00a0' + orderNum;
            if (checkoutFormView) checkoutFormView.classList.add('hidden');
            if (checkoutConfirm)  checkoutConfirm.classList.add('visible');
            cart = {};
            updateTray();
        });
    }

    if (confirmDoneBtn) {
        confirmDoneBtn.addEventListener('click', function() {
            closeCheckout();
            closeCart();
        });
    }

    if (checkoutClose)    checkoutClose.addEventListener('click', closeCheckout);
    if (checkoutBackdrop) checkoutBackdrop.addEventListener('click', closeCheckout);

    var checkoutCta = document.querySelector('.checkout-cta');
    if (checkoutCta) {
        checkoutCta.addEventListener('click', function() {
            if (Object.keys(cart).length === 0) return;
            closeCart();
            openCheckout();
        });
    }

    /* ── INIT ── */
    switchCat('all');
    updateTray();
    renderCart();
};