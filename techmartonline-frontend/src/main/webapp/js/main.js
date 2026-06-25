/**
 * ============================================================
 * MAIN.JS - TechMart Online
 * Homepage functionality (index.html)
 * ============================================================
 */

// ============================================================ */
// PRODUCT DATA
// ============================================================ */
const products = {
    newArrivals: [
        {
            id: 101,
            name: 'MacBook Pro M3 16"',
            category: 'Electronics',
            price: 2499.99,
            oldPrice: 2799.99,
            rating: 4.9,
            reviews: 128,
            emoji: '💻',
            badge: 'new',
            badgeText: 'NEW'
        },
        {
            id: 102,
            name: 'Sony WH-1000XM6',
            category: 'Audio',
            price: 399.99,
            oldPrice: null,
            rating: 4.8,
            reviews: 95,
            emoji: '🎧',
            badge: 'new',
            badgeText: 'NEW'
        },
        {
            id: 103,
            name: 'Samsung Galaxy S24 Ultra',
            category: 'Electronics',
            price: 1299.99,
            oldPrice: 1499.99,
            rating: 4.9,
            reviews: 210,
            emoji: '📱',
            badge: 'new',
            badgeText: 'NEW'
        },
        {
            id: 104,
            name: 'Dell XPS 16"',
            category: 'Electronics',
            price: 1899.99,
            oldPrice: null,
            rating: 4.7,
            reviews: 78,
            emoji: '🖥️',
            badge: 'new',
            badgeText: 'NEW'
        }
    ],
    trending: [
        {
            id: 201,
            name: 'Apple AirPods Pro 3',
            category: 'Audio',
            price: 249.99,
            oldPrice: null,
            rating: 4.8,
            reviews: 450,
            emoji: '🎧',
            badge: 'trending',
            badgeText: '🔥 TRENDING'
        },
        {
            id: 202,
            name: 'Logitech MX Master 4S',
            category: 'Accessories',
            price: 99.99,
            oldPrice: null,
            rating: 4.9,
            reviews: 320,
            emoji: '🖱️',
            badge: 'trending',
            badgeText: '🔥 TRENDING'
        },
        {
            id: 203,
            name: 'LG 32" 4K OLED Monitor',
            category: 'Electronics',
            price: 899.99,
            oldPrice: 1099.99,
            rating: 4.7,
            reviews: 180,
            emoji: '🖥️',
            badge: 'sale',
            badgeText: 'SALE'
        },
        {
            id: 204,
            name: 'Bose QuietComfort Ultra',
            category: 'Audio',
            price: 429.99,
            oldPrice: null,
            rating: 4.9,
            reviews: 290,
            emoji: '🎧',
            badge: 'trending',
            badgeText: '🔥 TRENDING'
        }
    ]
};

