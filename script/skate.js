document.addEventListener('DOMContentLoaded', function() {

    // --- 1. SELECTORS ---
    const previewContainer = document.getElementById('media-preview-container');
    const imageInput       = document.getElementById('image-input');
    const videoInput       = document.getElementById('video-input');
    const postBtn          = document.getElementById('submit-post-btn');
    const commentInput     = document.getElementById('user-comment-input');
    const feed             = document.getElementById('comment-list-container');
    const recordBtn        = document.getElementById('vn-record-btn');
    const recordingStatus  = document.getElementById('recording-status');
    const productSearch    = document.getElementById('productSearch');
    const themeToggle      = document.getElementById('themeToggle');
    const bagWrapper       = document.querySelector('.bag-icon-wrapper');
    const bagCount         = document.querySelector('.bag-count');
    const cartOverlay      = document.getElementById('cart-overlay');
    const closeCart        = document.getElementById('close-cart');
    const cartBlur         = document.getElementById('cart-blur');
    const itemsList        = document.getElementById('cart-items-list');
    const cartTotalEl      = document.getElementById('cart-total');

    // --- 2. THEME ---
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('theme-light');
            themeToggle.innerText = document.body.classList.contains('theme-light') ? '🌙' : '☀️';
        });
    }

    // --- 3. SEARCH & FILTER ---
    if (productSearch) {
        productSearch.addEventListener('input', function(e) {
            var term = e.target.value.toLowerCase();
            document.querySelectorAll('.skate-item').forEach(function(item) {
                var nameEl = item.querySelector('h3');
                var name = nameEl ? nameEl.innerText.toLowerCase() : '';
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
        });
    }

    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var active = document.querySelector('.filter-btn.active');
            if (active) active.classList.remove('active');
            btn.classList.add('active');
            var cat = btn.dataset.category;
            document.querySelectorAll('.skate-item').forEach(function(item) {
                item.style.display = (cat === 'all' || item.dataset.category === cat) ? 'flex' : 'none';
            });
        });
    });

    // --- 4. MEDIA PREVIEWS ---
    [imageInput, videoInput].forEach(function(input) {
        if (!input) return;
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file || !previewContainer) return;
            var url = URL.createObjectURL(file);
            previewContainer.innerHTML = '';
            var el = file.type.startsWith('image/') ? document.createElement('img') : document.createElement('video');
            if (file.type.startsWith('video/')) el.controls = true;
            el.src = url;
            el.className = 'post-media';
            previewContainer.appendChild(el);
        });
    });

    // --- 5. VOICE NOTES ---
    var mediaRecorder, audioChunks = [];
    if (recordBtn) {
        recordBtn.addEventListener('click', async function() {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                try {
                    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.ondataavailable = function(e) { audioChunks.push(e.data); };
                    mediaRecorder.onstop = function() {
                        var blob = new Blob(audioChunks, { type: 'audio/mpeg' });
                        var url = URL.createObjectURL(blob);
                        if (previewContainer) previewContainer.innerHTML = '<audio controls src="' + url + '" class="post-media"></audio>';
                    };
                    mediaRecorder.start();
                    if (recordingStatus) recordingStatus.style.display = 'inline';
                    recordBtn.innerText = '🛑';
                } catch (err) { console.error('Mic denied', err); }
            } else {
                mediaRecorder.stop();
                if (recordingStatus) recordingStatus.style.display = 'none';
                recordBtn.innerText = '🎤';
            }
        });
    }

    // --- 6. POST THREADS ---
    if (postBtn && feed) {
        postBtn.addEventListener('click', function() {
            var text = commentInput ? commentInput.value.trim() : '';
            var mediaHtml = previewContainer ? previewContainer.innerHTML : '';
            if (!text && !mediaHtml) return;

            var post = document.createElement('div');
            post.className = 'thread-post';
            post.innerHTML =
                '<div class="post-sidebar"><div class="user-avatar">U</div></div>' +
                '<div class="post-body">' +
                    '<div class="post-meta"><strong>@User</strong> <span>Just Now</span></div>' +
                    '<p>' + text + '</p>' +
                    '<div class="media-content">' + mediaHtml + '</div>' +
                    '<div class="post-actions">' +
                        '<button class="action-btn like-btn">▲ <span class="count">0</span></button>' +
                        '<button class="action-btn dislike-btn">▼ <span class="count">0</span></button>' +
                        '<button class="action-btn">REPLY</button>' +
                    '</div>' +
                '</div>';

            var lBtn = post.querySelector('.like-btn');
            var dBtn = post.querySelector('.dislike-btn');
            lBtn.onclick = function() {
                lBtn.classList.toggle('active-like');
                dBtn.classList.remove('active-dislike');
                lBtn.querySelector('.count').innerText = lBtn.classList.contains('active-like') ? '1' : '0';
                dBtn.querySelector('.count').innerText = '0';
            };
            dBtn.onclick = function() {
                dBtn.classList.toggle('active-dislike');
                lBtn.classList.remove('active-like');
                dBtn.querySelector('.count').innerText = dBtn.classList.contains('active-dislike') ? '1' : '0';
                lBtn.querySelector('.count').innerText = '0';
            };

            feed.prepend(post);
            if (commentInput) commentInput.value = '';
            if (previewContainer) previewContainer.innerHTML = '';
        });
    }

    // --- 7. SMOOTH SCROLL ---
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- 8. SKATE SHOP CART ---
    var cart = JSON.parse(localStorage.getItem('wesorted-cart') || '[]');

    function updateBagUI() {
        if (!bagCount) return;
        var total = cart.reduce(function(s, i) { return s + i.qty; }, 0);
        bagCount.innerText = total;
        bagCount.style.display = total > 0 ? 'flex' : 'none';
    }

    function renderCart() {
        if (!itemsList) return;
        itemsList.innerHTML = '';
        var total = 0;
        cart.forEach(function(item, index) {
            total += item.price * item.qty;
            itemsList.innerHTML +=
                '<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);padding:15px;border-radius:15px;">' +
                    '<div>' +
                        '<div style="font-weight:800;font-size:14px;">' + item.name + '</div>' +
                        '<div style="color:var(--system-muted);font-size:12px;">R ' + item.price.toLocaleString() + '</div>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:12px;">' +
                        '<button onclick="window.skateChangeQty(' + index + ',-1)" style="background:none;border:1px solid var(--system-border);color:var(--system-text);cursor:pointer;width:24px;height:24px;border-radius:5px;">-</button>' +
                        '<span style="font-weight:900;font-size:14px;">' + item.qty + '</span>' +
                        '<button onclick="window.skateChangeQty(' + index + ',1)" style="background:none;border:1px solid var(--system-border);color:var(--system-text);cursor:pointer;width:24px;height:24px;border-radius:5px;">+</button>' +
                    '</div>' +
                '</div>';
        });
        if (cartTotalEl) cartTotalEl.innerText = 'R ' + total.toLocaleString();
        localStorage.setItem('wesorted-cart', JSON.stringify(cart));
        updateBagUI();
    }

    window.skateChangeQty = function(index, change) {
        if (!cart[index]) return;
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        renderCart();
    };

    function openCart() {
        if (cartOverlay) cartOverlay.style.right = '0';
        if (cartBlur) cartBlur.classList.add('active');
        document.body.classList.add('cart-open');
    }

    function closeCartFn() {
        if (cartOverlay) cartOverlay.style.right = '-400px';
        if (cartBlur) cartBlur.classList.remove('active');
        document.body.classList.remove('cart-open');
    }

    if (bagWrapper) bagWrapper.addEventListener('click', openCart);
    if (closeCart)  closeCart.addEventListener('click', closeCartFn);
    if (cartBlur)   cartBlur.addEventListener('click', closeCartFn);

    document.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var name = btn.dataset.name;
            var priceEl = btn.closest('.skate-info') && btn.closest('.skate-info').querySelector('.skate-price');
            var price = priceEl ? parseFloat(priceEl.innerText.replace(/[^\d.]/g, '')) : 0;
            var existing = cart.find(function(i) { return i.name === name; });
            if (existing) { existing.qty += 1; } else { cart.push({ name: name, price: price, qty: 1 }); }
            renderCart();
            openCart();
        });
    });

    renderCart();
    updateBagUI();

}); // end DOMContentLoaded