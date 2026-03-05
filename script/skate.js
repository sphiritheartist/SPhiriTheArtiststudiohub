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
        if (!window.SCart) return;
        var ok = SCart.add(id, name, price, img, null);
        if (ok) { updateTray(); renderCartPanel(); flashTray(); }
    }

    function changeQty(key, delta) {
        if (!window.SCart) return;
        SCart.changeQty(key, delta); updateTray(); renderCartPanel();
    }

    function cartTotal() { return window.SCart ? SCart.subtotal() : 0; }
    function cartItemCount() { return window.SCart ? SCart.itemCount() : 0; }

    function updateTray() {
        var count = cartItemCount();
        var total = cartTotal();
        if (bagCount) { bagCount.textContent = count; bagCount.style.display = count > 0 ? 'flex' : 'none'; }
        if (trayCount) trayCount.textContent = count;
        if (trayTotal) trayTotal.textContent = 'R ' + total.toLocaleString();
        if (trayBar) trayBar.classList.toggle('visible', count > 0);
        // nav badge
        document.querySelectorAll('#navBagCount').forEach(function(el) { el.textContent = count; el.classList.toggle('visible', count > 0); });
    }

    function flashTray() {
        if (!trayBar) return;
        trayBar.style.transform = 'translateY(-6px) scale(1.02)';
        setTimeout(function () { trayBar.style.transform = ''; }, 300);
    }

    function renderCartPanel() {
        if (!cartPanelItems) return;
        const items = Object.entries(cart);

        var items = window.SCart ? Object.entries(SCart.getAll()) : [];
        if (items.length === 0) {
            cartPanelItems.innerHTML = '<div class="empty-cart-msg"><div class="empty-cart-icon">🛍</div><p>Your order is empty.</p><p class="empty-cart-sub">Add something from the menu above.</p></div>';
        } else {
            cartPanelItems.innerHTML = items.map(function (entry) {
                var key  = entry[0];
                var item = entry[1];
                var lineTotal = item.price * item.qty;
                return (
                    '<div class="cart-line">' +
                      '<img class="cart-line-img" src="' + item.img + '" alt="' + item.name + '" onerror="this.style.display='none'">' +
                      '<div class="cart-line-info">' +
                        '<h4>' + item.name + '</h4>' +
                        '<span>R ' + item.price.toLocaleString() + ' each</span>' +
                      '</div>' +
                      '<div class="qty-stepper">' +
                        '<button class="qty-btn" data-key="' + key + '" data-delta="-1">−</button>' +
                        '<span class="qty-num">' + item.qty + '</span>' +
                        '<button class="qty-btn" data-key="' + key + '" data-delta="1">+</button>' +
                      '</div>' +
                      '<div class="cart-line-price">R ' + lineTotal.toLocaleString() + '</div>' +
                    '</div>'
                );
            }).join('');

            cartPanelItems.querySelectorAll('.qty-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    changeQty(btn.dataset.key, parseInt(btn.dataset.delta));
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

    /* ══════════════════════════════════════════════════════
       COMMUNITY FEED
       Single authoritative implementation. Handles:
       - Text posts
       - Image / video attachments
       - Voice notes (record + preview + send)
       - Like / dislike (toggle, mutual exclusive)
       - Reply threads (inline composer per post)
       - Sort: Recent · Top · Oldest
       - Post count display
    ══════════════════════════════════════════════════════ */

    const commentInput   = document.getElementById('user-comment-input');
    const previewContainer = document.getElementById('media-preview-container');
    const recordBtn      = document.getElementById('vn-record-btn');
    const recordStatus   = document.getElementById('recording-status');
    const postBtn        = document.getElementById('submit-post-btn');
    const feed           = document.getElementById('comment-list-container');
    const imageInput     = document.getElementById('image-input');
    const videoInput     = document.getElementById('video-input');
    const feedCount      = document.getElementById('feedCount');

    // ── Post data store ──────────────────────────────────
    let posts = [
        {
            id: 'p1', user: 'skate_za', initials: 'SZ',
            timestamp: Date.now() - 1000 * 60 * 120,
            text: 'New Primitive just dropped at WeSorted. Steep concave is proper — exactly what I needed for switch heels.',
            mediaHtml: '', likes: 14, dislikes: 0, liked: false, disliked: false,
            replies: [
                { id: 'r1a', user: 'maboneng_sk', initials: 'MB', timestamp: Date.now() - 1000 * 60 * 90, text: 'Been eyeing that deck. Does it run true to width?', likes: 3, dislikes: 0, liked: false, disliked: false }
            ]
        },
        {
            id: 'p2', user: 'maboneng_sk', initials: 'MB',
            timestamp: Date.now() - 1000 * 60 * 300,
            text: 'Session 004 RSVP is open. Last one was packed. Come early.',
            mediaHtml: '', likes: 9, dislikes: 1, liked: false, disliked: false,
            replies: []
        },
        {
            id: 'p3', user: 'boardhub_jb', initials: 'BJ',
            timestamp: Date.now() - 1000 * 60 * 60 * 26,
            text: 'Bones Reds on a fresh setup. Night and day difference from stock bearings. Worth every rand.',
            mediaHtml: '', likes: 22, dislikes: 0, liked: false, disliked: false,
            replies: []
        },
    ];

    let currentSort = 'recent';

    // ── Helpers ──────────────────────────────────────────
    function timeAgo(ts) {
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60)   return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    }

    function escapeHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function sortedPosts() {
        const arr = [...posts];
        if (currentSort === 'recent')  return arr.sort((a, b) => b.timestamp - a.timestamp);
        if (currentSort === 'top')     return arr.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        if (currentSort === 'oldest')  return arr.sort((a, b) => a.timestamp - b.timestamp);
        return arr;
    }

    // ── Render a single reply ────────────────────────────
    function renderReply(r, parentId) {
        const div = document.createElement('div');
        div.className = 'skate-reply';
        div.dataset.rid = r.id;
        div.innerHTML =
            '<div class="skate-avatar skate-avatar-sm">' + escapeHtml(r.initials) + '</div>' +
            '<div class="skate-post-body">' +
                '<div class="skate-post-meta">' +
                    '<strong>' + escapeHtml(r.user) + '</strong>' +
                    '<span>' + timeAgo(r.timestamp) + '</span>' +
                '</div>' +
                '<p class="skate-post-text">' + escapeHtml(r.text) + '</p>' +
                '<div class="skate-post-actions">' +
                    '<button class="skate-action-btn reply-like-btn ' + (r.liked ? 'active-like' : '') + '" data-pid="' + parentId + '" data-rid="' + r.id + '">▲ <span>' + r.likes + '</span></button>' +
                    '<button class="skate-action-btn reply-dislike-btn ' + (r.disliked ? 'active-dislike' : '') + '" data-pid="' + parentId + '" data-rid="' + r.id + '">▼ <span>' + r.dislikes + '</span></button>' +
                '</div>' +
            '</div>';

        div.querySelector('.reply-like-btn').addEventListener('click', function () {
            if (r.liked) { r.liked = false; r.likes--; }
            else { r.liked = true; r.likes++; if (r.disliked) { r.disliked = false; r.dislikes--; } }
            renderFeed();
        });
        div.querySelector('.reply-dislike-btn').addEventListener('click', function () {
            if (r.disliked) { r.disliked = false; r.dislikes--; }
            else { r.disliked = true; r.dislikes++; if (r.liked) { r.liked = false; r.likes--; } }
            renderFeed();
        });
        return div;
    }

    // ── Render a single post ─────────────────────────────
    function renderPost(p) {
        const div = document.createElement('div');
        div.className = 'skate-thread-post';
        div.dataset.pid = p.id;

        div.innerHTML =
            '<div class="skate-avatar">' + escapeHtml(p.initials) + '</div>' +
            '<div class="skate-post-body">' +
                '<div class="skate-post-meta">' +
                    '<strong>' + escapeHtml(p.user) + '</strong>' +
                    '<span>' + timeAgo(p.timestamp) + '</span>' +
                '</div>' +
                (p.text ? '<p class="skate-post-text">' + escapeHtml(p.text) + '</p>' : '') +
                (p.mediaHtml ? '<div class="skate-post-media-wrap">' + p.mediaHtml + '</div>' : '') +
                '<div class="skate-post-actions">' +
                    '<button class="skate-action-btn post-like-btn ' + (p.liked ? 'active-like' : '') + '" data-pid="' + p.id + '">▲ <span>' + p.likes + '</span></button>' +
                    '<button class="skate-action-btn post-dislike-btn ' + (p.disliked ? 'active-dislike' : '') + '" data-pid="' + p.id + '">▼ <span>' + p.dislikes + '</span></button>' +
                    '<button class="skate-action-btn post-reply-btn" data-pid="' + p.id + '">💬 Reply' + (p.replies.length ? ' <span class="reply-count">(' + p.replies.length + ')</span>' : '') + '</button>' +
                '</div>' +
                // Reply thread container
                '<div class="skate-replies" id="replies-' + p.id + '">' +
                '</div>' +
                // Inline reply composer (hidden by default)
                '<div class="skate-reply-composer" id="reply-composer-' + p.id + '" style="display:none;">' +
                    '<textarea class="reply-textarea" placeholder="Write a reply…" id="reply-input-' + p.id + '"></textarea>' +
                    '<div class="reply-composer-actions">' +
                        '<button class="skate-action-btn reply-cancel-btn" data-pid="' + p.id + '">Cancel</button>' +
                        '<button class="btn-outline reply-send-btn" data-pid="' + p.id + '" style="font-size:12px;padding:6px 16px;">Send</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Render replies
        const repliesEl = div.querySelector('#replies-' + p.id);
        p.replies.forEach(function (r) {
            repliesEl.appendChild(renderReply(r, p.id));
        });

        // Like
        div.querySelector('.post-like-btn').addEventListener('click', function () {
            if (p.liked) { p.liked = false; p.likes--; }
            else { p.liked = true; p.likes++; if (p.disliked) { p.disliked = false; p.dislikes--; } }
            renderFeed();
        });

        // Dislike
        div.querySelector('.post-dislike-btn').addEventListener('click', function () {
            if (p.disliked) { p.disliked = false; p.dislikes--; }
            else { p.disliked = true; p.dislikes++; if (p.liked) { p.liked = false; p.likes--; } }
            renderFeed();
        });

        // Toggle reply composer
        div.querySelector('.post-reply-btn').addEventListener('click', function () {
            const composer = div.querySelector('#reply-composer-' + p.id);
            const isOpen = composer.style.display !== 'none';
            composer.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
                const ta = div.querySelector('#reply-input-' + p.id);
                if (ta) ta.focus();
            }
        });

        // Cancel reply
        div.querySelector('.reply-cancel-btn').addEventListener('click', function () {
            div.querySelector('#reply-composer-' + p.id).style.display = 'none';
            div.querySelector('#reply-input-' + p.id).value = '';
        });

        // Send reply
        div.querySelector('.reply-send-btn').addEventListener('click', function () {
            const ta  = div.querySelector('#reply-input-' + p.id);
            const txt = ta ? ta.value.trim() : '';
            if (!txt) return;
            p.replies.push({
                id: 'r' + Date.now(),
                user: '@You',
                initials: 'U',
                timestamp: Date.now(),
                text: txt,
                likes: 0, dislikes: 0, liked: false, disliked: false
            });
            ta.value = '';
            div.querySelector('#reply-composer-' + p.id).style.display = 'none';
            renderFeed();
        });

        // Ctrl+Enter / Enter to send reply
        div.querySelector('#reply-input-' + p.id).addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                div.querySelector('.reply-send-btn').click();
            }
        });

        return div;
    }

    // ── Render full feed ─────────────────────────────────
    function renderFeed() {
        if (!feed) return;
        feed.innerHTML = '';
        const sorted = sortedPosts();
        sorted.forEach(function (p) {
            feed.appendChild(renderPost(p));
        });
        if (feedCount) {
            feedCount.textContent = posts.length + ' post' + (posts.length === 1 ? '' : 's');
        }
    }

    // ── Sort controls ────────────────────────────────────
    document.querySelectorAll('.feed-sort-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentSort = btn.dataset.sort;
            document.querySelectorAll('.feed-sort-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.sort === currentSort);
            });
            renderFeed();
        });
    });

    // ── Media preview (image / video) ────────────────────
    [imageInput, videoInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('change', function () {
            const file = input.files[0];
            if (!file || !previewContainer) return;
            const url = URL.createObjectURL(file);
            previewContainer.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'preview-wrap';
            const el = file.type.startsWith('image/')
                ? document.createElement('img')
                : document.createElement('video');
            if (!file.type.startsWith('image/')) el.controls = true;
            el.src = url;
            el.className = 'skate-post-media';
            const removeBtn = document.createElement('button');
            removeBtn.className = 'preview-remove-btn';
            removeBtn.textContent = '✕';
            removeBtn.onclick = function () { previewContainer.innerHTML = ''; input.value = ''; };
            wrap.appendChild(el);
            wrap.appendChild(removeBtn);
            previewContainer.appendChild(wrap);
        });
    });

    // ── Voice note recording ─────────────────────────────
    let mediaRecorder, audioChunks = [];
    if (recordBtn) {
        recordBtn.addEventListener('click', async function () {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) audioChunks.push(e.data); };
                    mediaRecorder.onstop = function () {
                        const blob = new Blob(audioChunks, { type: 'audio/webm' });
                        const url  = URL.createObjectURL(blob);
                        if (previewContainer) {
                            previewContainer.innerHTML = '';
                            const wrap = document.createElement('div');
                            wrap.className = 'preview-wrap';
                            wrap.innerHTML = '<audio controls src="' + url + '" class="skate-post-media"></audio>';
                            const removeBtn = document.createElement('button');
                            removeBtn.className = 'preview-remove-btn';
                            removeBtn.textContent = '✕';
                            removeBtn.onclick = function () { previewContainer.innerHTML = ''; };
                            wrap.appendChild(removeBtn);
                            previewContainer.appendChild(wrap);
                        }
                        // stop all mic tracks
                        stream.getTracks().forEach(function (t) { t.stop(); });
                    };
                    mediaRecorder.start();
                    if (recordStatus) recordStatus.style.display = 'inline';
                    recordBtn.textContent = '🛑';
                    recordBtn.title = 'Stop recording';
                } catch (e) {
                    console.error('Mic denied:', e);
                    alert('Microphone access was denied. Please allow mic access and try again.');
                }
            } else {
                mediaRecorder.stop();
                if (recordStatus) recordStatus.style.display = 'none';
                recordBtn.textContent = '🎤';
                recordBtn.title = 'Record voice note';
            }
        });
    }

    // ── Textarea auto-grow ───────────────────────────────
    if (commentInput) {
        commentInput.addEventListener('input', function () {
            commentInput.style.height = 'auto';
            commentInput.style.height = Math.min(commentInput.scrollHeight, 200) + 'px';
        });
        // Ctrl+Enter to post
        commentInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (postBtn) postBtn.click();
            }
        });
    }

    // ── Submit new post ──────────────────────────────────
    if (postBtn) {
        postBtn.addEventListener('click', function () {
            const text      = commentInput ? commentInput.value.trim() : '';
            const mediaWrap = previewContainer ? previewContainer.querySelector('.preview-wrap') : null;
            const mediaHtml = mediaWrap ? mediaWrap.innerHTML.replace(/<button[^>]*>.*?<\/button>/g, '') : '';

            if (!text && !mediaHtml) {
                // Shake the composer to indicate nothing to post
                const composer = document.querySelector('.skate-composer');
                if (composer) {
                    composer.style.animation = 'shake 0.35s ease';
                    setTimeout(function () { composer.style.animation = ''; }, 400);
                }
                return;
            }

            posts.unshift({
                id: 'p' + Date.now(),
                user: '@You',
                initials: 'U',
                timestamp: Date.now(),
                text: text,
                mediaHtml: mediaHtml,
                likes: 0, dislikes: 0, liked: false, disliked: false,
                replies: []
            });

            if (commentInput) {
                commentInput.value = '';
                commentInput.style.height = '';
            }
            if (previewContainer) previewContainer.innerHTML = '';
            // Reset file inputs
            if (imageInput) imageInput.value = '';
            if (videoInput) videoInput.value = '';

            // Switch to recent so they see their post at top
            currentSort = 'recent';
            document.querySelectorAll('.feed-sort-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.sort === 'recent');
            });

            renderFeed();

            // Scroll to top of feed
            if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ── Initial render ───────────────────────────────────
    renderFeed();

    /* ── INIT ────────────────────────────────────────────────── */
    updateTray();
    renderCartPanel();
});
/* ══════════════════════════════════════════════════════════
   RSVP SYSTEM
   Stores to localStorage (key: sphiri_rsvps) so data
   survives page refreshes without Firebase.
   Also writes to window.RSVPS so dashboard can read it
   once Firebase / db.js is wired in.
══════════════════════════════════════════════════════════ */
(function () {
    const EVENT_ID   = 'session-004';
    const EVENT_CAPACITY = 60;
    const STORAGE_KEY = 'sphiri_rsvps';

    // ── Load existing RSVPs from localStorage ────────────
    function loadRSVPs() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) { return []; }
    }

    function saveRSVPs(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        // Expose globally so dashboard.js / db.js can read it
        window.RSVPS = list;
    }

    function spotsLeft() {
        const taken = loadRSVPs()
            .filter(function (r) { return r.eventId === EVENT_ID; })
            .reduce(function (s, r) { return s + (r.guests || 1); }, 0);
        return Math.max(0, EVENT_CAPACITY - taken);
    }

    // ── Seat counter on the event card ───────────────────
    function updateSeatCounter() {
        var el = document.getElementById('rsvpSeatCounter');
        if (!el) return;
        var left = spotsLeft();
        if (left <= 0) {
            el.textContent = '🔴 Sold out';
            el.style.color = '#ff453a';
        } else if (left <= 10) {
            el.textContent = '⚡ ' + left + ' spots left';
            el.style.color = '#ff9500';
        } else {
            el.textContent = left + ' spots available';
            el.style.color = 'var(--muted)';
        }
    }

    // ── Modal open / close ───────────────────────────────
    var backdrop  = document.getElementById('rsvpBackdrop');
    var modal     = document.getElementById('rsvpModal');
    var closeBtn  = document.getElementById('rsvpClose');
    var openBtn   = document.getElementById('rsvpOpenBtn');
    var doneBtn   = document.getElementById('rsvpDoneBtn');
    var formView  = document.getElementById('rsvpFormView');
    var confirmView = document.getElementById('rsvpConfirmView');

    function openRSVP() {
        if (!backdrop) return;
        // Check capacity before opening
        if (spotsLeft() <= 0) {
            alert('Sorry — this session is fully booked. Follow us on socials for the next one.');
            return;
        }
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        formView.style.display = '';
        confirmView.style.display = 'none';
        document.getElementById('rsvpError').textContent = '';
    }

    function closeRSVP() {
        if (!backdrop) return;
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (openBtn)  openBtn.addEventListener('click', openRSVP);
    if (closeBtn) closeBtn.addEventListener('click', closeRSVP);
    if (doneBtn)  doneBtn.addEventListener('click', closeRSVP);
    if (backdrop) backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeRSVP();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeRSVP();
    });

    // ── Guest stepper ─────────────────────────────────────
    var guestCountEl = document.getElementById('rsvpGuestCount');
    var minusBtn     = document.getElementById('rsvpMinus');
    var plusBtn      = document.getElementById('rsvpPlus');
    var guestCount   = 1;

    function setGuests(n) {
        guestCount = Math.max(1, Math.min(6, n));
        if (guestCountEl) guestCountEl.textContent = guestCount;
        if (minusBtn) minusBtn.disabled = guestCount <= 1;
        if (plusBtn)  plusBtn.disabled  = guestCount >= Math.min(6, spotsLeft());
    }
    if (minusBtn) minusBtn.addEventListener('click', function () { setGuests(guestCount - 1); });
    if (plusBtn)  plusBtn.addEventListener('click',  function () { setGuests(guestCount + 1); });

    // ── Skate / Spectate toggle ───────────────────────────
    document.querySelectorAll('.rsvp-toggle-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.rsvp-toggle-btn').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            var roleInput = document.getElementById('rsvpRole');
            if (roleInput) roleInput.value = btn.dataset.val;
        });
    });

    // ── Submit ────────────────────────────────────────────
    var submitBtn  = document.getElementById('rsvpSubmit');
    var nameInput  = document.getElementById('rsvpName');
    var contactInput = document.getElementById('rsvpContact');
    var noteInput  = document.getElementById('rsvpNote');
    var roleInput  = document.getElementById('rsvpRole');
    var errorEl    = document.getElementById('rsvpError');
    var refEl      = document.getElementById('rsvpRef');

    function showError(msg) {
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            var name    = nameInput    ? nameInput.value.trim()    : '';
            var contact = contactInput ? contactInput.value.trim() : '';
            var note    = noteInput    ? noteInput.value.trim()    : '';
            var role    = roleInput    ? roleInput.value           : 'skate';

            // Validation
            if (!name)    { showError('Please enter your name.'); nameInput.focus(); return; }
            if (!contact) { showError('Please enter a WhatsApp number or email.'); contactInput.focus(); return; }
            if (spotsLeft() < guestCount) {
                showError('Not enough spots left. Only ' + spotsLeft() + ' remaining.');
                return;
            }

            // Build record
            var ref = 'RSV-' + Date.now().toString(36).toUpperCase();
            var record = {
                ref:      ref,
                eventId:  EVENT_ID,
                eventName:'Studio Session 004',
                name:     name,
                contact:  contact,
                guests:   guestCount,
                role:     role,
                note:     note,
                status:   'Confirmed',
                createdAt: new Date().toISOString(),
            };

            // Persist
            var list = loadRSVPs();
            list.push(record);
            saveRSVPs(list);

            // Show confirmation
            if (refEl) refEl.textContent = 'Reference: ' + ref;
            formView.style.display    = 'none';
            confirmView.style.display = '';

            // Update seat counter
            updateSeatCounter();

            // Reset form for next use
            if (nameInput)    nameInput.value    = '';
            if (contactInput) contactInput.value = '';
            if (noteInput)    noteInput.value     = '';
            setGuests(1);
            document.querySelectorAll('.rsvp-toggle-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.val === 'skate');
            });
            if (roleInput) roleInput.value = 'skate';

            console.log('[RSVP] Saved:', record);
        });
    }

    // ── Init ─────────────────────────────────────────────
    window.RSVPS = loadRSVPs();
    setGuests(1);
    updateSeatCounter();

})();