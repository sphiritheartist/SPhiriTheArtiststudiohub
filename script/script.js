/* ================= SYSTEM LOGIC ================= */
const state = {
  cart: [],
  cartOpen: false,
  menuOpen: false
};

const overlay = document.getElementById("overlay");
const cartSidebar = document.getElementById("cartSidebar");
const poemModal = document.getElementById("poemModal");

/* ================= OVERLAY MASTER CONTROL ================= */
// One function to rule them all - cleaner than multiple separate ones
function closeAllOverlays() {
  overlay.classList.remove("active");
  cartSidebar.classList.remove("open");
  poemModal.style.display = "none";
  document.body.style.overflow = ""; // Re-enable scroll
}

/* ================= CART LOGIC ================= */
function renderCart() {
  const cartItems = document.getElementById("cartItems");
  cartItems.innerHTML = state.cart.length === 0 ? "<li>Your bag is empty</li>" : "";
  state.cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "cart-item-row"; // Added for CSS styling
    li.innerHTML = `<span>${item.name}</span> <span>R${item.price}</span>`;
    cartItems.appendChild(li);
  });
}

document.querySelectorAll("[data-product]").forEach(btn => {
  btn.addEventListener("click", () => {
    state.cart.push({ name: btn.dataset.product, price: btn.dataset.price });
    renderCart();
    // Auto-open cart to show progress
    document.getElementById("cartToggle").click();
  });
});

/* ================= UI INTERACTIONS ================= */
document.getElementById("cartToggle").onclick = () => {
  cartSidebar.classList.add("open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden"; // Lock scroll
};

// Toggle for Mobile Hamburger
document.getElementById("menuToggle").onclick = () => {
  // Add mobile menu logic here if needed
  alert("Menu functionality coming in next commit"); 
};

/* ================= ASSET INTEGRITY ================= */
function validateAssets() {
  document.querySelectorAll("img").forEach(img => {
    // Check if it's a PDF disguised as an image
    if (img.src.toLowerCase().includes(".pdf")) {
      const pdfIcon = document.createElement("div");
      pdfIcon.className = "image-placeholder pdf-style";
      pdfIcon.innerHTML = "<span>📄 PDF Preview</span>";
      img.replaceWith(pdfIcon);
    }

    img.onerror = () => {
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      img.replaceWith(placeholder);
    };
  });
}

/* ================= INITIALIZE ================= */
window.addEventListener("DOMContentLoaded", () => {
  validateAssets();
  
  // Observe for reveal animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
});

// Closing listeners
document.getElementById("closeCart").onclick = closeAllOverlays;
document.getElementById("closePoem").onclick = closeAllOverlays;
overlay.onclick = closeAllOverlays;

/* ================= THEME ENGINE ================= */
const themeToggle = document.getElementById("themeToggle");

// Function to set the theme
const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme); // Saves their choice for next visit
    themeToggle.textContent = theme === "dark" ? "☾" : "☼";
};

// Toggle click handler
themeToggle.onclick = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
};

// Check for saved user preference on load
const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);