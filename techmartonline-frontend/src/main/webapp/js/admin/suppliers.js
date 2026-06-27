async function loadSuppliers() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;

    const token = AuthUtils.getToken();
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    try {
        const suppliers = await AdminAPI.getSuppliers(token);
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold">No suppliers found.</td></tr>';
            return;
        }

        tbody.innerHTML = suppliers.map(s => {
            return `
                <tr class="hover:bg-slate-50/50 transition-all">
                    <td class="py-4 px-6 font-bold text-slate-400">#${s.id}</td>
                    <td class="py-4 px-6 font-bold text-slate-900">${s.name}</td>
                    <td class="py-4 px-6 text-slate-500 font-semibold">${s.brandName || 'N/A'}</td>
                    <td class="py-4 px-6 text-slate-500 font-semibold">${s.categoryName || 'N/A'}</td>
                    <td class="py-4 px-6 text-slate-500 text-xs">
                        <div>📞 ${s.mobile || 'N/A'}</div>
                        <div class="mt-0.5">✉️ ${s.email || 'N/A'}</div>
                    </td>
                    <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="editSupplier(${s.id}, '${s.name.replace(/'/g, "\\'")}', ${s.brandId}, ${s.categoryId}, '${s.mobile}', '${s.email}')" class="inline-flex p-1.5 rounded-lg bg-amber-50 hover:bg-amber-400 text-amber-600 hover:text-slate-950 border border-amber-200 hover:border-amber-400 text-xs font-bold transition-all duration-150 cursor-pointer">
                                ✏️
                            </button>
                            <button onclick="deleteSupplier(${s.id})" class="inline-flex p-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 text-xs font-bold transition-all duration-150 cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-rose-500 font-semibold">Failed to load suppliers data: ' + e.message + '</td></tr>';
    }
}

// Load dropdowns for brand and category
async function loadDropdowns() {
    try {
        const [brands, categories] = await Promise.all([
            ProductsAPI.getBrands(),
            ProductsAPI.getCategories()
        ]);

        const brandSelect = document.getElementById('supplierBrand');
        const catSelect = document.getElementById('supplierCategory');

        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">Select Brand</option>' +
                brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }

        if (catSelect) {
            catSelect.innerHTML = '<option value="">Select Category</option>' +
                categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading dropdown lists:', err);
    }
}

// Modal handling
function openSupplierModal() {
    document.getElementById('modalTitle').textContent = 'Add New Supplier';
    document.getElementById('supplierId').value = '';
    document.getElementById('supplierName').value = '';
    document.getElementById('supplierBrand').value = '';
    document.getElementById('supplierCategory').value = '';
    document.getElementById('supplierPhone').value = '';
    document.getElementById('supplierEmail').value = '';
    document.getElementById('supplierModal').classList.remove('hidden');
}

function editSupplier(id, name, brandId, categoryId, mobile, email) {
    document.getElementById('modalTitle').textContent = 'Edit Supplier Partner';
    document.getElementById('supplierId').value = id;
    document.getElementById('supplierName').value = name;
    document.getElementById('supplierBrand').value = brandId;
    document.getElementById('supplierCategory').value = categoryId;
    document.getElementById('supplierPhone').value = mobile === 'null' ? '' : mobile;
    document.getElementById('supplierEmail').value = email === 'null' ? '' : email;
    document.getElementById('supplierModal').classList.remove('hidden');
}

function closeSupplierModal() {
    document.getElementById('supplierModal').classList.add('hidden');
}

// Delete Supplier
async function deleteSupplier(id) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
        const token = AuthUtils.getToken();
        await AdminAPI.deleteSupplier(id, token);
        alert('✅ Supplier deleted successfully!');
        await loadSuppliers();
    } catch (e) {
        alert('❌ Failed to delete supplier: ' + e.message);
    }
}

// Init and Form submit bindings
document.addEventListener('DOMContentLoaded', async () => {
    await loadDropdowns();
    await loadSuppliers();

    const form = document.getElementById('supplierForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = AuthUtils.getToken();

            const id = document.getElementById('supplierId').value;
            const dto = {
                name: document.getElementById('supplierName').value.trim(),
                brandId: parseInt(document.getElementById('supplierBrand').value),
                categoryId: parseInt(document.getElementById('supplierCategory').value),
                mobile: document.getElementById('supplierPhone').value.trim(),
                email: document.getElementById('supplierEmail').value.trim()
            };

            try {
                if (id) {
                    await AdminAPI.updateSupplier(id, dto, token);
                    alert('✅ Supplier updated successfully!');
                } else {
                    await AdminAPI.addSupplier(dto, token);
                    alert('✅ Supplier added successfully!');
                }
                closeSupplierModal();
                await loadSuppliers();
            } catch (err) {
                alert('❌ Failed to save supplier: ' + err.message);
            }
        });
    }
});
