document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle with LocalStorage
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            localStorage.setItem('hub-theme', document.body.classList.contains('theme-light') ? 'light' : 'dark');
        });
    }

    // 2. Global Cart Persistence
    let cart = JSON.parse(localStorage.getItem('studioUnifiedCart')) || [];
    const countEl = document.getElementById('global-cart-count');

    function updateCartDisplay() {
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        if (countEl) countEl.textContent = total;
        localStorage.setItem('studioUnifiedCart', JSON.stringify(cart));
    }

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const existing = cart.find(i => i.name === name);
            if (existing) {
                existing.qty++;
            } else {
                cart.push({ name, qty: 1 });
            }
            updateCartDisplay();
            
            // Visual feedback
            const originalText = btn.textContent;
            btn.textContent = "Added ✓";
            btn.style.borderColor = "var(--we-green)";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.borderColor = "";
            }, 1500);
        });
    });

    // 3. Thread Posting Logic
    const postBtn = document.getElementById('submit-post-btn');
    const postInput = document.getElementById('user-comment-input');
    const list = document.getElementById('comment-list-container');

    if (postBtn && list) {
        postBtn.addEventListener('click', () => {
            const val = postInput.value.trim();
            if (!val) return;
            
            const item = `
                <div class="thread-post">
                    <div class="post-sidebar"><div class="user-avatar">CR</div></div>
                    <div class="post-body">
                        <div class="post-meta"><strong style="color:var(--we-green)">@CREATIVE</strong> • Just now</div>
                        <p>${val}</p>
                    </div>
                </div>`;
            list.insertAdjacentHTML('afterbegin', item);
            postInput.value = "";
        });
    }

    // Initialize State
    updateCartDisplay();
    if (localStorage.getItem('hub-theme') === 'light') document.body.classList.add('theme-light');
});