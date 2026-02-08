# SPhiriTheArtist Studio Hub

A complete, fully functional multidisciplinary portfolio and e-commerce website showcasing tech products, 3D printing services, skate shop items, creative works, and poetry.

## 🎨 Features Implemented

### ✅ Core Functionality
- **Theme Toggle**: Light/Dark mode with localStorage persistence
- **Shopping Cart System**: Full cart with add/remove items, quantity adjustment, and total calculation
- **Persistent Storage**: Cart data saved to localStorage
- **Checkout System**: Complete checkout flow with order confirmation
- **Poetry Modal**: Beautiful modal display for full poems
- **Smooth Animations**: Reveal-on-scroll effects for all sections
- **Responsive Design**: Mobile-friendly layout
- **Navigation**: Smooth scroll to sections

### 🛒 Cart Features
- Add items to bag
- Adjust quantities (increase/decrease)
- Remove items
- Real-time total calculation
- Cart badge counter
- Persistent cart (survives page reload)
- Empty cart detection
- Visual feedback on add to cart

### 🎭 UI/UX Enhancements
- Toast notifications for user actions
- Smooth transitions between light/dark themes
- Hover effects on cards and buttons
- Loading animations for images
- Backdrop blur for modals
- ESC key to close modals/sidebar
- Click outside to close overlays
- Scroll effects on navbar

### 📱 Responsive Elements
- Mobile-optimized navigation
- Flexible grid layouts
- Touch-friendly buttons
- Full-width cart on mobile
- Responsive typography

## 📁 File Structure

```
project/
├── index.html          # Main HTML structure
├── style.css           # Complete styling with theme support
├── script.js           # All JavaScript functionality
└── assets/
    └── images/         # Product images, logos, artwork
```

## 🚀 How to Use

### Installation
1. Place all files in the same directory
2. Ensure your folder structure matches:
   ```
   /index.html
   /style.css
   /script.js
   /assets/images/...
   ```

### Running the Site
Simply open `index.html` in a modern web browser. No server required!

## 🎯 Key Functions

### Theme Toggle
```javascript
// Automatically saves preference to localStorage
// Smooth transitions between light and dark modes
```

### Cart Management
```javascript
// Add to cart
cart.push({ name, price, description, quantity })

// Update quantities
cart[index].quantity++

// Calculate total
total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
```

### Notifications
```javascript
showNotification('Message', duration)
// Displays toast notification at top of screen
```

## 🎨 Sections

1. **Tech & Hardware** - Premium tech products
2. **3D Studio** - Custom 3D printing quote request
3. **Skate Shop** - Custom decks, hardware, and accessories
4. **Creative Works** - Portfolio gallery with hover overlays
5. **The Verse** - Poetry collection with modal reader

## ⚙️ Customization

### Colors
Edit CSS variables in `:root`:
```css
:root {
    --accent-blue: #0071e3;
    --system-bg: #ffffff;
    --system-text: #1d1d1f;
    /* etc. */
}
```

### Products
Add new products in HTML:
```html
<div class="card reveal">
    <div class="badge">New</div>
    <div class="placeholder-img">Product Name</div>
    <div class="card-info">
        <h3>Product Title</h3>
        <p>Description</p>
        <span class="price">$99</span>
        <button class="buy-btn">Add to Bag</button>
    </div>
</div>
```

### Contact Email
Update in `script.js` line 289:
```javascript
const email = 'your-email@domain.com';
```

## 🔧 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Performance Features

- Lazy reveal animations
- Efficient DOM manipulation
- LocalStorage for persistence
- Debounced scroll events
- CSS-based animations (hardware accelerated)

## 🎭 Interactive Elements

### Modal System
- Poetry reader modal
- Cart sidebar
- Background dimmer with blur
- Multiple close methods (button, outside click, ESC key)

### Shopping Cart
- Slide-in sidebar animation
- Real-time updates
- Visual feedback on actions
- Empty state handling

### Animations
- Fade-in on scroll
- Button press effects
- Theme transition
- Cart item slide-in
- Notification toasts

## 💡 Tips

1. **Images**: Replace placeholder images with actual product photos for best results
2. **Pricing**: Update prices in HTML - JavaScript will calculate totals automatically
3. **Checkout**: Currently simulated - integrate with payment processor for production
4. **Analytics**: Add Google Analytics or similar for tracking
5. **SEO**: Update meta tags in HTML head section

## 🐛 Debugging

Check browser console for:
```
🎨 SPhiriTheArtist Studio Hub Loaded Successfully
```

If cart isn't working:
- Check localStorage permissions in browser
- Verify JavaScript is enabled
- Check console for errors

## 🔒 Security Notes

- No sensitive data stored in localStorage
- Client-side cart only (no backend)
- Sanitize user inputs before production
- Use HTTPS in production
- Add CSRF protection for real checkout

## 📈 Future Enhancements

Potential additions:
- [ ] Backend integration
- [ ] Payment gateway (Stripe/PayPal)
- [ ] User accounts
- [ ] Order history
- [ ] Email notifications
- [ ] Admin panel
- [ ] Product reviews
- [ ] Wishlist functionality
- [ ] Social media integration
- [ ] Newsletter signup

## 🤝 Credits

Built for **Simphiwe Phiri** (SPhiriTheArtist)
Design inspired by Apple's minimalist aesthetic

## 📄 License

© 2026 SPhiriTheArtist. All rights reserved.

---

**Need help?** Check the code comments or reach out to your developer.
**Found a bug?** Check the browser console for error messages.
**Want to customize?** All code is commented and organized for easy editing!
