async function loadCatalog() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    try {
        const products = await ProductsAPI.getAll();
        renderProducts(products);
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p class="text-center py-12 text-rose-500 font-bold">Failed to load catalog.</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p class="text-center py-12 text-slate-400 font-semibold">No products available.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const imageIcon = (product.images && product.images.length > 0) ? product.images[0] : '📦';
        const isUrl = imageIcon.startsWith('http://') || imageIcon.startsWith('https://') || imageIcon.startsWith('data:image/');
        const imageElement = isUrl 
            ? `<img src="${imageIcon}" class="w-full h-full object-cover rounded-2xl" />`
            : `<span class="text-5xl">${imageIcon}</span>`;

        return `
            <div class="product-card bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative transition-all hover:border-slate-200" data-id="${product.id}">
                <span class="absolute top-4 left-4 bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">${product.brand || 'Tech'}</span>
                <div class="h-40 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100/50 overflow-hidden">
                    ${imageElement}
                </div>
                <div class="space-y-2">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${product.category || 'General'}</span>
                    <h3 class="font-bold text-slate-900 leading-snug"><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                    <div class="flex justify-between items-center pt-2">
                        <span class="font-black text-slate-900">${Helpers.formatPrice(product.price)}</span>
                        <button onclick="addToCartDirect(${product.id}, '${product.name}', ${product.price})" class="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer">
                            + Add
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCartDirect(id, name, price) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(x => x.id === id);
    
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    const img = card ? card.querySelector('img') : null;
    const imageUrl = img ? img.src : '📦';

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1, image: imageUrl });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    const cartLink = document.querySelector('.nav-links a[href="cart.html"]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartLink) {
        cartLink.textContent = totalItems > 0 ? `Cart (${totalItems})` : 'Cart';
    }
    
    alert('✅ Added to Cart!');
}

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();
});
