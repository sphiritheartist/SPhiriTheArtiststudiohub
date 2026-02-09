/* ================= GLOBAL STATE ================= */
const state = {
    cart: JSON.parse(localStorage.getItem("sphiri_cart")) || [],
    theme: localStorage.getItem("theme") || "light"
};

/* ================= INJECTION LOGIC ================= */
async function loadSharedComponents() {
    console.log("System: Initializing injection...");
    
    try {
        // Fetch the components
        const [navRes, footRes] = await Promise.all([
            fetch('nav.html'),
            fetch('footer.html')
        ]);

        // Convert to text
        const navHTML = await navRes.text();
        const footHTML = await footRes.text();

        // Inject into placeholders
        document.getElementById('nav-placeholder').innerHTML = navHTML;
        document.getElementById('footer-placeholder').innerHTML = footHTML;

        console.log("System: Injection successful.");
        
        // Initialize logic AFTER elements exist in the DOM
        initGlobalEvents();
        syncUI();

        // Lightbox Logic (Only runs if gallery exists)
        const gallery = document.querySelector('.media-grid');
        if (gallery) {
            gallery.onclick = (e) => {
                const card = e.target.closest('.media-card');
                if (!card) return;
                
                const img = card.querySelector('img');
                const lightbox = document.getElementById('lightbox');
                const lbImg = document.getElementById('lightbox-img');
                
                lbImg.src = img.src;
                document.getElementById('lightbox-caption').textContent = card.querySelector('.overlay span').textContent;
                
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            };
}

    } catch (err) {
        console.error("System Error: Component injection failed.", err);
    }
}

/* ================= UI SYNC ================= */
function syncUI() {
    document.documentElement.setAttribute("data-theme", state.theme);
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.textContent = state.theme === "dark" ? "☾" : "☼";

    const count = document.getElementById("cartCount");
    if (count) count.textContent = state.cart.length;
}

/* ================= EVENT LISTENERS ================= */
function initGlobalEvents() {
    // Theme Toggle
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
        themeBtn.onclick = () => {
            state.theme = state.theme === "light" ? "dark" : "light";
            localStorage.setItem("theme", state.theme);
            syncUI();
        };
    }

    // Cart Sidebar Logic
    const cartToggle = document.getElementById("cartToggle");
    const overlay = document.getElementById("overlay");
    const sidebar = document.getElementById("cartSidebar");
    const closeBtn = document.getElementById("closeCart");

    if (cartToggle) {
        cartToggle.onclick = () => {
            sidebar.classList.add("open");
            overlay.classList.add("active");
        };
    }

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    };

    if (overlay) overlay.onclick = closeSidebar;
    if (closeBtn) closeBtn.onclick = closeSidebar;

    // Scroll Reveal Observer
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) =>
    {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el =>
    observer.observe(el));

}

// Fire when the base HTML is ready
window.addEventListener("DOMContentLoaded", loadSharedComponents);


