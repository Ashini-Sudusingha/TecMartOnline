async function loadWarehouses() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;

    const token = AuthUtils.getToken();
    const tbody = document.getElementById('warehousesTableBody');
    if (!tbody) return;

    try {
        const warehouses = await AdminAPI.getWarehouses(token);
        if (warehouses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold">No warehouses found.</td></tr>';
            return;
        }

        tbody.innerHTML = warehouses.map(w => {
            const statusBadge = w.isActive
                ? '<span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>'
                : '<span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/40">Inactive</span>';

            return `
                <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                    <td class="py-4 px-6 font-bold text-slate-500">#${w.id}</td>
                    <td class="py-4 px-6 font-bold text-white">${w.name}</td>
                    <td class="py-4 px-6 text-slate-400 font-semibold">${w.location || 'N/A'}</td>
                    <td class="py-4 px-6 text-slate-400 text-xs">
                        <div>📞 ${w.contactPhone || 'N/A'}</div>
                        <div class="mt-0.5">✉️ ${w.email || 'N/A'}</div>
                    </td>
                    <td class="py-4 px-6">${statusBadge}</td>
                    <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="manageLocations(${w.id}, '${w.name.replace(/'/g, "\\'")}')" class="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 text-xs font-bold transition-all duration-150 cursor-pointer" title="Manage storage locations">
                                📍 Locations
                            </button>
                            <button onclick="editWarehouse(${w.id}, '${w.name.replace(/'/g, "\\'")}', '${w.location.replace(/'/g, "\\'")}', '${w.contactPhone || ''}', '${w.email || ''}', ${w.isActive})" class="inline-flex p-1.5 rounded-lg bg-slate-800/60 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 text-xs font-bold transition-all duration-150 cursor-pointer">
                                ✏️
                            </button>
                            <button onclick="deleteWarehouse(${w.id})" class="inline-flex p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 text-xs font-bold transition-all duration-150 cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-rose-400 font-semibold bg-slate-900/20">Failed to load warehouses data: ' + e.message + '</td></tr>';
    }
}

// Modal handling
function openWarehouseModal() {
    document.getElementById('modalTitle').textContent = 'Add New Warehouse';
    document.getElementById('warehouseId').value = '';
    document.getElementById('warehouseName').value = '';
    document.getElementById('warehouseLocation').value = '';
    document.getElementById('warehousePhone').value = '';
    document.getElementById('warehouseEmail').value = '';
    document.getElementById('warehouseStatus').value = 'true';
    document.getElementById('warehouseModal').classList.remove('hidden');
}

function editWarehouse(id, name, location, phone, email, isActive) {
    document.getElementById('modalTitle').textContent = 'Edit Warehouse Depot';
    document.getElementById('warehouseId').value = id;
    document.getElementById('warehouseName').value = name;
    document.getElementById('warehouseLocation').value = location;
    document.getElementById('warehousePhone').value = phone === 'null' ? '' : phone;
    document.getElementById('warehouseEmail').value = email === 'null' ? '' : email;
    document.getElementById('warehouseStatus').value = String(isActive);
    document.getElementById('warehouseModal').classList.remove('hidden');
}

function closeWarehouseModal() {
    document.getElementById('warehouseModal').classList.add('hidden');
}

// Delete Warehouse
async function deleteWarehouse(id) {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    try {
        const token = AuthUtils.getToken();
        await AdminAPI.deleteWarehouse(id, token);
        alert('✅ Warehouse deleted successfully!');
        await loadWarehouses();
    } catch (e) {
        alert('❌ Failed to delete warehouse: ' + e.message);
    }
}

// Locations Modal handling
async function manageLocations(warehouseId, warehouseName) {
    document.getElementById('locationsModalTitle').textContent = `Depot Locations - ${warehouseName}`;
    document.getElementById('locationWarehouseId').value = warehouseId;
    resetLocationForm();
    document.getElementById('locationsModal').classList.remove('hidden');
    await loadLocations(warehouseId);
}

function closeLocationsModal() {
    document.getElementById('locationsModal').classList.add('hidden');
}

function resetLocationForm() {
    document.getElementById('locationId').value = '';
    document.getElementById('locationCode').value = '';
    document.getElementById('locationMaxCap').value = '';
    document.getElementById('locationQty').value = '0';
    document.getElementById('locationSaveBtn').textContent = 'Save Slot';
}

let allLocations = [];
let currentLocPage = 1;
const locPageSize = 50;
let locSortCol = 'id';
let locSortAsc = true;

async function loadLocations(warehouseId) {
    try {
        const token = AuthUtils.getToken();
        allLocations = await AdminAPI.getWarehouseLocations(warehouseId, token);
        currentLocPage = 1;
        applyLocationsFiltersAndRender();
    } catch (err) {
        document.getElementById('locationsTableBody').innerHTML = `<tr><td colspan="4" class="text-center py-6 text-rose-500">Failed to load locations: ${err.message}</td></tr>`;
    }
}

function applyLocationsFiltersAndRender() {
    const tbody = document.getElementById('locationsTableBody');
    if (!tbody) return;

    // 1. Search filter
    const searchVal = document.getElementById('locationSearchInput').value.toLowerCase().trim();
    let filtered = allLocations.filter(loc => 
        loc.location.toLowerCase().includes(searchVal) ||
        String(loc.id).includes(searchVal)
    );

    // 2. Sort
    filtered.sort((a, b) => {
        let valA = a[locSortCol];
        let valB = b[locSortCol];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return locSortAsc ? -1 : 1;
        if (valA > valB) return locSortAsc ? 1 : -1;
        return 0;
    });

    // Update sorting header indicators
    const idIndicator = document.getElementById('sortDirId');
    const locIndicator = document.getElementById('sortDirLoc');
    const capIndicator = document.getElementById('sortDirCap');

    if (idIndicator) idIndicator.textContent = locSortCol === 'id' ? (locSortAsc ? '▲' : '▼') : '↕';
    if (locIndicator) locIndicator.textContent = locSortCol === 'location' ? (locSortAsc ? '▲' : '▼') : '↕';
    if (capIndicator) capIndicator.textContent = locSortCol === 'maxCapacity' ? (locSortAsc ? '▲' : '▼') : '↕';

    // 3. Paginate
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / locPageSize));
    
    if (currentLocPage > totalPages) currentLocPage = totalPages;
    if (currentLocPage < 1) currentLocPage = 1;

    const startIdx = (currentLocPage - 1) * locPageSize;
    const endIdx = startIdx + locPageSize;
    const paginated = filtered.slice(startIdx, endIdx);

    // Render rows
    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-400 bg-slate-900/20">No matching locations found.</td></tr>';
    } else {
        tbody.innerHTML = paginated.map(loc => {
            return `
                <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                    <td class="py-3 px-4 text-slate-500 font-bold">#${loc.id}</td>
                    <td class="py-3 px-4 font-bold text-white">${loc.location}</td>
                    <td class="py-3 px-4 text-slate-400 font-semibold">${loc.maxCapacity} units</td>
                    <td class="py-3 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button onclick="editLocation('${loc.id}', '${loc.location.replace(/'/g, "\\'")}', ${loc.maxCapacity}, ${loc.quantity})" class="inline-flex p-1 rounded bg-slate-800/60 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 text-[10px] font-bold transition-all duration-150 cursor-pointer">
                                ✏️
                            </button>
                            <button onclick="deleteLocation('${loc.id}')" class="inline-flex p-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 text-[10px] font-bold transition-all duration-150 cursor-pointer">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Update pagination labels/buttons
    const pageInfo = document.getElementById('locationPageInfo');
    if (pageInfo) {
        const endRange = Math.min(startIdx + locPageSize, totalItems);
        pageInfo.textContent = totalItems > 0 
            ? `Showing ${startIdx + 1}-${endRange} of ${totalItems} (Page ${currentLocPage}/${totalPages})`
            : `Showing 0-0 of 0`;
    }

    const prevBtn = document.getElementById('locPrevBtn');
    const nextBtn = document.getElementById('locNextBtn');

    if (prevBtn) prevBtn.disabled = currentLocPage === 1;
    if (nextBtn) nextBtn.disabled = currentLocPage === totalPages;
}

function sortLocations(column) {
    if (locSortCol === column) {
        locSortAsc = !locSortAsc;
    } else {
        locSortCol = column;
        locSortAsc = true;
    }
    currentLocPage = 1;
    applyLocationsFiltersAndRender();
}

function prevLocationPage() {
    if (currentLocPage > 1) {
        currentLocPage--;
        applyLocationsFiltersAndRender();
    }
}

function nextLocationPage() {
    const totalPages = Math.ceil(allLocations.length / locPageSize);
    if (currentLocPage < totalPages) {
        currentLocPage++;
        applyLocationsFiltersAndRender();
    }
}

function editLocation(id, location, maxCapacity, quantity) {
    document.getElementById('locationId').value = id;
    document.getElementById('locationCode').value = location;
    document.getElementById('locationMaxCap').value = maxCapacity;
    document.getElementById('locationQty').value = quantity;
    document.getElementById('locationSaveBtn').textContent = 'Update';
}

async function deleteLocation(id) {
    if (!confirm('Are you sure you want to delete this storage slot?')) return;

    const warehouseId = document.getElementById('locationWarehouseId').value;
    const token = AuthUtils.getToken();

    try {
        await AdminAPI.deleteWarehouseLocation(warehouseId, id, token);
        alert('✅ Location deleted successfully!');
        resetLocationForm();
        await loadLocations(warehouseId);
    } catch (e) {
        alert('❌ Failed to delete location: ' + e.message);
    }
}

// Submit handlers
document.addEventListener('DOMContentLoaded', () => {
    loadWarehouses();

    const form = document.getElementById('warehouseForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = AuthUtils.getToken();

            const id = document.getElementById('warehouseId').value;
            const dto = {
                name: document.getElementById('warehouseName').value.trim(),
                location: document.getElementById('warehouseLocation').value.trim(),
                contactPhone: document.getElementById('warehousePhone').value.trim(),
                email: document.getElementById('warehouseEmail').value.trim(),
                isActive: document.getElementById('warehouseStatus').value === 'true'
            };

            try {
                if (id) {
                    await AdminAPI.updateWarehouse(id, dto, token);
                    alert('✅ Warehouse updated successfully!');
                } else {
                    await AdminAPI.addWarehouse(dto, token);
                    alert('✅ Warehouse added successfully!');
                }
                closeWarehouseModal();
                await loadWarehouses();
            } catch (err) {
                alert('❌ Failed to save warehouse: ' + err.message);
            }
        });
    }

    const locForm = document.getElementById('locationForm');
    if (locForm) {
        locForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = AuthUtils.getToken();
            const warehouseId = document.getElementById('locationWarehouseId').value;
            const id = document.getElementById('locationId').value;

            const dto = {
                location: document.getElementById('locationCode').value.trim(),
                maxCapacity: parseInt(document.getElementById('locationMaxCap').value),
                quantity: parseInt(document.getElementById('locationQty').value || '0'),
                warehouseId: parseInt(warehouseId)
            };

            try {
                if (id) {
                    await AdminAPI.updateWarehouseLocation(warehouseId, id, dto, token);
                    alert('✅ Location updated successfully!');
                } else {
                    await AdminAPI.addWarehouseLocation(warehouseId, dto, token);
                    alert('✅ Location added successfully!');
                }
                resetLocationForm();
                await loadLocations(warehouseId);
            } catch (err) {
                alert('❌ Failed to save location: ' + err.message);
            }
        });
    }

    const searchInput = document.getElementById('locationSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentLocPage = 1;
            applyLocationsFiltersAndRender();
        });
    }
});
