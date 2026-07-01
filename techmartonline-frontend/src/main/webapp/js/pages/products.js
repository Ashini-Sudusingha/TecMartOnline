let allProducts = [];
let categoriesList = [];

async function loadCatalog() {
    const grid = document.getElementById('productGrid');
    const loading = document.getElementById('loadingState');
    if (!grid) return;

    try {
        if (loading) loading.style.display = 'flex';
        
        // Fetch categories list first
        await loadCategoriesDropdown();

        // Fetch products
        allProducts = await ProductsAPI.getAll();
        
        if (loading) loading.style.display = 'none';

        applyFilters();
    } catch (e) {
        console.error(e);
        if (loading) loading.style.display = 'none';
        grid.innerHTML = '<p class="text-center py-12 text-rose-500 font-bold">Failed to load catalog.</p>';
    }
}

async function loadCategoriesDropdown() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    try {
        const res = await fetch(`${Config.BASE_URL}/products/categories`);
        if (!res.ok) throw new Error("Failed to load categories");
        const json = await res.json();
        categoriesList = json.data || [];

        select.innerHTML = '<option value="all">All Categories</option>' + 
            categoriesList.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        // Parse category from URL query parameter (case-insensitive)
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('category');
        if (catParam) {
            const matched = categoriesList.find(c => c.name.toLowerCase() === catParam.toLowerCase());
            if (matched) {
                select.value = matched.name;
            }
        }
    } catch (err) {
        console.error("Error loading categories dropdown:", err);
    }
}

function applyFilters() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
    const catVal = document.getElementById('categoryFilter').value;
    const sortVal = document.getElementById('sortFilter').value;
    
    let filtered = [...allProducts];

    // Search query filter
    if (searchVal) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            (p.description && p.description.toLowerCase().includes(searchVal)) ||
            (p.brand && p.brand.toLowerCase().includes(searchVal))
        );
    }

    // Category filter
    if (catVal !== 'all') {
        filtered = filtered.filter(p => p.category === catVal);
    }

    // Sorting
    if (sortVal === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Update Results count
    const countBadge = document.getElementById('resultsCount');
    if (countBadge) {
        countBadge.textContent = `Showing ${filtered.length} products`;
    }

    // Empty state handling
    const emptyState = document.getElementById('emptyState');
    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';
    }

    renderProducts(filtered);
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = products.map(product => {
        const imageIcon = (product.images && product.images.length > 0) ? product.images[0] : '📦';
        const isUrl = imageIcon.startsWith('http://') || imageIcon.startsWith('https://') || imageIcon.startsWith('data:image/');
        const imageElement = isUrl 
            ? `<img src="${imageIcon}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://placehold.co/300x200/f1f5f9/0f172a?text=Product'" />`
            : `<span class="text-5xl">${imageIcon}</span>`;

        // Check availability
        const isAvailable = product.stockQty > 0;
        const availabilityBadge = isAvailable
            ? `<span class="text-[10px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg uppercase tracking-wide">In Stock</span>`
            : `<span class="text-[10px] font-bold text-rose-505 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg uppercase tracking-wide">Sold Out</span>`;

        const addButton = isAvailable
            ? `<button onclick="addToCartDirect(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, ${product.stockQty})" class="py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[10px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer">Add Cart</button>`
            : `<button class="py-2 bg-slate-100 text-slate-400 font-bold text-[10px] rounded-xl border border-slate-200 cursor-not-allowed" disabled>Sold Out</button>`;

        return `
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden hover:-translate-y-1 transition-all duration-300 group" data-id="${product.id}">
                <div class="relative bg-slate-50 aspect-video overflow-hidden flex items-center justify-center">
                    ${imageElement}
                    <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-wider">${product.brand || 'Tech'}</span>
                </div>
                <div class="p-5 flex flex-col justify-between flex-grow text-left">
                    <div class="space-y-1">
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">${product.category || 'General'}</span>
                        <h3 class="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1">${product.name}</h3>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${product.description || 'No description available'}</p>
                    </div>
                    
                    <div class="space-y-4 pt-4 mt-auto">
                        <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span class="font-extrabold text-sm text-slate-900">${Helpers.formatPrice(product.price)}</span>
                            ${availabilityBadge}
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <a href="product-detail.html?id=${product.id}" class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200/60 transition-all text-center">
                                View Detail
                            </a>
                            ${addButton}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCartDirect(id, name, price, maxStock) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(x => x.id === id);

    if (existing) {
        if (existing.quantity >= maxStock) {
            alert(`❌ Cannot add more! Only ${maxStock} units available in stock.`);
            return;
        }
        existing.quantity += 1;
    } else {
        const card = document.querySelector(`[data-id="${id}"]`);
        const img = card ? card.querySelector('img') : null;
        const imageUrl = img ? img.src : '📦';
        cart.push({ id, name, price, quantity: 1, image: imageUrl });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    
    // Toast notification instead of annoying alert dialog
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 p-4 rounded-xl text-xs font-bold transition-all shadow-xl bg-slate-950 text-white border border-slate-800 animate-bounce';
    toast.textContent = `✓ Added ${name} to Cart.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        if (total > 0) {
            badge.textContent = total;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();
    updateCartBadge();

    // Bind filters
    const search = document.getElementById('searchInput');
    const category = document.getElementById('categoryFilter');
    const sort = document.getElementById('sortFilter');

    if (search) search.addEventListener('input', applyFilters);
    if (category) category.addEventListener('change', applyFilters);
    if (sort) sort.addEventListener('change', applyFilters);
});
