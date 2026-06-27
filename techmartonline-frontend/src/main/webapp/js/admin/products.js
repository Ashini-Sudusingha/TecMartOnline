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
                <td colspan="7" class="text-center py-12 text-slate-400">
                    <div class="text-5xl mb-3">📦</div>
                    <p class="font-semibold text-slate-500">No products found</p>
                    <a href="add-product.html" class="inline-flex mt-4 px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-md transition-all">
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
            ? '<span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>'
            : '<span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-400 border border-slate-200">Inactive</span>';

        return `
            <tr class="hover:bg-slate-50/50 transition-all">
                <td class="py-4 px-6 font-bold text-slate-400">#${product.id}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">${imageElement}</span>
                        <div>
                            <div class="font-bold text-slate-900 leading-tight">${product.name}</div>
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">${product.brand || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-slate-500 font-semibold">${product.category || 'Uncategorized'}</td>
                <td class="py-4 px-6 font-black text-slate-900">$${product.price.toFixed(2)}</td>
                <td class="py-4 px-6">
                    <span class="font-bold text-slate-700">
                        ${product.blockQty || 0}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium block">Blocked</span>
                </td>
                <td class="py-4 px-6">
                    ${statusBadge}
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-2">
                        <a href="edit-product.html?id=${product.id}" class="inline-flex px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-400 hover:text-slate-950 text-amber-600 border border-amber-200 text-xs font-bold transition-all duration-150">
                            ✏️ Edit
                        </a>
                        <button onclick="deleteProduct(${product.id})" class="inline-flex p-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 text-xs font-bold transition-all duration-150 cursor-pointer">
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