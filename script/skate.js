document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELECTORS ---
    const previewContainer = document.getElementById('media-preview-container');
    const imageInput = document.getElementById('image-input');
    const videoInput = document.getElementById('video-input');
    const postBtn = document.getElementById('submit-post-btn');
    const commentInput = document.getElementById('user-comment-input');
    const feed = document.getElementById('comment-list-container');
    const recordBtn = document.getElementById('vn-record-btn');
    const recordingStatus = document.getElementById('recording-status');
    const productSearch = document.getElementById('productSearch');
    const themeToggle = document.getElementById('themeToggle');

    // --- 2. THEME TOGGLE ---
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            themeToggle.innerText = document.body.classList.contains('theme-light') ? '🌙' : '☀️';
        });
    }

    // --- 3. SHOP: SEARCH & FILTER ---
    if (productSearch) {
        productSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.skate-item').forEach(item => {
                const name = item.querySelector('h3').innerText.toLowerCase();
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            const cat = btn.dataset.category;
            document.querySelectorAll('.skate-item').forEach(item => {
                item.style.display = (cat === 'all' || item.dataset.category === cat) ? 'flex' : 'none';
            });
        });
    });

    // --- 4. COMMUNITY: MEDIA PREVIEWS ---
    [imageInput, videoInput].forEach(input => {
        if (input) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file || !previewContainer) return;
                const url = URL.createObjectURL(file);
                previewContainer.innerHTML = ''; 
                const mediaElement = file.type.startsWith('image/') ? document.createElement('img') : document.createElement('video');
                if (file.type.startsWith('video/')) mediaElement.controls = true;
                mediaElement.src = url;
                mediaElement.className = 'post-media';
                previewContainer.appendChild(mediaElement);
            });
        }
    });

    // --- 5. COMMUNITY: VOICE NOTES ---
    let mediaRecorder;
    let audioChunks = [];
    if (recordBtn) {
        recordBtn.addEventListener('click', async () => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        previewContainer.innerHTML = `<audio controls src="${audioUrl}" class="post-media"></audio>`;
                    };
                    mediaRecorder.start();
                    if (recordingStatus) recordingStatus.style.display = 'inline';
                    recordBtn.innerText = '🛑';
                } catch (err) { console.error("Mic access denied", err); }
            } else {
                mediaRecorder.stop();
                if (recordingStatus) recordingStatus.style.display = 'none';
                recordBtn.innerText = '🎤';
            }
        });
    }

    // --- 6. COMMUNITY: POSTING THREADS ---
    if (postBtn && feed) {
        postBtn.addEventListener('click', () => {
            const text = commentInput.value.trim();
            const mediaHtml = previewContainer ? previewContainer.innerHTML : '';
            if (!text && !mediaHtml) return;

            const postElement = document.createElement('div');
            postElement.className = 'thread-post';
            postElement.innerHTML = `
                <div class="post-sidebar"><div class="user-avatar">U</div></div>
                <div class="post-body">
                    <div class="post-meta"><strong>@User</strong> <span>Just Now</span></div>
                    <p>${text}</p>
                    <div class="media-content">${mediaHtml}</div>
                    <div class="post-actions">
                        <button class="action-btn like-btn">▲ <span class="count">0</span></button>
                        <button class="action-btn dislike-btn">▼ <span class="count">0</span></button>
                        <button class="action-btn">REPLY</button>
                    </div>
                </div>`;

            const lBtn = postElement.querySelector('.like-btn');
            const dBtn = postElement.querySelector('.dislike-btn');
            lBtn.onclick = () => {
                lBtn.classList.toggle('active-like');
                dBtn.classList.remove('active-dislike');
                lBtn.querySelector('.count').innerText = lBtn.classList.contains('active-like') ? '1' : '0';
                dBtn.querySelector('.count').innerText = '0';
            };
            dBtn.onclick = () => {
                dBtn.classList.toggle('active-dislike');
                lBtn.classList.remove('active-like');
                dBtn.querySelector('.count').innerText = dBtn.classList.contains('active-dislike') ? '1' : '0';
                lBtn.querySelector('.count').innerText = '0';
            };

            feed.prepend(postElement);
            commentInput.value = '';
            previewContainer.innerHTML = '';
        });
    }

    // --- 7. NAVIGATION: SMOOTH SCROLL ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // --- 8. BAG LOGIC (CART) ---
    let cart = JSON.parse(localStorage.getItem('wesorted-cart')) || [];
    const bagWrapper = document.querySelector('.bag-icon-wrapper');
    const bagCount = document.querySelector('.bag-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartBlur = document.getElementById('cart-blur');
    const itemsList = document.getElementById('cart-items-list');
    const cartTotal = document.getElementById('cart-total');

    const updateBagUI = () => {
        if (bagCount) {
            const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            bagCount.innerText = totalItems;
            bagCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    };

    const renderCart = () => {
        if (!itemsList) return;
        itemsList.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.qty;
            itemsList.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:15px; border-radius:15px;">
                    <div>
                        <div style="font-weight:800; font-size:14px;">${item.name}</div>
                        <div style="color:var(--system-muted); font-size:12px;">R ${item.price.toLocaleString()}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button onclick="changeQty(${index}, -1)" style="background:none; border:1px solid var(--system-border); color:var(--system-text); cursor:pointer; width:24px; height:24px; border-radius:5px;">-</button>
                        <span style="font-weight:900; font-size:14px;">${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)" style="background:none; border:1px solid var(--system-border); color:var(--system-text); cursor:pointer; width:24px; height:24px; border-radius:5px;">+</button>
                    </div>
                </div>
            `;
        });

        cartTotal.innerText = `R ${total.toLocaleString()}`;
        localStorage.setItem('wesorted-cart', JSON.stringify(cart));
        updateBagUI();
    };

    window.changeQty = (index, change) => {
        cart[index].qty += change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        renderCart();
    };

    const openCart = () => {
        if (cartOverlay) cartOverlay.style.right = '0';
        if (cartBlur) cartBlur.classList.add('active');
        document.body.classList.add('cart-open');
    };

    const hideCart = () => {
        if (cartOverlay) cartOverlay.style.right = '-400px';
        if (cartBlur) cartBlur.classList.remove('active');
        document.body.classList.remove('cart-open');
    };

    bagWrapper?.addEventListener('click', openCart);
    closeCart?.addEventListener('click', hideCart);
    cartBlur?.addEventListener('click', hideCart);

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const priceText = btn.parentElement.querySelector('.skate-price').innerText;
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ name, price, qty: 1 });
            }
            
            renderCart();
            openCart();
        });
    });

    renderCart();
    updateBagUI();
});

// --- 8. BAG LOGIC (FIXED TOGGLE) ---
const toggleCart = () => {
    const isOpening = !cartOverlay.classList.contains('active');
    
    if (isOpening) {
        cartOverlay.classList.add('active');
        cartBlur?.classList.add('active');
        document.body.classList.add('cart-open');
    } else {
        cartOverlay.classList.remove('active');
        cartBlur?.classList.remove('active');
        document.body.classList.remove('cart-open');
    }
};

const updateBagUI = () => {
    if (bagCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        bagCount.innerText = totalItems;
        // Logic: Stay hidden until an item is added
        bagCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
};

// Toggle on bag icon click
bagWrapper?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCart();
});

// Close when clicking X or clicking outside (the blur)
closeCart?.addEventListener('click', toggleCart);
cartBlur?.addEventListener('click', toggleCart);

// Update Add-to-cart to use the new class
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const priceText = btn.parentElement.querySelector('.skate-price').innerText;
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ name, price, qty: 1 });
        }
        
        renderCart();
        if (!cartOverlay.classList.contains('active')) toggleCart();
    });
});