async function loadDetail() {
    const id = Helpers.getQueryParam('id');
    const container = document.getElementById('productDetailContainer');
    if (!container || !id) return;

    try {
        const product = await ProductsAPI.getById(id);
        
        const imageIcon = (product.images && product.images.length > 0) ? product.images[0] : '📦';
        const isUrl = imageIcon.startsWith('http://') || imageIcon.startsWith('https://') || imageIcon.startsWith('data:image/');
        const mainImageHtml = isUrl 
            ? `<img id="mainDetailImage" src="${imageIcon}" class="w-full h-full object-cover rounded-2xl" />`
            : `<span class="text-8xl">${imageIcon}</span>`;

        let galleryHtml = '';
        if (product.images && product.images.length > 1) {
            galleryHtml = `
                <div class="flex gap-2 mt-4 justify-center">
                    ${product.images.map((imgUrl, index) => {
                        const isThumbUrl = imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:image/');
                        if (isThumbUrl) {
                            return `<img src="${imgUrl}" onclick="swapDetailImage('${imgUrl}')" class="w-12 h-12 object-cover rounded-lg border-2 border-slate-100 hover:border-amber-400 cursor-pointer transition-all" />`;
                        } else {
                            return `<div onclick="swapDetailEmoji('${imgUrl}')" class="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-xl hover:border-amber-400 cursor-pointer transition-all">${imgUrl}</div>`;
                        }
                    }).join('')}
                </div>
            `;
        }

        // Availability calculations
        const isAvailable = product.stockQty > 0;
        const availabilityHtml = isAvailable 
            ? `<div class="text-sm font-bold text-slate-700">Availability: <span class="text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-lg ml-2 font-black">${product.stockQty} units in stock</span></div>`
            : `<div class="text-sm font-bold text-slate-700">Availability: <span class="text-rose-600 bg-rose-50 border border-rose-250 px-2.5 py-1 rounded-lg ml-2 font-black">Out of Stock</span></div>`;

        const actionButtonHtml = isAvailable
            ? `<button onclick="addToCartDirect(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, ${product.stockQty}, '${isUrl ? imageIcon : '📦'}')" class="px-6 py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer">Add to Cart 🛒</button>`
            : `<button class="px-6 py-4 bg-slate-150 text-slate-400 font-bold rounded-2xl border border-slate-200 cursor-not-allowed" disabled>Sold Out 🚫</button>`;

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div class="h-80 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden" id="mainDetailImageWrapper">
                        ${mainImageHtml}
                    </div>
                    ${galleryHtml}
                </div>
                <div class="space-y-6">
                    <div>
                        <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">${product.brand || 'Tech'} - ${product.category || 'General'}</span>
                        <h1 class="text-3xl font-black text-slate-900 leading-tight">${product.name}</h1>
                    </div>
                    
                    ${availabilityHtml}

                    <p class="text-slate-500 font-semibold text-sm leading-relaxed">${product.description || 'No description provided.'}</p>
                    <div class="text-2xl font-black text-slate-900">${Helpers.formatPrice(product.price)}</div>
                    
                    <div class="flex gap-4">
                        ${actionButtonHtml}
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p class="text-center py-12 text-rose-500 font-bold">Failed to load product details.</p>';
    }
}

window.swapDetailImage = function(url) {
    const wrapper = document.getElementById('mainDetailImageWrapper');
    if (wrapper) {
        wrapper.innerHTML = `<img id="mainDetailImage" src="${url}" class="w-full h-full object-cover rounded-2xl" />`;
    }
};

window.swapDetailEmoji = function(emoji) {
    const wrapper = document.getElementById('mainDetailImageWrapper');
    if (wrapper) {
        wrapper.innerHTML = `<span class="text-8xl">${emoji}</span>`;
    }
};

window.addToCartDirect = function(id, name, price, maxStock, image) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(x => x.id === id);

    if (existing) {
        if (existing.quantity >= maxStock) {
            alert(`❌ Cannot add more! Only ${maxStock} units available in stock.`);
            return;
        }
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1, image: image });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
    
    // Toast notification instead of annoying alert dialog
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 p-4 rounded-xl text-xs font-bold transition-all shadow-xl bg-slate-950 text-white border border-slate-800 animate-bounce';
    toast.textContent = `✓ Added ${name} to Cart.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
};

document.addEventListener('DOMContentLoaded', () => {
    loadDetail();
});
