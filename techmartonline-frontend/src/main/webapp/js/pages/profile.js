let allCities = [];
let allAddresses = [];
let allOrders = [];

// Toggle showing address insertion form
function toggleAddressForm() {
    const form = document.getElementById('addressForm');
    if (form) {
        form.classList.toggle('hidden');
    }
}

// Load personal details
function loadPersonalDetails() {
    const user = AuthUtils.getUser();
    if (!user) return;

    document.getElementById('profileFullName').textContent = `${user.firstName || 'TechMart'} ${user.lastName || 'Customer'}`;
    document.getElementById('profileEmail').textContent = user.email || 'N/A';
    document.getElementById('profilePhone').textContent = user.mobile || 'No contact listed';
    
    const initial = (user.firstName || 'U').charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = initial;
}

// Load provinces list for address insert
async function loadProvinces() {
    const select = document.getElementById('addressProvince');
    if (!select) return;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${Config.BASE_URL}/users/provinces`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load provinces");
        const json = await res.json();
        
        const provinces = json.data || [];
        select.innerHTML = '<option value="">Select Province</option>' + 
            provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            
        resetSelect('addressDistrict', 'Select District');
        resetSelect('addressCity', 'Select City');
    } catch (err) {
        console.error("Error loading provinces:", err);
    }
}

// Load districts based on selected province
async function loadDistricts(provinceId) {
    const select = document.getElementById('addressDistrict');
    if (!select) return;

    if (!provinceId) {
        resetSelect('addressDistrict', 'Select District');
        resetSelect('addressCity', 'Select City');
        return;
    }

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${Config.BASE_URL}/users/provinces/${provinceId}/districts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load districts");
        const json = await res.json();
        
        const districts = json.data || [];
        select.innerHTML = '<option value="">Select District</option>' + 
            districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        select.disabled = false;
        
        resetSelect('addressCity', 'Select City');
    } catch (err) {
        console.error("Error loading districts:", err);
    }
}

// Load cities based on selected district
async function loadCitiesByDistrict(districtId) {
    const select = document.getElementById('addressCity');
    if (!select) return;

    if (!districtId) {
        resetSelect('addressCity', 'Select City');
        return;
    }

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${Config.BASE_URL}/users/districts/${districtId}/cities`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load cities");
        const json = await res.json();
        
        const cities = json.data || [];
        select.innerHTML = '<option value="">Select City</option>' + 
            cities.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        select.disabled = false;
    } catch (err) {
        console.error("Error loading cities:", err);
    }
}

function resetSelect(id, placeholder) {
    const select = document.getElementById(id);
    if (select) {
        select.innerHTML = `<option value="">${placeholder}</option>`;
        select.disabled = true;
    }
}

// Load user addresses list
async function loadAddresses() {
    const container = document.getElementById('addressesContainer');
    if (!container) return;

    try {
        const token = AuthUtils.getToken();
        const user = AuthUtils.getUser();
        
        const res = await fetch(`${Config.BASE_URL}/users/${user.id}/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load addresses");
        const json = await res.json();
        
        allAddresses = json.data || [];

        if (allAddresses.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs font-semibold">No addresses saved yet.</div>';
            return;
        }

        container.innerHTML = allAddresses.map(addr => `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">📍 Delivery Address</span>
                    <span class="text-[10px] font-semibold text-slate-400">Postal: ${addr.postalCode}</span>
                </div>
                <p class="text-xs font-bold text-slate-800 leading-tight">${addr.line1}</p>
                <p class="text-xs font-semibold text-slate-500">${addr.line2}, ${addr.cityName}</p>
                ${addr.mobile ? `<p class="text-[10px] text-slate-400 font-semibold mt-0.5">📞 ${addr.mobile}</p>` : ''}
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="text-center py-4 text-rose-500 text-xs font-semibold">Error: ${err.message}</div>`;
    }
}

// Save Address Submission Handler
async function setupAddressSubmit() {
    const form = document.getElementById('addressForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = AuthUtils.getToken();
        const user = AuthUtils.getUser();

        const dto = {
            line1: document.getElementById('addressLine1').value,
            line2: document.getElementById('addressLine2').value,
            cityId: parseInt(document.getElementById('addressCity').value),
            postalCode: document.getElementById('addressZip').value,
            mobile: document.getElementById('addressMobile').value || null,
            userId: user.id
        };

        try {
            const res = await fetch(`${Config.BASE_URL}/users/${user.id}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dto)
            });

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || "Failed to save address");
            }

            alert("✅ Address added successfully!");
            form.reset();
            form.classList.add('hidden');
            await loadAddresses();
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        }
    });
}