// ============================================================ */
// RENDER PRODUCT CARDS - With Add to Cart + Buy Now
// ============================================================ */
function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = products.map(product => {
        // Rating stars
        const fullStars = Math.floor(product.rating);
        const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        const starsHtml = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);

        // Old price
        let oldPriceHtml = '';
        if (product.oldPrice) {
            oldPriceHtml = `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>`;
        }

        return `
            <div class="product-card" data-id="${product.id}">
                <span class="badge ${product.badge}">${product.badgeText}</span>
                <div class="image-wrapper">
                    <span class="product-emoji">${product.emoji}</span>
                </div>
                <div class="body">
                    <span class="category-tag">${product.category}</span>
                    <h3 class="name">${product.name}</h3>
                    <div class="rating">
                        <span class="stars">${starsHtml}</span>
                        <span class="count">(${product.reviews})</span>
                    </div>
                    <div class="price-row">
                        <span class="price">$${product.price.toFixed(2)} ${oldPriceHtml}</span>
                    </div>
                    <div class="actions">
                        <button class="btn-add" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.emoji}')">
                            🛒 Add to Cart
                        </button>
                        <button class="btn-buy" onclick="buyNow(${product.id}, '${product.name}', ${product.price}, '${product.emoji}')">
                            ⚡ Buy Now
                        </button>
                        <button class="btn-wishlist" onclick="toggleWishlist(${product.id})">
                            ♡
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Load wishlist state
    loadWishlistState();
}

// ============================================================ */
// ADD TO CART
// ============================================================ */
function addToCart(id, name, price, emoji) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, emoji, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Visual feedback
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (card.dataset.id == id) {
            const btn = card.querySelector('.btn-add');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Added!';
            btn.style.backgroundColor = '#5FC756';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 2000);
        }
    });
}

// ============================================================ */
// BUY NOW - Redirect to checkout with product
// ============================================================ */
function buyNow(id, name, price, emoji) {
    // Add to cart first
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, emoji, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Redirect to checkout page
    window.location.href = 'user/checkout.html';
}

// ============================================================ */
// WISHLIST
// ============================================================ */
function toggleWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(productId);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));

    // Update UI
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const btn = card.querySelector('.btn-wishlist');
        if (wishlist.includes(productId)) {
            btn.innerHTML = '❤️';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '♡';
            btn.classList.remove('active');
        }
    }
}

// ============================================================ */
// LOAD WISHLIST STATE
// ============================================================ */
function loadWishlistState() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist.forEach(id => {
        const card = document.querySelector(`.product-card[data-id="${id}"]`);
        if (card) {
            const btn = card.querySelector('.btn-wishlist');
            if (btn) {
                btn.innerHTML = '❤️';
                btn.classList.add('active');
            }
        }
    });
}

// ============================================================ */
// CART COUNT
// ============================================================ */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartLinks = document.querySelectorAll('.nav-links a[href="user/cart.html"], .mobile-menu a[href="user/cart.html"]');
    cartLinks.forEach(link => {
        link.textContent = count > 0 ? `Cart (${count})` : 'Cart';
    });
}

// ============================================================ */
// CATEGORY BUTTONS - Active State
// ============================================================ */
function initCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ============================================================ */
// MOBILE MENU
// ============================================================ */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
        });

        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        });
    }
}

// ============================================================ */
// DYNAMIC NAVIGATION BASED ON AUTH
// ============================================================ */
function initDynamicNav() {
    if (typeof AuthUtils === 'undefined') return;
    if (AuthUtils.isAuthenticated()) {
        const user = AuthUtils.getUser();
        const role = AuthUtils.getRole();
        const dashboardUrl = role === 'ADMIN' ? 'admin/dashboard.html' : 'user/dashboard.html';
        const name = user ? user.firstName : 'Account';
        
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            navActions.innerHTML = `
                <a href="${dashboardUrl}" class="btn-primary" style="background-color: var(--primary); color: var(--dark); padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">👤 ${name}</a>
                <button onclick="AuthUtils.logout('auth/login.html')" class="btn-outline cursor-pointer" style="margin-left: 8px; border: 2px solid var(--dark); padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; background: transparent; cursor: pointer;">Logout</button>
            `;
        }
        
        const navActionsMobile = document.querySelector('.nav-actions-mobile');
        if (navActionsMobile) {
            navActionsMobile.innerHTML = `
                <a href="${dashboardUrl}" class="btn-primary" style="background-color: var(--primary); color: var(--dark); padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; text-decoration: none; display: block; text-align: center; margin-bottom: 8px;">👤 ${name}</a>
                <button onclick="AuthUtils.logout('auth/login.html')" class="btn-outline cursor-pointer" style="width: 100%; border: 2px solid var(--dark); padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; background: transparent; cursor: pointer;">Logout</button>
            `;
        }
    }
}

// ============================================================ */
// INIT
// ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Render products
    renderProductCards(products.newArrivals, 'newArrivalsGrid');
    renderProductCards(products.trending, 'trendingGrid');

    // Update cart count
    updateCartCount();

    // Initialize category buttons
    initCategoryButtons();

    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize dynamic navigation
    initDynamicNav();
});

// Listen for storage changes (if cart updated in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
        updateCartCount();
    }
});