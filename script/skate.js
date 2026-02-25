document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('theme-light');
        localStorage.setItem('hub-theme', document.body.classList.contains('theme-light') ? 'light' : 'dark');
    });

    // Global Cart Sync
    let cart = JSON.parse(localStorage.getItem('studioUnifiedCart')) || [];
    const countEl = document.getElementById('global-cart-count');

    function updateCart() {
        const total = cart.reduce((s, i) => s + i.qty, 0);
        if (countEl) countEl.textContent = total;
        localStorage.setItem('studioUnifiedCart', JSON.stringify(cart));
    }

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const existing = cart.find(i => i.name === name);
            if (existing) { existing.qty++; } else { cart.push({ name, qty: 1 }); }
            updateCart();
            btn.textContent = "Added ✓";
            setTimeout(() => btn.textContent = "Add to Bag", 1500);
        });
    });

    // Community Chat Posting
    const postBtn = document.getElementById('submit-post-btn');
    const postInput = document.getElementById('user-comment-input');
    const list = document.getElementById('comment-list-container');

    if (postBtn) {
        postBtn.addEventListener('click', () => {
            const val = postInput.value.trim();
            if (!val) return;
            const item = `
                <div class="comment-item">
                    <span style="font-size:10px; font-weight:900; color:var(--we-blue)">@CREATIVE</span>
                    <p style="margin-top:5px; font-size:14px;">${val}</p>
                </div>`;
            list.insertAdjacentHTML('afterbegin', item);
            postInput.value = "";
            list.scrollTop = 0;
        });
    }

    // Load state
    updateCart();
    if (localStorage.getItem('hub-theme') === 'light') document.body.classList.add('theme-light');
});