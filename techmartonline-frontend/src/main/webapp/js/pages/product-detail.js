async function loadDetail() {
    const id = Helpers.getQueryParam('id');
    const container = document.getElementById('productDetailContainer');
    if (!container || !id) return;

    try {
        const product = await ProductsAPI.getById(id);
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div class="h-80 rounded-2xl bg-slate-50 flex items-center justify-center text-8xl border border-slate-100">
                    📦
                </div>
                <div class="space-y-6">
                    <div>
                        <span class="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">${product.brand} - ${product.category}</span>
                        <h1 class="text-3xl font-black text-slate-900 leading-tight">${product.name}</h1>
                    </div>
                    <p class="text-slate-500 font-semibold text-sm leading-relaxed">${product.description || 'No description provided.'}</p>
                    <div class="text-2xl font-black text-slate-900">${Helpers.formatPrice(product.price)}</div>
                    
                    <div class="flex gap-4">
                        <button onclick="addToCartDirect(${product.id}, '${product.name}', ${product.price})" class="px-6 py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer">
                            Add to Cart 🛒
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p class="text-center py-12 text-rose-500 font-bold">Failed to load product details.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDetail();
});
