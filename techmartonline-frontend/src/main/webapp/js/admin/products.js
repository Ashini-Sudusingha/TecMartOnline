/**
 * ============================================================
 * ADMIN PRODUCTS.JS - Product Management
 * ============================================================
 */

// ============================================================ */
// SAMPLE PRODUCT DATA (for demo)
// ============================================================ */
const sampleProducts = [
    {
        id: 1,
        name: 'MacBook Pro M3 16"',
        description: 'Apple M3 Pro chip, 16GB RAM, 512GB SSD',
        price: 2499.99,
        stock: 15,
        category: 'Electronics',
        brand: 'Apple',
        image: '💻',
        barcode: '1234567890',
        status: 'active'
    },
    {
        id: 2,
        name: 'Sony WH-1000XM6',
        description: 'Wireless noise-canceling headphones',
        price: 399.99,
        stock: 30,
        category: 'Audio',
        brand: 'Sony',
        image: '🎧',
        barcode: '1234567891',
        status: 'active'
    },
    {
        id: 3,
        name: 'Samsung Galaxy S24 Ultra',
        description: '256GB, 5G, 200MP camera',
        price: 1299.99,
        stock: 20,
        category: 'Electronics',
        brand: 'Samsung',
        image: '📱',
        barcode: '1234567892',
        status: 'active'
    },
    {
        id: 4,
        name: 'Dell XPS 16"',
        description: 'Intel i7, 16GB RAM, 1TB SSD',
        price: 1899.99,
        stock: 8,
        category: 'Electronics',
        brand: 'Dell',
        image: '🖥️',
        barcode: '1234567893',
        status: 'active'
    },
    {
        id: 5,
        name: 'Logitech MX Master 4S',
        description: 'Wireless mouse, 8K DPI',
        price: 99.99,
        stock: 50,
        category: 'Accessories',
        brand: 'Logitech',
        image: '🖱️',
        barcode: '1234567894',
        status: 'active'
    }
];

// ============================================================ */
// INIT - Load products
// ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;

    // Check if products exist in localStorage
    let products = JSON.parse(localStorage.getItem('adminProducts'));
    if (!products || products.length === 0) {
        localStorage.setItem('adminProducts', JSON.stringify(sampleProducts));
        products = sampleProducts;
    }

    renderProducts(products);
    setupFilters(products);
});

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

    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-slate-50/50 transition-all">
            <td class="py-4 px-6 font-bold text-slate-400">#${product.id}</td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">${product.image || '📦'}</span>
                    <div>
                        <div class="font-bold text-slate-900 leading-tight">${product.name}</div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">${product.brand || ''}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6 text-slate-500 font-semibold">${product.category || 'Uncategorized'}</td>
            <td class="py-4 px-6 font-black text-slate-900">$${product.price.toFixed(2)}</td>
            <td class="py-4 px-6">
                <span class="font-bold ${product.stock < 10 ? 'text-rose-600' : 'text-slate-700'}">
                    ${product.stock || 0}
                </span>
                ${product.stock < 10 ? '<span class="ml-1.5 inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-50 text-rose-600 border border-rose-150">⚠️ Low</span>' : ''}
            </td>
            <td class="py-4 px-6">
                <span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}">
                    ${product.status || 'active'}
                </span>
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
    `).join('');
}

// ============================================================ */
// DELETE PRODUCT
// ============================================================ */
function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    let products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    products = products.filter(p => p.id !== id);
    localStorage.setItem('adminProducts', JSON.stringify(products));

    // Re-render
    renderProducts(products);
}

// ============================================================ */
// SETUP FILTERS
// ============================================================ */
function setupFilters(products) {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    function applyFilters() {
        const search = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        let filtered = products.filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search) ||
                p.description.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search) ||
                p.brand.toLowerCase().includes(search);

            const matchCategory = category === 'all' || p.category === category;
            const matchStatus = status === 'all' || p.status === status;

            return matchSearch && matchCategory && matchStatus;
        });

        renderProducts(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
}