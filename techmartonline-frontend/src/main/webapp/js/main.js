/**
 * ============================================================
 * MAIN.JS - TechMart Online
 * Homepage functionality (index.html)
 * ============================================================
 */

// Fallback mockup data in case API fails
const mockupProducts = {
    newArrivals: [
        {
            id: 101,
            name: 'MacBook Pro M3 16"',
            category: 'Electronics',
            price: 2499.99,
            rating: 4.9,
            reviews: 128,
            emoji: '💻',
            badge: 'new',
            badgeText: 'NEW',
            stockQty: 5
        },
        {
            id: 102,
            name: 'Sony WH-1000XM6',
            category: 'Audio',
            price: 399.99,
            rating: 4.8,
            reviews: 95,
            emoji: '🎧',
            badge: 'new',
            badgeText: 'NEW',
            stockQty: 8
        }
    ],
    trending: [
        {
            id: 201,
            name: 'Apple AirPods Pro 3',
            category: 'Audio',
            price: 249.99,
            rating: 4.8,
            reviews: 450,
            emoji: '🎧',
            badge: 'trending',
            badgeText: '🔥 TRENDING',
            stockQty: 12
        }
    ]
};

// ============================================================ */
// RENDER PRODUCT CARDS - With Dynamic DB Stock Checking
// ============================================================ */
function renderProductCards(productsList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!productsList || productsList.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs font-semibold py-8 text-center col-span-full">No products in this category.</p>';
        return;
    }

    container.innerHTML = productsList.map(product => {
        const imageIcon = (product.images && product.images.length > 0) ? product.images[0] : '📦';
        const isUrl = imageIcon.startsWith('http://') || imageIcon.startsWith('https://') || imageIcon.startsWith('data:image/');
        const imageElement = isUrl 
            ? `<img src="${imageIcon}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;" />`
            : `<span class="product-emoji">${imageIcon}</span>`;

        // Check availability
        const isAvailable = product.stockQty > 0;
        const availabilityBadge = isAvailable
            ? `<span style="font-size:10px; font-weight:bold; color:#059669; background:#ecfdf5; padding:2px 6px; border-radius:4px; border:1px solid #a7f3d0; margin-left:8px;">Stock: ${product.stockQty}</span>`
            : `<span style="font-size:10px; font-weight:bold; color:#dc2626; background:#fef2f2; padding:2px 6px; border-radius:4px; border:1px solid #fecaca; margin-left:8px;">Out of Stock</span>`;

        const addButton = isAvailable
            ? `<button class="btn-add cursor-pointer" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, ${product.stockQty}, '${isUrl ? imageIcon : '📦'}')">🛒 Add to Cart</button>`
            : `<button class="btn-add cursor-not-allowed" style="background:#f1f5f9; color:#94a3b8; border:1px solid #e2e8f0;" disabled>Sold Out</button>`;

        const buyButton = isAvailable
            ? `<button class="btn-buy cursor-pointer" onclick="buyNow(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, ${product.stockQty}, '${isUrl ? imageIcon : '📦'}')">⚡ Buy Now</button>`
            : `<button class="btn-buy cursor-not-allowed" style="background:#f8fafc; color:#cbd5e1; border:1px solid #f1f5f9;" disabled>Sold Out</button>`;

        return `
            <div class="product-card" data-id="${product.id}">
                <span class="badge new">NEW</span>
                <div class="image-wrapper">
                    ${imageElement}
                </div>
                <div class="body">
                    <div style="display:flex; justify-between; align-items:center;">
                        <span class="category-tag">${product.category || 'General'}</span>
                        ${availabilityBadge}
                    </div>
                    <h3 class="name"><a href="user/product-detail.html?id=${product.id}">${product.name}</a></h3>
                    <div class="rating">
                        <span class="stars">★★★★★</span>
                        <span class="count">(10)</span>
                    </div>
                    <div class="price-row">
                        <span class="price">${Helpers.formatPrice(product.price)}</span>
                    </div>
                    <div class="actions">
                        ${addButton}
                        ${buyButton}
                        <button class="btn-wishlist" onclick="toggleWishlist(${product.id})">
                            ♡
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    loadWishlistState();
}

// ============================================================ */
// ADD TO CART
// ============================================================ */
function addToCart(id, name, price, maxStock, image) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity >= maxStock) {
            alert(`❌ Cannot add more! Only ${maxStock} units available in stock.`);
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Visual feedback
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (card.dataset.id == id) {
            const btn = card.querySelector('.btn-add');
            if (btn) {
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
        }
    });
}

// ============================================================ */
// BUY NOW - Redirect to checkout with product
// ============================================================ */
function buyNow(id, name, price, maxStock, image) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity >= maxStock) {
            window.location.href = 'user/checkout.html';
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

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

    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        const btn = card.querySelector('.btn-wishlist');
        if (btn) {
            if (wishlist.includes(productId)) {
                btn.innerHTML = '❤️';
                btn.classList.add('active');
            } else {
                btn.innerHTML = '♡';
                btn.classList.remove('active');
            }
        }
    }
}

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

function initCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

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
// INIT - Load dynamic products from DB
// ============================================================ */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const dbProducts = await ProductsAPI.getAll();
        
        // Show actual database products
        const newArrivals = dbProducts.slice(0, 4);
        const trending = dbProducts.slice(4, 8);

        renderProductCards(newArrivals, 'newArrivalsGrid');
        renderProductCards(trending, 'trendingGrid');
    } catch (e) {
        console.error("Failed to load products from database:", e);
        // Fallback to mockup data if database fails
        renderProductCards(mockupProducts.newArrivals, 'newArrivalsGrid');
        renderProductCards(mockupProducts.trending, 'trendingGrid');
    }

    // Update cart count
    updateCartCount();

    // Initialize category buttons
    initCategoryButtons();

    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize dynamic navigation
    initDynamicNav();
});

window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
        updateCartCount();
    }
});