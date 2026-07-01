let activeWarehouseInventory = [];
let allWarehousesList = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    loadWarehousesForTransfer();
    loadTransferHistory();
});

async function loadWarehousesForTransfer() {
    const srcSelect = document.getElementById('transferWarehouseSelect');
    const destSelect = document.getElementById('transferDestWarehouseSelect');
    if (!srcSelect) return;

    try {
        const token = AuthUtils.getToken();
        allWarehousesList = await AdminAPI.getWarehouses(token);
        
        const optionsHtml = '<option value="">-- Choose Warehouse Depot --</option>' +
            allWarehousesList.map(w => `<option value="${w.id}">${w.name} (${w.city || 'Depot'})</option>`).join('');
            
        srcSelect.innerHTML = optionsHtml;
        destSelect.innerHTML = '<option value="">-- Choose Destination Warehouse --</option>' +
            allWarehousesList.map(w => `<option value="${w.id}">${w.name} (${w.city || 'Depot'})</option>`).join('');
    } catch (err) {
        srcSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

async function onTransferWarehouseChanged() {
    const srcWhId = document.getElementById('transferWarehouseSelect').value;
    const invSelect = document.getElementById('transferInventorySelect');
    const destSelect = document.getElementById('transferDestWarehouseSelect');
    const locSelect = document.getElementById('transferLocationSelect');

    // Reset subsequent selectors
    invSelect.innerHTML = '<option value="">-- Select Stock Record --</option>';
    invSelect.disabled = true;
    destSelect.value = "";
    destSelect.disabled = true;
    locSelect.innerHTML = '<option value="">-- Select Destination Slot --</option>';
    locSelect.disabled = true;

    if (!srcWhId) return;

    invSelect.innerHTML = '<option value="">Loading stock items...</option>';

    try {
        const token = AuthUtils.getToken();
        
        // Fetch warehouse stock
        const invRes = await fetch(`${API_CONFIG.BASE_URL}/inventory/warehouse/${srcWhId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!invRes.ok) throw new Error("Failed to load warehouse inventory");
        const invJson = await invRes.json();
        activeWarehouseInventory = invJson.data || [];

        // Populate Stock Select
        if (activeWarehouseInventory.length === 0) {
            invSelect.innerHTML = '<option value="">No items currently in stock.</option>';
        } else {
            invSelect.innerHTML = '<option value="">-- Select Stock Record --</option>' +
                activeWarehouseInventory.map(item => 
                    `<option value="${item.id}">Slot: ${item.location} | ${item.productName} (Qty: ${item.stockQuantity} units)</option>`
                ).join('');
            invSelect.disabled = false;
        }
    } catch (err) {
        invSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

function onTransferInventoryChanged() {
    const invId = document.getElementById('transferInventorySelect').value;
    const destSelect = document.getElementById('transferDestWarehouseSelect');
    const locSelect = document.getElementById('transferLocationSelect');

    destSelect.value = "";
    destSelect.disabled = !invId;
    locSelect.innerHTML = '<option value="">-- Select Destination Slot --</option>';
    locSelect.disabled = true;

    if (invId) {
        // Pre-select the destination warehouse as the source warehouse for convenience
        const srcWhId = document.getElementById('transferWarehouseSelect').value;
        destSelect.value = srcWhId;
        onTransferDestWarehouseChanged();
    }
}

async function onTransferDestWarehouseChanged() {
    const destWhId = document.getElementById('transferDestWarehouseSelect').value;
    const locSelect = document.getElementById('transferLocationSelect');

    locSelect.innerHTML = '<option value="">-- Select Destination Slot --</option>';
    locSelect.disabled = true;

    if (!destWhId) return;

    locSelect.innerHTML = '<option value="">Loading destination slots...</option>';

    try {
        const token = AuthUtils.getToken();
        const locations = await AdminAPI.getWarehouseLocations(destWhId, token);

        const invId = document.getElementById('transferInventorySelect').value;
        const selectedInv = activeWarehouseInventory.find(item => item.id === parseInt(invId));
        const srcWhId = document.getElementById('transferWarehouseSelect').value;

        let filteredLocations = locations;
        // If same warehouse transfer, exclude the source location slot
        if (selectedInv && srcWhId === destWhId) {
            filteredLocations = locations.filter(loc => loc.location !== selectedInv.location);
        }

        if (filteredLocations.length === 0) {
            locSelect.innerHTML = '<option value="">No other location slots registered.</option>';
        } else {
            locSelect.innerHTML = '<option value="">-- Select Destination Slot --</option>' +
                filteredLocations.map(loc => {
                    const capText = `Capacity: ${loc.quantity}/${loc.maxCapacity}`;
                    return `<option value="${loc.id}">${loc.location} (${capText})</option>`;
                }).join('');
            locSelect.disabled = false;
        }
    } catch (err) {
        locSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

async function executeLocationTransfer() {
    const srcWhId = document.getElementById('transferWarehouseSelect').value;
    const invId = document.getElementById('transferInventorySelect').value;
    const destWhId = document.getElementById('transferDestWarehouseSelect').value;
    const targetLocId = document.getElementById('transferLocationSelect').value;

    if (!srcWhId || !invId || !destWhId || !targetLocId) {
        alert("Please complete all selection steps first!");
        return;
    }

    const user = AuthUtils.getUser();
    const userId = user ? user.id : 1;

    try {
        const token = AuthUtils.getToken();
        const payload = {
            inventoryId: parseInt(invId),
            newLocationId: targetLocId,
            userId: userId
        };

        const res = await fetch(`${API_CONFIG.BASE_URL}/inventory/transfer`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to execute location transfer");

        alert("🎉 Inventory stock successfully transferred!");
        
        // Reset and reload
        document.getElementById('transferInventorySelect').value = "";
        document.getElementById('transferDestWarehouseSelect').value = "";
        document.getElementById('transferLocationSelect').value = "";
        onTransferWarehouseChanged();
        loadTransferHistory();
    } catch (err) {
        alert(`❌ Error executing transfer: ${err.message}`);
    }
}

async function loadTransferHistory() {
    const tbody = document.getElementById('transferHistoryTableBody');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/inventory/transfers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load transfer history");
        const json = await res.json();
        const history = json.data || [];

        if (history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 font-bold">No transfer logs recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(item => {
            const timeText = Helpers.formatDate(item.createdAt);
            const route = `${item.sourceWarehouseName} (<b class="text-amber-405">${item.oldLocationName}</b>) → ${item.destWarehouseName} (<b class="text-amber-405">${item.newLocationName}</b>)`;
            return `
                <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                    <td class="py-3.5 text-slate-400 font-semibold">${timeText}</td>
                    <td class="py-3.5 text-white font-bold">${item.productName}</td>
                    <td class="py-3.5 text-slate-300 font-medium">${route}</td>
                    <td class="py-3.5 text-amber-400 font-bold">${item.qty} units</td>
                    <td class="py-3.5 text-slate-500 font-semibold">${item.userName}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-rose-450 font-bold bg-slate-900/10">Error: ${err.message}</td></tr>`;
    }
}
