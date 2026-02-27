/* =============================================================
   WESORTED SKATE — skate.js
   Fixes: hamburger, cart toggle, bag-count, completes category,
   inline-style cart override, smooth scroll.
   Powers: McDonald's menu system (tabs, billboard, tray, modal).
   ============================================================= */
document.addEventListener('DOMContentLoaded', function () {

    /* ── SELECTORS ─────────────────────────────────────────── */
    const hamburgerBtn   = document.getElementById('hamburgerBtn');
    const navLinks       = document.getElementById('skateNavLinks');
    const navBackdrop    = document.getElementById('navBackdrop');
    const themeToggle    = document.getElementById('themeToggle');
    const bagIconWrapper = document.getElementById('bagIconWrapper');
    const bagCount       = document.getElementById('bagCount');

    const catTabs        = document.querySelectorAll('.cat-tab');
    const billboardSlides= document.querySelectorAll('.billboard-slide');
    const menuGrid       = document.getElementById('menuGrid');
    const menuCards      = document.querySelectorAll('.menu-grid .menu-card');
    const productSearch  = document.getElementById('productSearch');
    const upsellStrip    = document.getElementById('upsellStrip');
    const upsellRow      = document.getElementById('upsellRow');

    const trayBar        = document.getElementById('trayBar');
    const trayCount      = document.getElementById('trayCount');
    const trayTotal      = document.getElementById('trayTotal');
    const cartPanel      = document.getElementById('cartPanel');
    const cartBackdrop   = document.getElementById('cartBackdrop');
    const cartPanelClose = document.getElementById('cartPanelClose');
    const cartPanelItems = document.getElementById('cartPanelItems');
    const cartPanelTotal = document.getElementById('cartPanelTotal');

    const productModal   = document.getElementById('productModal');
    const modalBackdrop  = document.getElementById('modalBackdrop');
    const modalCloseBtn  = document.getElementById('modalCloseBtn');
    const modalImg       = document.getElementById('modalImg');
    const modalName      = document.getElementById('modalName');
    const modalPrice     = document.getElementById('modalPrice');
    const modalDesc      = document.getElementById('modalDesc');
    const modalSpecs     = document.getElementById('modalSpecs');
    const modalAddBtn    = document.getElementById('modalAddBtn');

    const imageInput     = document.getElementById('image-input');
    const videoInput     = document.getElementById('video-input');
    const previewContainer = document.getElementById('media-preview-container');
    const recordBtn      = document.getElementById('vn-record-btn');
    const recordStatus   = document.getElementById('recording-status');
    const postBtn        = document.getElementById('submit-post-btn');
    const commentInput   = document.getElementById('user-comment-input');
    const feed           = document.getElementById('comment-list-container');

    /* ── CART STATE ─────────────────────────────────────────── */
    // Keyed by product id so qty increments correctly
    let cart = {};  // { id: { name, price, img, qty } }

    /* ── THEME ──────────────────────────────────────────────── */
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const isLight = document.body.classList.toggle('theme-light');
            document.body.classList.toggle('theme-dark', !isLight);
            themeToggle.textContent = isLight ? '🌙' : '☀️';
        });
    }

    /* ── HAMBURGER (BUG 1 FIX) ──────────────────────────────── */
    function openNav() {
        navLinks.classList.add('open');
        navBackdrop.classList.add('visible');
        hamburgerBtn.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeNav() {
        navLinks.classList.remove('open');
        navBackdrop.classList.remove('visible');
        hamburgerBtn.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function () {
            hamburgerBtn.classList.contains('open') ? closeNav() : openNav();
        });
    }
    if (navBackdrop) navBackdrop.addEventListener('click', closeNav);
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', closeNav);
        });
    }

    /* ── SMOOTH SCROLL (BUG 5 FIX — only for in-page anchors) ── */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                closeNav();
            }
        });
    });

    /* ── CATEGORY RAIL & BILLBOARD ──────────────────────────── */
    // Upsell data: which category recommends which product ids
    const UPSELLS = {
        decks:       ['acc-bones', 'acc-hardware'],
        completes:   ['acc-bones', 'acc-hardware', 'acc-vans-cap'],
        trucks:      ['acc-hardware', 'acc-bones'],
        footwear:    ['acc-vans-cap'],
        apparel:     ['acc-vans-cap'],
        accessories: ['acc-bones', 'acc-hardware'],
    };

    function getCardData(id) {
        const card = document.querySelector('.menu-card[data-id="' + id + '"]');
        if (!card) return null;
        return {
            id:    id,
            name:  card.dataset.name,
            price: parseInt(card.dataset.price),
            img:   card.dataset.img,
            desc:  card.dataset.desc,
            specs: JSON.parse(card.dataset.specs || '[]'),
        };
    }

    function renderUpsells(cat) {
        const ids = UPSELLS[cat];
        if (!ids || ids.length === 0 || cat === 'all') {
            upsellStrip.classList.remove('visible');
            return;
        }
        upsellRow.innerHTML = '';
        ids.forEach(function (id) {
            const d = getCardData(id);
            if (!d) return;
            const chip = document.createElement('div');
            chip.className = 'upsell-chip';
            chip.innerHTML =
                '<img src="' + d.img + '" alt="' + d.name + '">' +
                '<div class="upsell-chip-info">' +
                  '<span>' + d.name + '</span>' +
                  '<small>R ' + d.price.toLocaleString() + '</small>' +
                '</div>' +
                '<button class="upsell-chip-add" data-id="' + id + '" aria-label="Add">+</button>';
            chip.querySelector('.upsell-chip-add').addEventListener('click', function (e) {
                e.stopPropagation();
                addToCart(d.id, d.name, d.price, d.img);
            });
            upsellRow.appendChild(chip);
        });
        upsellStrip.classList.add('visible');
    }

    function switchCategory(cat) {
        // Tabs
        catTabs.forEach(function (t) {
            t.classList.toggle('active', t.dataset.cat === cat);
        });
        // Billboard
        billboardSlides.forEach(function (s) {
            s.classList.toggle('active', s.dataset.cat === cat);
        });
        // Cards — BUG 2 FIX: 'completes' now exists as a real filter
        menuCards.forEach(function (c) {
            const match = cat === 'all' || c.dataset.cat === cat;
            c.style.display = match ? '' : 'none';
        });
        // Upsells
        renderUpsells(cat);
    }

    catTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            switchCategory(tab.dataset.cat);
        });
    });

    // Init
    switchCategory('all');

    /* ── SEARCH ──────────────────────────────────────────────── */
    if (productSearch) {
        productSearch.addEventListener('input', function () {
            const term = productSearch.value.toLowerCase();
            menuCards.forEach(function (c) {
                const name = (c.querySelector('h3') || {}).textContent || '';
                c.style.display = name.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }

    /* ── CART ENGINE ─────────────────────────────────────────── */
    function addToCart(id, name, price, img) {
        if (cart[id]) {
            cart[id].qty++;
        } else {
            cart[id] = { name: name, price: price, img: img, qty: 1 };
        }
        updateTray();
        renderCartPanel();
        flashTray();
    }

    function removeFromCart(id) {
        delete cart[id];
        updateTray();
        renderCartPanel();
    }

    function changeQty(id, delta) {
        if (!cart[id]) return;
        cart[id].qty += delta;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        updateTray();
        renderCartPanel();
    }

    function cartTotal() {
        return Object.values(cart).reduce(function (s, i) {
            return s + i.price * i.qty;
        }, 0);
    }

    function cartItemCount() {
        return Object.values(cart).reduce(function (s, i) { return s + i.qty; }, 0);
    }

    /* BUG 4 FIX: badge hidden when empty */
    function updateTray() {
        const count = cartItemCount();
        const total = cartTotal();

        // Nav bag badge
        if (bagCount) {
            bagCount.textContent = count;
            bagCount.style.display = count > 0 ? 'flex' : 'none';
        }
        // Tray bar
        if (trayCount) trayCount.textContent = count;
        if (trayTotal) trayTotal.textContent = 'R ' + total.toLocaleString();
        if (trayBar) trayBar.classList.toggle('visible', count > 0);
    }

    function flashTray() {
        if (!trayBar) return;
        trayBar.style.transform = 'translateY(-6px) scale(1.02)';
        setTimeout(function () { trayBar.style.transform = ''; }, 300);
    }

    function renderCartPanel() {
        if (!cartPanelItems) return;
        const items = Object.entries(cart);

        if (items.length === 0) {
            cartPanelItems.innerHTML = '<div class="empty-cart-msg">Your order is empty.<br>Add something from the menu above.</div>';
        } else {
            cartPanelItems.innerHTML = items.map(function (entry) {
                const id   = entry[0];
                const item = entry[1];
                const lineTotal = item.price * item.qty;
                return (
                    '<div class="cart-line">' +
                      '<img class="cart-line-img" src="' + item.img + '" alt="' + item.name + '">' +
                      '<div class="cart-line-info">' +
                        '<h4>' + item.name + '</h4>' +
                        '<span>R ' + item.price.toLocaleString() + ' each</span>' +
                      '</div>' +
                      '<div class="qty-stepper">' +
                        '<button class="qty-btn" data-id="' + id + '" data-delta="-1">−</button>' +
                        '<span class="qty-num">' + item.qty + '</span>' +
                        '<button class="qty-btn" data-id="' + id + '" data-delta="1">+</button>' +
                      '</div>' +
                      '<div class="cart-line-price">R ' + lineTotal.toLocaleString() + '</div>' +
                    '</div>'
                );
            }).join('');

            // Wire qty buttons
            cartPanelItems.querySelectorAll('.qty-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    changeQty(btn.dataset.id, parseInt(btn.dataset.delta));
                });
            });
        }

        if (cartPanelTotal) {
            cartPanelTotal.textContent = 'R ' + cartTotal().toLocaleString();
        }
    }

    /* ── TRAY TOGGLE (BUG 3 FIX: no inline style fight) ─────── */
    function openCartPanel() {
        cartPanel.classList.add('open');
        cartBackdrop.classList.add('visible');
        trayBar.classList.add('open');
        document.body.style.overflow = 'hidden';
        renderCartPanel();
    }
    function closeCartPanel() {
        cartPanel.classList.remove('open');
        cartBackdrop.classList.remove('visible');
        trayBar.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (trayBar) {
        trayBar.addEventListener('click', function () {
            cartPanel.classList.contains('open') ? closeCartPanel() : openCartPanel();
        });
    }
    if (bagIconWrapper) {
        bagIconWrapper.addEventListener('click', function () {
            cartPanel.classList.contains('open') ? closeCartPanel() : openCartPanel();
        });
    }
    if (cartPanelClose) cartPanelClose.addEventListener('click', closeCartPanel);
    if (cartBackdrop)   cartBackdrop.addEventListener('click', closeCartPanel);

    /* ── PRODUCT INFO MODAL ──────────────────────────────────── */
    let currentModalId = null;

    function openModal(id) {
        const d = getCardData(id);
        if (!d) return;
        currentModalId = id;
        modalImg.src     = d.img;
        modalImg.alt     = d.name;
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
        productModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        productModal.classList.remove('open');
        document.body.style.overflow = '';
        currentModalId = null;
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    /* ── WIRE CARD BUTTONS ───────────────────────────────────── */
    document.querySelectorAll('.icon-btn.info-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openModal(btn.dataset.id);
        });
    });

    document.querySelectorAll('.icon-btn.add-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = document.querySelector('.menu-card[data-id="' + btn.dataset.id + '"]');
            if (!card) return;
            addToCart(
                card.dataset.id,
                card.dataset.name,
                parseInt(card.dataset.price),
                card.dataset.img
            );
            // Visual feedback on button
            btn.textContent = '✓';
            btn.style.background = 'var(--we-green)';
            btn.style.color = '#000';
            btn.style.borderColor = 'var(--we-green)';
            setTimeout(function () {
                btn.textContent = '🛒';
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }, 900);
        });
    });

    /* ── COMMUNITY FEED ──────────────────────────────────────── */
    [imageInput, videoInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('change', function () {
            const file = input.files[0];
            if (!file || !previewContainer) return;
            const url = URL.createObjectURL(file);
            previewContainer.innerHTML = '';
            const el = file.type.startsWith('image/')
                ? document.createElement('img')
                : document.createElement('video');
            if (!file.type.startsWith('image/')) el.controls = true;
            el.src = url;
            el.className = 'post-media';
            previewContainer.appendChild(el);
        });
    });

    let mediaRecorder, audioChunks = [];
    if (recordBtn) {
        recordBtn.addEventListener('click', async function () {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.ondataavailable = function (e) { audioChunks.push(e.data); };
                    mediaRecorder.onstop = function () {
                        const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
                        const url  = URL.createObjectURL(blob);
                        if (previewContainer) {
                            previewContainer.innerHTML = '<audio controls src="' + url + '" class="post-media"></audio>';
                        }
                    };
                    mediaRecorder.start();
                    if (recordStatus) recordStatus.style.display = 'inline';
                    recordBtn.textContent = '🛑';
                } catch (e) { console.error('Mic denied', e); }
            } else {
                mediaRecorder.stop();
                if (recordStatus) recordStatus.style.display = 'none';
                recordBtn.textContent = '🎤';
            }
        });
    }

    if (postBtn && feed) {
        postBtn.addEventListener('click', function () {
            const text      = commentInput ? commentInput.value.trim() : '';
            const mediaHtml = previewContainer ? previewContainer.innerHTML : '';
            if (!text && !mediaHtml) return;
            const post = document.createElement('div');
            post.className = 'thread-post';
            post.innerHTML =
                '<div class="post-sidebar"><div class="user-avatar">U</div></div>' +
                '<div class="post-body">' +
                  '<div class="post-meta"><strong>@User</strong><span>Just Now</span></div>' +
                  '<p>' + text + '</p>' +
                  '<div class="media-content">' + mediaHtml + '</div>' +
                  '<div class="post-actions">' +
                    '<button class="action-btn like-btn">▲ <span class="count">0</span></button>' +
                    '<button class="action-btn dislike-btn">▼ <span class="count">0</span></button>' +
                    '<button class="action-btn">REPLY</button>' +
                  '</div>' +
                '</div>';

            const lBtn = post.querySelector('.like-btn');
            const dBtn = post.querySelector('.dislike-btn');
            lBtn.onclick = function () {
                lBtn.classList.toggle('active-like');
                dBtn.classList.remove('active-dislike');
                lBtn.querySelector('.count').textContent = lBtn.classList.contains('active-like') ? '1' : '0';
                dBtn.querySelector('.count').textContent = '0';
            };
            dBtn.onclick = function () {
                dBtn.classList.toggle('active-dislike');
                lBtn.classList.remove('active-like');
                dBtn.querySelector('.count').textContent = dBtn.classList.contains('active-dislike') ? '1' : '0';
                lBtn.querySelector('.count').textContent = '0';
            };

            feed.prepend(post);
            if (commentInput)     commentInput.value = '';
            if (previewContainer) previewContainer.innerHTML = '';
        });
    }

    /* ── INIT ────────────────────────────────────────────────── */
    updateTray();
    renderCartPanel();
});