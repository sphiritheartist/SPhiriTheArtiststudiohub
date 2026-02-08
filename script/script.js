document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. REVEAL ENGINE
    // ==========================================================================
    const reveals = document.querySelectorAll('.reveal');
    
    const triggerReveal = () => {
        reveals.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 50 || window.scrollY === 0) {
                el.classList.add('active');
            }
        });
    };

    setTimeout(triggerReveal, 100); 
    window.addEventListener('scroll', triggerReveal);

    // ==========================================================================
    // 2. THEME TOGGLE
    // ==========================================================================
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Add a smooth transition effect
        document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    });

    // ==========================================================================
    // 3. CART SYSTEM
    // ==========================================================================
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');
    
    // Update cart display
    const updateCart = () => {
        // Update count badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        
        // Update cart items display
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:var(--system-gray);">
                    <div style="font-size:48px; margin-bottom:16px;">🛒</div>
                    <p>Your bag is empty</p>
                </div>
            `;
            totalAmountElement.textContent = '$0.00';
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="cart-item" style="padding:20px 0; border-bottom:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                        <div style="flex:1;">
                            <h4 style="margin-bottom:4px; font-size:16px;">${item.name}</h4>
                            <p style="color:var(--system-gray); font-size:14px;">${item.description || ''}</p>
                        </div>
                        <button class="remove-item" data-index="${index}" style="background:none; border:none; color:var(--system-gray); cursor:pointer; font-size:20px; padding:0 8px;" aria-label="Remove item">×</button>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:12px; align-items:center;">
                            <button class="qty-btn decrease" data-index="${index}" style="background:var(--system-secondary); border:none; width:28px; height:28px; border-radius:50%; cursor:pointer; font-weight:600;">−</button>
                            <span style="min-width:20px; text-align:center; font-weight:600;">${item.quantity}</span>
                            <button class="qty-btn increase" data-index="${index}" style="background:var(--system-secondary); border:none; width:28px; height:28px; border-radius:50%; cursor:pointer; font-weight:600;">+</button>
                        </div>
                        <span style="font-weight:700; color:var(--accent-blue);">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
            
            // Calculate total
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalAmountElement.textContent = `$${total.toFixed(2)}`;
            
            // Add event listeners for quantity buttons
            document.querySelectorAll('.qty-btn.increase').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    cart[index].quantity++;
                    saveCart();
                    updateCart();
                });
            });
            
            document.querySelectorAll('.qty-btn.decrease').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    if (cart[index].quantity > 1) {
                        cart[index].quantity--;
                    } else {
                        cart.splice(index, 1);
                    }
                    saveCart();
                    updateCart();
                });
            });
            
            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    cart.splice(index, 1);
                    saveCart();
                    updateCart();
                    showNotification('Item removed from bag');
                });
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    };
    
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };
    
    // Add to cart functionality
    document.querySelectorAll('.buy-btn').forEach(btn => {
        // Skip buttons that are for viewing poems or requesting quotes
        if (btn.classList.contains('view-poem') || btn.textContent.includes('Quote')) {
            return;
        }
        
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.card');
            const name = card.querySelector('h3').textContent;
            const priceElement = card.querySelector('.price');
            
            // Skip if no price (like quote requests)
            if (!priceElement) {
                if (btn.textContent.includes('Quote')) {
                    showNotification('📧 Please contact us for a custom quote!', 3000);
                }
                return;
            }
            
            const price = parseFloat(priceElement.textContent.replace('$', ''));
            const description = card.querySelector('p').textContent;
            
            // Check if item already in cart
            const existingItemIndex = cart.findIndex(item => item.name === name);
            
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity++;
            } else {
                cart.push({
                    name: name,
                    price: price,
                    description: description,
                    quantity: 1
                });
            }
            
            saveCart();
            updateCart();
            showNotification(`✓ ${name} added to bag!`);
            
            // Visual feedback on button
            btn.textContent = '✓ Added';
            btn.style.background = '#34c759';
            setTimeout(() => {
                btn.textContent = 'Add to Bag';
                btn.style.background = '';
            }, 1500);
        });
    });
    
    // Initial cart update
    updateCart();

    // ==========================================================================
    // 4. MODAL & SIDEBAR LOGIC
    // ==========================================================================
    const bgDimmer = document.getElementById('bg-overlay');
    const poemModal = document.getElementById('poem-modal');
    const cartSidebar = document.getElementById('cart-sidebar');
    const poemDisplay = document.getElementById('full-poem-display');

    // Open Poem Modal
    document.querySelectorAll('.view-poem').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-full');
            const title = btn.closest('.card').querySelector('h3').innerText;
            const icon = btn.closest('.card').querySelector('.poetry-icon').innerText;
            
            poemDisplay.innerHTML = `
                <div style="text-align:center; margin-bottom:30px;">
                    <div style="font-size:48px; margin-bottom:16px;">${icon}</div>
                    <h2 style="color:var(--system-text); font-size:32px; font-weight:700;">${title}</h2>
                </div>
                <p style="margin-top:20px; white-space:pre-line; font-size:18px; line-height:1.8; text-align:center; font-style:italic;">${text}</p>
            `;
            poemModal.classList.add('active');
            bgDimmer.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close Everything Function
    const closeAll = () => {
        poemModal.classList.remove('active');
        cartSidebar.classList.remove('open');
        bgDimmer.classList.remove('active');
        document.body.style.overflow = '';
    };

    document.getElementById('close-poem').addEventListener('click', closeAll);
    document.getElementById('close-cart').addEventListener('click', closeAll);
    bgDimmer.addEventListener('click', closeAll);

    // Open Cart Sidebar
    document.getElementById('cart-icon').addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('open');
        bgDimmer.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAll();
        }
    });

    // ==========================================================================
    // 5. CHECKOUT FUNCTIONALITY
    // ==========================================================================
    const checkoutBtn = cartSidebar.querySelector('.buy-btn');
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your bag is empty!', 2000);
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Create checkout summary
        const itemsList = cart.map(item => 
            `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        
        const confirmed = confirm(
            `Checkout Summary\n\n` +
            `${itemsList}\n\n` +
            `Total Items: ${itemCount}\n` +
            `Total: $${total.toFixed(2)}\n\n` +
            `Proceed to checkout?`
        );
        
        if (confirmed) {
            // Simulate checkout process
            showNotification('🎉 Processing your order...', 2000);
            
            setTimeout(() => {
                showNotification('✓ Order placed successfully! Thank you for your purchase.', 4000);
                cart = [];
                saveCart();
                updateCart();
                closeAll();
            }, 2000);
        }
    });

    // ==========================================================================
    // 6. NOTIFICATION SYSTEM
    // ==========================================================================
    const showNotification = (message, duration = 2000) => {
        // Remove existing notification if any
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background: var(--system-text);
            color: var(--system-bg);
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    };

    // ==========================================================================
    // 7. SMOOTH SCROLL FOR NAV LINKS
    // ==========================================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Don't prevent default for cart icon
            if (this.id === 'cart-icon') return;
            
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const offset = 70; // Account for fixed navbar
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================================================
    // 8. NAVBAR SCROLL EFFECT
    // ==========================================================================
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow when scrolled
        if (currentScroll > 10) {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '';
        }
        
        lastScroll = currentScroll;
    });

    // ==========================================================================
    // 9. QUOTE REQUEST HANDLER
    // ==========================================================================
    document.querySelectorAll('.buy-btn.secondary').forEach(btn => {
        if (btn.textContent.includes('Quote')) {
            btn.addEventListener('click', () => {
                const email = 'hello@sphiritheartist.com'; // Replace with actual email
                const subject = '3D Printing Quote Request';
                const body = 'Hi, I would like to request a quote for 3D printing services.\n\nProject details:\n\n';
                
                window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            });
        }
    });

    // ==========================================================================
    // 10. LOADING ANIMATION FOR IMAGES
    // ==========================================================================
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 10);
        });
    });

    console.log('🎨 SPhiriTheArtist Studio Hub Loaded Successfully');
});
