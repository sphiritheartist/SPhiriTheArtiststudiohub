// ================= GLOBAL STATE =================
window.cart = [];

// ================= THEME LOGIC =================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

// ================= COMPONENT LOADER =================
async function loadComponents() {
    const navSpace = document.getElementById('nav-placeholder');
    if (navSpace) {
        const response = await fetch('nav.html');
        const data = await response.text();
        navSpace.innerHTML = data;
    }

    const footerSpace = document.getElementById('footer-placeholder');
    if (footerSpace) {
        const response = await fetch('footer.html');
        const data = await response.text();
        footerSpace.innerHTML = data;
    }
    initBagListener();
}

function initBagListener() {
    const bagBtn = document.querySelector('.bag-btn');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    if (bagBtn && cartSidebar) {
        bagBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            overlay.classList.add('active');
        });
    }
    if(window.updateCartUI) window.updateCartUI(); 
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadComponents();
    
    // Intersection Observer for Reveal Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});