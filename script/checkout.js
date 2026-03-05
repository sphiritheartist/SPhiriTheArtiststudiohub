/* ================================================================
   SPHIRI CHECKOUT SYSTEM — checkout.js
   Multi-step checkout: Summary → Details → Payment → Confirmation
   Payment methods: Cash on Pickup, EFT, PayFast, Yoco, PayPal
   Works on all shop pages. Requires cart.js + SCart.
   ================================================================ */

(function () {
    'use strict';

    /* ── PAYMENT METHODS CONFIG ──────────────────────────────── */
    var PAYMENT_METHODS = [
        {
            id: 'cash',
            label: 'Cash on Pickup',
            icon: '💵',
            desc: 'Pay in person when you collect your order at the studio.',
            badge: null,
            available: true,
        },
        {
            id: 'eft',
            label: 'EFT / Bank Transfer',
            icon: '🏦',
            desc: 'Pay directly to our bank account. Order confirmed after proof of payment.',
            badge: null,
            available: true,
        },
        {
            id: 'payfast',
            label: 'PayFast',
            icon: '⚡',
            desc: 'Secure card, instant EFT, or SnapScan via PayFast.',
            badge: 'Popular',
            available: true,
            setupNote: 'PayFast integration — configure merchant ID in settings.',
        },
        {
            id: 'yoco',
            label: 'Yoco Card',
            icon: '💳',
            desc: 'Debit or credit card payment via Yoco.',
            badge: null,
            available: true,
            setupNote: 'Yoco integration — add your public key in settings.',
        },
        {
            id: 'paypal',
            label: 'PayPal',
            icon: '🌐',
            desc: 'Pay with your PayPal account or card.',
            badge: 'International',
            available: true,
            setupNote: 'PayPal integration — add your client ID in settings.',
        },
    ];

    /* ── STATE ────────────────────────────────────────────────── */
    var state = {
        step: 1,        // 1=summary, 2=details, 3=payment, 4=confirm
        method: 'pickup',
        paymentId: null,
        name: '', email: '', note: '',
        address: '', city: '',
        saveAddress: false,
    };

    /* ── HELPERS ─────────────────────────────────────────────── */
    function fmt(n) { return 'R\u00a0' + n.toLocaleString(); }
    function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    /* ── RENDER STEPS ─────────────────────────────────────────── */
    function renderStep1(cart) {
        var entries = Object.entries(cart);
        var lines   = entries.map(function (e) {
            var key = e[0]; var item = e[1];
            return '<div class="co-summary-line">' +
                '<img src="' + esc(item.img) + '" alt="" onerror="this.style.display=\'none\'">' +
                '<div class="co-summary-item-info">' +
                    '<span>' + esc(item.name) + '</span>' +
                    '<small>×' + item.qty + '</small>' +
                '</div>' +
                '<span class="co-summary-item-price">' + fmt(item.price * item.qty) + '</span>' +
            '</div>';
        }).join('');

        var sub = SCart.subtotal();
        var fee = SCart.deliveryFee(state.method);
        var total = SCart.grandTotal(state.method);
        var feeRow = state.method === 'delivery'
            ? '<div class="co-total-row">' +
                '<span>Delivery' + (fee === 0 ? ' <span class="co-free-badge">FREE</span>' : '') + '</span>' +
                '<span>' + (fee === 0 ? 'R\u00a00' : fmt(fee)) + '</span>' +
              '</div>'
            : '';

        return '<div class="co-step" data-step="1">' +
            '<div class="co-section-title">Your Bag</div>' +
            '<div class="co-summary-lines">' + (lines || '<p class="co-empty">Your bag is empty.</p>') + '</div>' +
            '<div class="co-totals">' +
                '<div class="co-total-row"><span>Subtotal</span><span>' + fmt(sub) + '</span></div>' +
                feeRow +
                '<div class="co-total-row co-grand"><span>Total</span><span>' + fmt(total) + '</span></div>' +
            '</div>' +
            '<div class="co-fulfilment">' +
                '<div class="co-field-label">Fulfilment</div>' +
                '<div class="co-toggle">' +
                    '<button class="co-toggle-btn' + (state.method === 'pickup' ? ' active' : '') + '" data-method="pickup">🏪 Pickup</button>' +
                    '<button class="co-toggle-btn' + (state.method === 'delivery' ? ' active' : '') + '" data-method="delivery">🚚 Delivery (+' + fmt(SCart.DELIVERY_FEE) + ')</button>' +
                '</div>' +
                (sub >= SCart.FREE_DELIVERY_THRESHOLD
                    ? '<div class="co-free-note">✓ Free delivery on orders over ' + fmt(SCart.FREE_DELIVERY_THRESHOLD) + '</div>'
                    : '<div class="co-free-note co-free-note-muted">Free delivery on orders over ' + fmt(SCart.FREE_DELIVERY_THRESHOLD) + '</div>') +
            '</div>' +
            (entries.length > 0
                ? '<button class="co-primary-btn co-next-btn" data-next="2">Continue →</button>'
                : '') +
        '</div>';
    }

    function renderStep2() {
        var saved = SCart.getSavedAddress();
        var hasSaved = saved && saved.name;
        return '<div class="co-step" data-step="2">' +
            '<div class="co-section-title">Your Details</div>' +
            (hasSaved ? '<div class="co-saved-addr-banner" id="coUseSavedBanner">' +
                '<div>' +
                    '<div class="co-saved-addr-name">' + esc(saved.name) + '</div>' +
                    '<div class="co-saved-addr-sub">' + esc(saved.email) +
                        (saved.address ? ' · ' + esc(saved.address) + ', ' + esc(saved.city) : '') + '</div>' +
                '</div>' +
                '<button class="co-use-saved-btn" id="coUseSaved">Use this →</button>' +
            '</div>' : '') +
            '<div class="co-fields">' +
                '<div class="co-field">' +
                    '<label>Full Name</label>' +
                    '<input id="coName" type="text" placeholder="Your name" autocomplete="name" value="' + esc(state.name) + '">' +
                '</div>' +
                '<div class="co-field">' +
                    '<label>Email or WhatsApp</label>' +
                    '<input id="coEmail" type="text" placeholder="For order confirmation" autocomplete="email" value="' + esc(state.email) + '">' +
                '</div>' +
                '<div class="co-field">' +
                    '<label>Note <span class="co-optional">(optional)</span></label>' +
                    '<textarea id="coNote" rows="2" placeholder="Size, colour, anything special…">' + esc(state.note) + '</textarea>' +
                '</div>' +
                (state.method === 'delivery' ? '' +
                    '<div class="co-field">' +
                        '<label>Street Address</label>' +
                        '<input id="coAddress" type="text" placeholder="123 Street Rd" autocomplete="street-address" value="' + esc(state.address) + '">' +
                    '</div>' +
                    '<div class="co-field">' +
                        '<label>City</label>' +
                        '<input id="coCity" type="text" placeholder="Johannesburg" autocomplete="address-level2" value="' + esc(state.city) + '">' +
                    '</div>' : '') +
                '<label class="co-checkbox-label">' +
                    '<input type="checkbox" id="coSaveAddress"' + (state.saveAddress ? ' checked' : '') + '>' +
                    '<span>Save my details for next time</span>' +
                '</label>' +
            '</div>' +
            '<div class="co-btn-row">' +
                '<button class="co-back-btn co-prev-btn" data-prev="1">← Back</button>' +
                '<button class="co-primary-btn co-next-btn" data-next="3">Payment →</button>' +
            '</div>' +
        '</div>';
    }

    function renderStep3() {
        var total = fmt(SCart.grandTotal(state.method));
        var methods = PAYMENT_METHODS.map(function (m) {
            var active = state.paymentId === m.id;
            return '<div class="co-payment-opt' + (active ? ' active' : '') + '" data-pay="' + m.id + '">' +
                '<div class="co-payment-icon">' + m.icon + '</div>' +
                '<div class="co-payment-info">' +
                    '<div class="co-payment-label">' + esc(m.label) +
                        (m.badge ? ' <span class="co-pay-badge">' + esc(m.badge) + '</span>' : '') +
                    '</div>' +
                    '<div class="co-payment-desc">' + esc(m.desc) + '</div>' +
                    (m.setupNote ? '<div class="co-setup-note">⚙ ' + esc(m.setupNote) + '</div>' : '') +
                '</div>' +
                '<div class="co-payment-radio">' + (active ? '●' : '○') + '</div>' +
            '</div>';
        }).join('');

        return '<div class="co-step" data-step="3">' +
            '<div class="co-section-title">Payment Method</div>' +
            '<div class="co-payment-opts">' + methods + '</div>' +
            '<div class="co-order-total-preview">' +
                '<span>Total to pay</span><span>' + total + '</span>' +
            '</div>' +
            '<div class="co-btn-row">' +
                '<button class="co-back-btn co-prev-btn" data-prev="2">← Back</button>' +
                '<button class="co-primary-btn" id="coPlaceOrderBtn"' + (!state.paymentId ? ' disabled' : '') + '>Place Order</button>' +
            '</div>' +
        '</div>';
    }

    function renderStep4(orderNum) {
        var payMethod = PAYMENT_METHODS.find(function (m) { return m.id === state.paymentId; });
        var payLabel  = payMethod ? payMethod.label : '';
        var isCash    = state.paymentId === 'cash';
        var isEft     = state.paymentId === 'eft';

        var payInstructions = '';
        if (isCash) {
            payInstructions = '<div class="co-pay-instructions">' +
                '<strong>📍 Pickup Instructions</strong>' +
                '<p>Bring your order number to the studio. Payment due on collection.</p>' +
                '<p class="co-address-line">Unit 4B, Maboneng District, Johannesburg</p>' +
            '</div>';
        } else if (isEft) {
            payInstructions = '<div class="co-pay-instructions">' +
                '<strong>🏦 EFT Details</strong>' +
                '<div class="co-eft-row"><span>Bank</span><strong>FNB</strong></div>' +
                '<div class="co-eft-row"><span>Account Name</span><strong>SPhiri The Artist</strong></div>' +
                '<div class="co-eft-row"><span>Account Number</span><strong>—</strong></div>' +
                '<div class="co-eft-row"><span>Reference</span><strong>' + esc(orderNum) + '</strong></div>' +
                '<p style="margin-top:12px;font-size:12px;color:var(--muted)">Send proof of payment to contact@sphiri.art or WhatsApp us.</p>' +
            '</div>';
        } else if (payMethod && payMethod.setupNote) {
            payInstructions = '<div class="co-pay-instructions co-pay-setup">' +
                '<strong>⚙ Payment Gateway</strong>' +
                '<p>' + esc(payMethod.setupNote) + '</p>' +
                '<p style="font-size:12px;color:var(--muted)">Your order is reserved. We\'ll contact you to complete payment.</p>' +
            '</div>';
        }

        var waLink = 'https://wa.me/?text=' +
            encodeURIComponent('Hi! I just placed order ' + orderNum + ' on SPhiri. Paid via ' + payLabel + '.');

        return '<div class="co-step co-step-confirm" data-step="4">' +
            '<div class="co-confirm-icon">🎉</div>' +
            '<h2 class="co-confirm-title">Order Placed!</h2>' +
            '<p class="co-confirm-sub">Thanks ' + esc(state.name.split(' ')[0]) + ' — we\'ll confirm shortly via email or WhatsApp.</p>' +
            '<div class="co-confirm-order-num" id="coOrderNum">' + esc(orderNum) + '</div>' +
            payInstructions +
            '<div class="co-confirm-actions">' +
                '<a class="co-wa-btn" href="' + waLink + '" target="_blank" rel="noopener">📱 Share on WhatsApp</a>' +
                '<button class="co-done-btn" id="coDoneBtn">Continue Shopping</button>' +
            '</div>' +
            '<div class="co-view-orders-link"><a href="dashboard.html#orders">View all my orders →</a></div>' +
        '</div>';
    }

    /* ── CHECKOUT MODAL HTML ──────────────────────────────────── */
    function buildModal() {
        var el = document.getElementById('sphiriCheckoutModal');
        if (el) return; // already exists

        var modal = document.createElement('div');
        modal.id = 'sphiriCheckoutModal';
        modal.className = 'co-modal';
        modal.innerHTML =
            '<div class="co-backdrop" id="coBackdrop"></div>' +
            '<div class="co-box">' +
                '<div class="co-drag-pill"></div>' +
                '<div class="co-header">' +
                    '<div class="co-steps-indicator" id="coStepsIndicator"></div>' +
                    '<button class="co-close-btn" id="coCloseBtn">×</button>' +
                '</div>' +
                '<div class="co-body" id="coBody"></div>' +
            '</div>';
        document.body.appendChild(modal);

        // Wiring close
        document.getElementById('coBackdrop').addEventListener('click', closeCheckout);
        document.getElementById('coCloseBtn').addEventListener('click', closeCheckout);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeCheckout();
        });
    }

    function renderStepsIndicator() {
        var labels = ['Bag', 'Details', 'Payment', 'Done'];
        var ind = document.getElementById('coStepsIndicator');
        if (!ind) return;
        ind.innerHTML = labels.map(function (l, i) {
            var n = i + 1;
            var cls = n < state.step ? 'done' : n === state.step ? 'active' : '';
            return '<div class="co-step-dot ' + cls + '">' +
                '<span class="co-step-num">' + (n < state.step ? '✓' : n) + '</span>' +
                '<span class="co-step-label">' + l + '</span>' +
            '</div>' +
            (n < 4 ? '<div class="co-step-line' + (n < state.step ? ' done' : '') + '"></div>' : '');
        }).join('');
    }

    function renderBody() {
        var body = document.getElementById('coBody');
        if (!body) return;
        var cart = SCart.getAll();

        var html = '';
        if (state.step === 1) html = renderStep1(cart);
        if (state.step === 2) html = renderStep2();
        if (state.step === 3) html = renderStep3();
        if (state.step === 4) html = renderStep4(state.orderNum || '—');

        body.innerHTML = html;
        renderStepsIndicator();
        wireStep();
    }

    function wireStep() {
        var body = document.getElementById('coBody');
        if (!body) return;

        // Fulfilment toggle (step 1)
        body.querySelectorAll('.co-toggle-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.method = btn.dataset.method;
                renderBody();
            });
        });

        // Next button
        body.querySelectorAll('.co-next-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var next = parseInt(btn.dataset.next);
                if (next === 3) {
                    // validate step 2
                    var name  = document.getElementById('coName');
                    var email = document.getElementById('coEmail');
                    if (name && !name.value.trim()) { shakeField(name); return; }
                    if (email && !email.value.trim()) { shakeField(email); return; }
                    state.name     = name ? name.value.trim() : '';
                    state.email    = email ? email.value.trim() : '';
                    var note       = document.getElementById('coNote');
                    state.note     = note ? note.value.trim() : '';
                    var addr       = document.getElementById('coAddress');
                    var city       = document.getElementById('coCity');
                    state.address  = addr ? addr.value.trim() : '';
                    state.city     = city ? city.value.trim() : '';
                    var saveCb     = document.getElementById('coSaveAddress');
                    state.saveAddress = saveCb ? saveCb.checked : false;
                    if (state.saveAddress) {
                        SCart.saveAddress({ name: state.name, email: state.email, address: state.address, city: state.city });
                    }
                }
                state.step = next;
                renderBody();
                scrollBody();
            });
        });

        // Back button
        body.querySelectorAll('.co-prev-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.step = parseInt(btn.dataset.prev);
                renderBody();
                scrollBody();
            });
        });

        // Use saved address
        var useSaved = document.getElementById('coUseSaved');
        if (useSaved) {
            useSaved.addEventListener('click', function () {
                var saved = SCart.getSavedAddress();
                if (!saved) return;
                state.name    = saved.name    || state.name;
                state.email   = saved.email   || state.email;
                state.address = saved.address || state.address;
                state.city    = saved.city    || state.city;
                renderBody();
            });
        }

        // Payment options (step 3)
        body.querySelectorAll('.co-payment-opt').forEach(function (opt) {
            opt.addEventListener('click', function () {
                state.paymentId = opt.dataset.pay;
                renderBody();
            });
        });

        // Place order
        var placeBtn = document.getElementById('coPlaceOrderBtn');
        if (placeBtn) {
            placeBtn.addEventListener('click', placeOrder);
        }

        // Done
        var doneBtn = document.getElementById('coDoneBtn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeCheckout();
                closeCartPanel();
            });
        }
    }

    function scrollBody() {
        var box = document.querySelector('.co-box');
        if (box) box.scrollTop = 0;
    }

    function shakeField(el) {
        el.focus();
        el.style.borderColor = '#ff3b30';
        el.style.animation = 'coShake 0.35s ease';
        setTimeout(function () {
            el.style.animation = '';
            el.style.borderColor = '';
        }, 500);
    }

    /* ── PLACE ORDER ─────────────────────────────────────────── */
    function placeOrder() {
        var cart   = SCart.getAll();
        var orderNum = 'STA-' + Date.now().toString(36).toUpperCase().slice(-6);
        var payMethod = PAYMENT_METHODS.find(function (m) { return m.id === state.paymentId; });

        var order = {
            id:         orderNum,
            status:     'Placed',
            items:      Object.values(cart).map(function (i) {
                return { id: i.id, name: i.name, qty: i.qty, price: i.price };
            }),
            subtotal:   SCart.subtotal(),
            delivery:   SCart.deliveryFee(state.method),
            total:      SCart.grandTotal(state.method),
            method:     state.method,
            payment:    state.paymentId,
            paymentLabel: payMethod ? payMethod.label : '',
            name:       state.name,
            email:      state.email,
            address:    state.address,
            city:       state.city,
            note:       state.note,
            createdAt:  new Date().toISOString(),
        };

        SCart.saveOrder(order);
        SCart.clear();

        state.orderNum = orderNum;
        state.step = 4;
        renderBody();
        scrollBody();
        updateAllBadges();
    }

    /* ── OPEN / CLOSE ─────────────────────────────────────────── */
    function openCheckout() {
        if (SCart.itemCount() === 0) {
            SCart._toast('Add something to your bag first', true);
            return;
        }
        // Require auth before proceeding
        if (window.studioAuth && !studioAuth.isSignedIn) {
            studioAuth.requireAuth(
                { icon: '🛍', text: 'Sign in to complete your purchase and track your orders.' },
                function () { _doOpenCheckout(); }
            );
            return;
        }
        _doOpenCheckout();
    }

    function _doOpenCheckout() {
        // Pre-fill details from auth user if available
        if (window.studioAuth && studioAuth.user) {
            var u = studioAuth.user;
            if (!state.name)  state.name  = u.name  || '';
            if (!state.email) state.email = u.email || '';
            if (!state.email && u.phone) state.email = u.phone;
        }
        buildModal();
        state.step = 1;
        renderBody();
        var modal = document.getElementById('sphiriCheckoutModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCheckout() {
        var modal = document.getElementById('sphiriCheckoutModal');
        if (modal) {
            modal.classList.remove('open');
            if (state.step !== 4) document.body.style.overflow = '';
            else document.body.style.overflow = '';
        }
    }

    function closeCartPanel() {
        var p = document.getElementById('cartPanel');
        var b = document.getElementById('cartBackdrop');
        var t = document.getElementById('trayBar');
        if (p) p.classList.remove('open');
        if (b) b.classList.remove('visible');
        if (t) t.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ── BADGE UPDATES ────────────────────────────────────────── */
    function updateAllBadges() {
        var count = SCart.itemCount();
        document.querySelectorAll('#navBagCount, #bagCount, .bag-count').forEach(function (el) {
            el.textContent = count;
            el.classList.toggle('visible', count > 0);
            el.style.display = count > 0 ? '' : 'none';
        });
    }

    /* ── WIRE CHECKOUT BUTTONS ────────────────────────────────── */
    function wireCheckoutButtons() {
        // Wire any .checkout-cta buttons
        document.addEventListener('click', function (e) {
            if (e.target.matches('.checkout-cta, .co-checkout-trigger')) {
                e.preventDefault();
                closeCartPanel();
                setTimeout(openCheckout, 220);
            }
        });
    }

    /* ── EXPORT ──────────────────────────────────────────────── */
    window.SCheckout = {
        open: openCheckout,
        close: closeCheckout,
    };

    document.addEventListener('DOMContentLoaded', function () {
        buildModal();
        wireCheckoutButtons();
    });

})();