let allInvoices = [];
let tempInvoiceItems = []; // Frontend temporary items queue
let allWarehouseLocations = []; // To cache retrieved locations for capacity validation

async function loadInvoices() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;

    const token = AuthUtils.getToken();
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;

    try {
        allInvoices = await AdminAPI.getInvoices(token);
        if (allInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-semibold">No purchase invoices found.</td></tr>';
            return;
        }

        tbody.innerHTML = allInvoices.map(i => {
            let dateObj = new Date(i.createdAt);
            if (isNaN(dateObj.getTime())) {
                const num = Number(i.createdAt);
                if (!isNaN(num)) dateObj = new Date(num);
            }
            
            const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';

            return `
                <tr class="hover:bg-slate-800/20 border-b border-slate-800/40 transition-all">
                    <td class="py-4 px-6 font-bold text-amber-450">#INV-${10000 + i.id}</td>
                    <td class="py-4 px-6 font-bold text-slate-200">${i.supplierName || 'N/A'}</td>
                    <td class="py-4 px-6 text-slate-400 font-semibold">${formattedDate}</td>
                    <td class="py-4 px-6 font-black text-white">Rs. ${parseFloat(i.totalAmount).toFixed(2)}</td>
                    <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="manageInvoiceItems(${i.id}, '${i.supplierName.replace(/'/g, "\\'")}')" class="inline-flex px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 text-xs font-bold transition-all duration-150 cursor-pointer" title="Manage invoice items">
                                📦 Items
                            </button>
                            <button onclick="printInvoice(${i.id})" class="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-amber-400 text-slate-350 hover:text-slate-950 border border-slate-700/50 hover:border-amber-400 text-xs font-bold transition-all duration-150 cursor-pointer">
                                🖨️ Print
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-rose-500 font-semibold">Failed to load invoices: ' + e.message + '</td></tr>';
    }
}

// Load suppliers for dropdown select list
async function loadSuppliersDropdown() {
    try {
        const token = AuthUtils.getToken();
        const suppliers = await AdminAPI.getSuppliers(token);
        const supplierSelect = document.getElementById('invoiceSupplier');

        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">Select Supplier</option>' +
                suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading suppliers dropdown:', err);
    }
}

// Modal handling
function openInvoiceModal() {
    document.getElementById('invoiceSupplier').value = '';
    document.getElementById('invoiceAmount').value = '';
    document.getElementById('invoiceModal').classList.remove('hidden');
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.add('hidden');
}

// Print invoice PDF mockup alert
function printInvoice(id) {
    const inv = allInvoices.find(x => x.id === id);
    if (!inv) return;

    let dateObj = new Date(inv.createdAt);
    if (isNaN(dateObj.getTime())) {
        const num = Number(inv.createdAt);
        if (!isNaN(num)) dateObj = new Date(num);
    }

    const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';

    alert(`🖨️ Generating printable PDF layout...\n\nInvoice ID: #INV-${10000 + inv.id}\nSupplier: ${inv.supplierName}\nAmount: Rs. ${parseFloat(inv.totalAmount).toFixed(2)}\nDate: ${formattedDate}`);
}

// Manage Invoice Items functions
async function manageInvoiceItems(invoiceId, supplierName) {
    document.getElementById('itemsModalTitle').textContent = `Invoice items - #INV-${10000 + invoiceId} (${supplierName})`;
    document.getElementById('itemInvoiceId').value = invoiceId;
    
    // Reset item form
    document.getElementById('itemProduct').value = '';
    document.getElementById('itemWarehouse').value = '';
    document.getElementById('itemLocation').innerHTML = '<option value="">Select Location</option>';
    document.getElementById('itemLocation').disabled = true;
    document.getElementById('itemQty').value = '';
    document.getElementById('itemPrice').value = '';

    tempInvoiceItems = [];
    allWarehouseLocations = [];
    renderTempItems();

    document.getElementById('invoiceItemsModal').classList.remove('hidden');
    
    await loadInvoiceDropdowns();
    await loadInvoiceItems(invoiceId);
}

function closeItemsModal() {
    document.getElementById('invoiceItemsModal').classList.add('hidden');
}

async function loadInvoiceDropdowns() {
    try {
        const token = AuthUtils.getToken();
        const [products, warehouses] = await Promise.all([
            ProductsAPI.getAll(),
            AdminAPI.getWarehouses(token)
        ]);

        const prodSelect = document.getElementById('itemProduct');
        const whSelect = document.getElementById('itemWarehouse');

        if (prodSelect) {
            prodSelect.innerHTML = '<option value="">Select Product</option>' +
                products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }

        if (whSelect) {
            whSelect.innerHTML = '<option value="">Select Warehouse</option>' +
                warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        }
    } catch (err) {
        console.error('Error loading item options:', err);
    }
}

async function loadLocationsForWarehouse(warehouseId) {
    const locSelect = document.getElementById('itemLocation');
    if (!locSelect) return;

    if (!warehouseId) {
        locSelect.innerHTML = '<option value="">Select Location</option>';
        locSelect.disabled = true;
        allWarehouseLocations = [];
        return;
    }

    try {
        const token = AuthUtils.getToken();
        allWarehouseLocations = await AdminAPI.getWarehouseLocations(warehouseId, token);
        
        locSelect.innerHTML = '<option value="">Select Location</option>' +
            allWarehouseLocations.map(l => {
                const available = l.maxCapacity - l.quantity;
                return `<option value="${l.id}">${l.location} (Avail: ${available}/${l.maxCapacity})</option>`;
            }).join('');
        locSelect.disabled = false; // Enable dropdown after loading options
    } catch (err) {
        console.error('Error loading locations:', err);
        locSelect.innerHTML = '<option value="">Select Location</option>';
        locSelect.disabled = true; // Keep disabled on error
        allWarehouseLocations = [];
    }
}

function renderTempItems() {
    const tbody = document.getElementById('tempItemsTableBody');
    const saveBtn = document.getElementById('saveAllTempBtn');
    if (!tbody) return;

    if (tempInvoiceItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-400">Queue is empty. Add items using the form above.</td></tr>';
        if (saveBtn) saveBtn.disabled = true;
        return;
    }

    if (saveBtn) saveBtn.disabled = false;

    tbody.innerHTML = tempInvoiceItems.map((item, idx) => {
        return `
            <tr class="hover:bg-slate-800/20 border-b border-slate-800/40 transition-all">
                <td class="py-2.5 px-4 font-bold text-white">${item.productName}</td>
                <td class="py-2.5 px-4 text-slate-400 font-semibold">${item.warehouseName}</td>
                <td class="py-2.5 px-4 text-slate-400 font-semibold">${item.locationName}</td>
                <td class="py-2.5 px-4 font-semibold text-amber-450">Rs. ${parseFloat(item.buyingPrice).toFixed(2)}</td>
                <td class="py-2.5 px-4 font-black text-slate-200">${item.stockQuantity}</td>
                <td class="py-2.5 px-4 text-right">
                    <button type="button" onclick="removeTempItem(${idx})" class="inline-flex p-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white border border-rose-500/20 hover:border-rose-500 text-[10px] font-bold transition-all cursor-pointer">
                        🗑️ Remove
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function removeTempItem(index) {
    tempInvoiceItems.splice(index, 1);
    renderTempItems();
}

async function saveAllTempItems() {
    if (tempInvoiceItems.length === 0) return;

    const invoiceId = document.getElementById('itemInvoiceId').value;
    const token = AuthUtils.getToken();
    const saveBtn = document.getElementById('saveAllTempBtn');

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving Stock...';
        }

        // Call the bulk save API
        await AdminAPI.addInvoiceInventoryBulk(invoiceId, tempInvoiceItems, token);
        alert('✅ All items successfully saved to database!');
        
        tempInvoiceItems = [];
        renderTempItems();
        
        // Refresh database logs list
        await loadInvoiceItems(invoiceId);
        await loadInvoices();
        
        // Reload locations dropdown to update quantity counts
        const whId = document.getElementById('itemWarehouse').value;
        if (whId) await loadLocationsForWarehouse(whId);

    } catch (err) {
        alert('❌ Failed to save bulk items: ' + err.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save All to Database';
        }
    }
}

async function loadInvoiceItems(invoiceId) {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const items = await AdminAPI.getInvoiceInventory(invoiceId, token);
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-slate-400">No inventory items saved yet.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            return `
                <tr class="hover:bg-slate-800/20 border-b border-slate-800/40 transition-all">
                    <td class="py-3 px-4 font-bold text-slate-500">#ITEM-${item.id}</td>
                    <td class="py-3 px-4 font-bold text-white">${item.productName || 'N/A'}</td>
                    <td class="py-3 px-4 text-slate-400 font-semibold">${item.warehouseName || 'N/A'}</td>
                    <td class="py-3 px-4 text-slate-400 font-semibold">${item.location || 'N/A'}</td>
                    <td class="py-3 px-4 font-semibold text-amber-450">Rs. ${parseFloat(item.buyingPrice).toFixed(2)}</td>
                    <td class="py-3 px-4 font-black text-slate-200">${item.stockQuantity} units</td>
                    <td class="py-3 px-4">
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">${item.statusName || 'Active'}</span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-rose-500">Failed to load invoice items: ${err.message}</td></tr>`;
    }
}

// Init and Form submit bindings
document.addEventListener('DOMContentLoaded', async () => {
    await loadSuppliersDropdown();
    await loadInvoices();

    const form = document.getElementById('invoiceForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = AuthUtils.getToken();

            const dto = {
                supplierId: parseInt(document.getElementById('invoiceSupplier').value),
                totalAmount: parseFloat(document.getElementById('invoiceAmount').value || 0)
            };

            try {
                await AdminAPI.addInvoice(dto, token);
                alert('✅ Invoice created successfully!');
                closeInvoiceModal();
                await loadInvoices();
            } catch (err) {
                alert('❌ Failed to create invoice: ' + err.message);
            }
        });
    }

    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const pSelect = document.getElementById('itemProduct');
            const wSelect = document.getElementById('itemWarehouse');
            const lSelect = document.getElementById('itemLocation');

            const productId = parseInt(pSelect.value);
            const warehouseId = parseInt(wSelect.value);
            const locationId = lSelect.value;
            const qty = parseInt(document.getElementById('itemQty').value);
            const price = parseFloat(document.getElementById('itemPrice').value);

            // Local capacity checks
            const loc = allWarehouseLocations.find(l => l.id === locationId);
            if (loc) {
                // Calculate capacity currently allocated in temp queue for this location
                const allocatedInTemp = tempInvoiceItems
                    .filter(item => item.warehouseLocationId === locationId)
                    .reduce((sum, item) => sum + item.stockQuantity, 0);

                const totalAllocated = loc.quantity + allocatedInTemp + qty;
                if (totalAllocated > loc.maxCapacity) {
                    alert(`❌ Cannot add item! Location exceeds maximum capacity limit.\nMax Capacity: ${loc.maxCapacity}\nCurrently occupied (DB): ${loc.quantity}\nQueued in list: ${allocatedInTemp}\nAttempted: ${qty}`);
                    return;
                }
            }

            // Push to temporary list DTO
            tempInvoiceItems.push({
                productId: productId,
                productName: pSelect.options[pSelect.selectedIndex].text,
                warehouseId: warehouseId,
                warehouseName: wSelect.options[wSelect.selectedIndex].text,
                warehouseLocationId: locationId,
                locationName: lSelect.options[lSelect.selectedIndex].text.split('(')[0].trim(),
                stockQuantity: qty,
                buyingPrice: price
            });

            // Reset inputs
            pSelect.value = '';
            document.getElementById('itemQty').value = '';
            document.getElementById('itemPrice').value = '';

            renderTempItems();
        });
    }
});