// Load customer orders history list
async function loadOrdersHistory() {
    const tbody = document.getElementById('ordersHistoryBody');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const user = AuthUtils.getUser();
        
        const res = await fetch(`${Config.BASE_URL}/orders/user/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load orders");
        const json = await res.json();
        
        allOrders = json.data || [];

        if (allOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold">You have not placed any orders yet.</td></tr>';
            return;
        }

        tbody.innerHTML = allOrders.map(ord => {
            const dateStr = Helpers.formatDate(ord.createdAt);
            const statusClass = ord.status.toLowerCase() === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
            
            return `
                <tr class="hover:bg-slate-50/50 transition-all">
                    <td class="py-3.5 px-4 font-bold text-slate-900">#ORD-${10000 + ord.id}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-500">${dateStr}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-600">${Helpers.formatPrice(ord.subtotal)}</td>
                    <td class="py-3.5 px-4 font-black text-slate-900">${Helpers.formatPrice(ord.totalAmount)}</td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border ${statusClass}">${ord.status}</span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <button onclick="trackOrder(${ord.id})" class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer">
                            🔍 Track Status
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-500 font-semibold">Error: ${err.message}</td></tr>`;
    }
}

// Track Specific Order Steps
function trackOrder(orderId) {
    const ord = allOrders.find(o => o.id === orderId);
    if (!ord) return;

    const tracker = document.getElementById('orderTrackingCard');
    if (!tracker) return;

    tracker.classList.remove('hidden');
    document.getElementById('trackOrderId').textContent = `Tracking Order: #ORD-${10000 + ord.id}`;
    document.getElementById('trackOrderDate').textContent = `Placed on ${Helpers.formatDate(ord.createdAt)}`;
    
    const badge = document.getElementById('trackOrderStatusBadge');
    badge.textContent = ord.status;
    
    // Reset status steps
    const step1 = document.getElementById('stepPlacedCircle');
    const step2 = document.getElementById('stepProcessCircle');
    const step3 = document.getElementById('stepShippedCircle');
    const step4 = document.getElementById('stepDeliveredCircle');

    const title2 = document.getElementById('stepProcessTitle');
    const title3 = document.getElementById('stepShippedTitle');
    const title4 = document.getElementById('stepDeliveredTitle');

    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');
    const line3 = document.getElementById('stepLine3');

    // Default resetting
    [step1, step2, step3, step4].forEach(el => {
        el.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-500";
    });
    [title2, title3, title4].forEach(el => {
        el.className = "text-xs font-bold text-slate-600";
    });
    [line1, line2, line3].forEach(el => {
        el.className = "h-6 w-0.5 sm:h-0.5 sm:w-full bg-slate-200 flex-1";
    });

    // Step 1: Placed is always active
    step1.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-md";
    step1.textContent = "✓";

    const status = ord.status.toUpperCase();

    // Set default labels in case they were modified
    step2.textContent = "2";
    step3.textContent = "3";
    step4.textContent = "4";

    // Step 2: Processing (Active for Processing, Packed, Shipped, Dispatched, Delivered)
    if (status === "PROCESSING" || status === "PACKED" || status === "SHIPPED" || status === "DISPATCHED" || status === "DELIVERED") {
        line1.className = "h-6 w-0.5 sm:h-0.5 sm:w-full bg-emerald-500 flex-1";
        step2.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-md";
        step2.textContent = "✓";
        title2.className = "text-xs font-bold text-emerald-600";
    }

    // Step 3: Dispatched (Active for Packed, Shipped, Dispatched, Delivered)
    if (status === "PACKED" || status === "SHIPPED" || status === "DISPATCHED" || status === "DELIVERED") {
        line2.className = "h-6 w-0.5 sm:h-0.5 sm:w-full bg-emerald-500 flex-1";
        step3.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-md";
        step3.textContent = "✓";
        title3.className = "text-xs font-bold text-emerald-600";
    }

    // Step 4: Delivered (Active for Delivered)
    if (status === "DELIVERED") {
        line3.className = "h-6 w-0.5 sm:h-0.5 sm:w-full bg-emerald-500 flex-1";
        step4.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-md";
        step4.textContent = "✓";
        title4.className = "text-xs font-bold text-emerald-600";
    }

    // Scroll to tracker smooth
    tracker.scrollIntoView({ behavior: 'smooth' });
}

// Initial triggers
document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthUtils.checkAuth('CUSTOMER')) return;

    loadPersonalDetails();
    await Promise.all([
        loadProvinces(),
        loadAddresses(),
        loadOrdersHistory()
    ]);
    setupAddressSubmit();

    // Cascaded dropdown listeners
    const provinceSelect = document.getElementById('addressProvince');
    const districtSelect = document.getElementById('addressDistrict');
    
    if (provinceSelect) {
        provinceSelect.addEventListener('change', (e) => {
            loadDistricts(e.target.value);
        });
    }
    if (districtSelect) {
        districtSelect.addEventListener('change', (e) => {
            loadCitiesByDistrict(e.target.value);
        });
    }
});
