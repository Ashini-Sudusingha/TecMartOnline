/**
 * ============================================================
 * ADMIN PRODUCTS.JS - Product Management (Database Connected)
 * ============================================================
 */

let allProducts = [];

// ============================================================ */
// INIT - Load products
// ============================================================ */
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;

    await loadProducts();
});

async function loadProducts() {
    try {
        allProducts = await ProductsAPI.getAll();
        renderProducts(allProducts);
        await loadCategoryFilter();
        setupFilters();
    } catch (err) {
        console.error('Error fetching products:', err);
        alert('Failed to load products from database: ' + err.message);
    }
}

async function loadCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    try {
        const categories = await ProductsAPI.getCategories();
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    } catch (err) {
        console.error('Error loading filter categories:', err);
    }
}

// ============================================================ */
// RENDER PRODUCTS TABLE
// ============================================================ */
function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-slate-400 bg-slate-900/20">
                    <div class="text-5xl mb-3">📦</div>
                    <p class="font-semibold text-slate-400">No products found</p>
                    <a href="add-product.html" class="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md transition-all">
                        Add First Product
                    </a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => {
        const imageIcon = (product.images && product.images.length > 0) ? product.images[0] : '📦';
        const isUrl = imageIcon.startsWith('http://') || imageIcon.startsWith('https://') || imageIcon.startsWith('data:image/');
        const imageElement = isUrl 
            ? `<img src="${imageIcon}" class="w-full h-full object-cover rounded-xl" />`
            : imageIcon;
        const isActive = product.isActive;
        const statusBadge = isActive
            ? '<span class="inline-flex px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>'
            : '<span class="inline-flex px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/40">Inactive</span>';

        return `
            <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                <td class="py-4 px-6 font-bold text-slate-500">#${product.id}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">${imageElement}</span>
                        <div>
                            <div class="font-bold text-white leading-tight text-xs">${product.name}</div>
                            <div class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">${product.brand || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-slate-350 font-semibold text-xs">${product.category || 'Uncategorized'}</td>
                <td class="py-4 px-6 font-black text-white text-xs">$${product.price.toFixed(2)}</td>
                <td class="py-4 px-6">
                    <div class="flex flex-col gap-0.5">
                        <button onclick="showStockDistribution(${product.id}, '${product.name.replace(/'/g, "\\'")}')" class="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline bg-transparent border-0 p-0 cursor-pointer focus:outline-none">
                            ${product.stockQty || 0} Available
                        </button>
                        <span class="text-[10px] text-slate-500 font-medium block">Blocked: ${product.blockQty || 0}</span>
                    </div>
                </td>
                <td class="py-4 px-6">
                    ${statusBadge}
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                        <a href="edit-product.html?id=${product.id}" class="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-805 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 text-[11px] font-bold transition-all duration-150 cursor-pointer">
                            ✏️ Edit
                        </a>
                        <button onclick="deleteProduct(${product.id})" class="inline-flex p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 text-[11px] font-bold transition-all duration-150 cursor-pointer">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================ */
// DELETE PRODUCT
// ============================================================ */
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const token = AuthUtils.getToken();
        await ProductsAPI.delete(id, token);
        alert('✅ Product deleted successfully!');
        await loadProducts();
    } catch (err) {
        alert('❌ Failed to delete product: ' + err.message);
    }
}

// ============================================================ */
// SETUP FILTERS
// ============================================================ */
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    function applyFilters() {
        const search = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        let filtered = allProducts.filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search) ||
                p.brand.toLowerCase().includes(search);

            const matchCategory = category === 'all' || p.category === category;
            const matchStatus = status === 'all' || 
                (status === 'active' && p.isActive) ||
                (status === 'inactive' && !p.isActive);

            return matchSearch && matchCategory && matchStatus;
        });

        renderProducts(filtered);
    }

    if (searchInput) searchInput.oninput = applyFilters;
    if (categoryFilter) categoryFilter.onchange = applyFilters;
    if (statusFilter) statusFilter.onchange = applyFilters;
}

async function showStockDistribution(productId, productName) {
    const modal = document.getElementById('stockDistributionModal');
    const nameLabel = document.getElementById('distModalProductName');
    const listContainer = document.getElementById('distModalList');
    if (!modal || !listContainer) return;

    nameLabel.textContent = productName;
    listContainer.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs font-semibold">Loading distribution...</div>';
    modal.classList.remove('hidden');

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/inventory/product/${productId}/distribution`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load warehouse stock distribution.");
        const json = await res.json();
        const dist = json.data || [];

        if (dist.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs font-semibold">⚠️ No stock allocated in any warehouse yet.</div>';
            return;
        }

        listContainer.innerHTML = dist.map(d => `
            <div class="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 px-4 py-3 rounded-2xl">
                <span class="text-white font-bold text-xs">🏢 ${d.warehouseName}</span>
                <span class="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    ${d.stockQty} items
                </span>
            </div>
        `).join('');
    } catch (err) {
        listContainer.innerHTML = `<div class="text-center py-6 text-rose-500 text-xs font-bold">Error: ${err.message}</div>`;
    }
}

function closeStockDistributionModal() {
    const modal = document.getElementById('stockDistributionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}