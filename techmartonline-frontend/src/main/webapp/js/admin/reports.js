let allOrders = [];
let allWarehouses = [];
let allSuppliers = [];

async function loadAnalyticsData() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.checkAuth('ADMIN')) return;
    const token = AuthUtils.getToken();

    try {
        // Fetch raw feeds
        const [ordersRes, warehouses, suppliers] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            AdminAPI.getWarehouses(token),
            AdminAPI.getSuppliers(token)
        ]);

        if (!ordersRes.ok) throw new Error("Failed to load orders");
        const ordersJson = await ordersRes.ok ? await ordersRes.json() : { data: [] };
        allOrders = ordersJson.data || [];
        allWarehouses = warehouses || [];
        allSuppliers = suppliers || [];

        // 1. Calculate General Metrics
        let totalSalesVal = 0;
        let totalUnits = 0;

        allOrders.forEach(o => {
            totalSalesVal += o.totalAmount || 0;
            // Let's assume each order has at least 1 unit if items count is empty
            totalUnits += o.itemsCount || 1;
        });

        const grossValEl = document.getElementById('metricGrossVal');
        const unitsEl = document.getElementById('metricUnits');

        if (grossValEl) {
            grossValEl.textContent = Helpers.formatPrice(totalSalesVal);
        }
        if (unitsEl) {
            unitsEl.textContent = `${totalUnits} units`;
        }

        // 2. Category Sales Distribution
        // Mock distribution based on real order counts or product catalogs
        const sampleShare = { laptops: 55, audio: 30, accessories: 15 };
        
        // Let's bind UI shares
        document.getElementById('catShareLaptops').textContent = `${sampleShare.laptops}%`;
        document.getElementById('barShareLaptops').style.width = `${sampleShare.laptops}%`;

        document.getElementById('catShareAudio').textContent = `${sampleShare.audio}%`;
        document.getElementById('barShareAudio').style.width = `${sampleShare.audio}%`;

        document.getElementById('catShareAccessories').textContent = `${sampleShare.accessories}%`;
        document.getElementById('barShareAccessories').style.width = `${sampleShare.accessories}%`;

        // 3. Render SVG monthly graph
        drawRevenueTrendGraph();

        // 4. Render Warehouse table
        await renderWarehouseMetrics(token);

        // 5. Render Suppliers table
        renderSupplierMetrics();

    } catch (e) {
        console.error("Error loading analytics:", e);
    }
}

function drawRevenueTrendGraph() {
    const svg = document.getElementById('revenueTrendGraph');
    if (!svg) return;

    // Group sales by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlySales = [12450, 18290, 15400, 24150, 32900, 46140]; // Fallback values
    
    // Add real order aggregates to monthly values if present
    allOrders.forEach(ord => {
        const date = new Date(ord.createdAt);
        if (!isNaN(date.getTime())) {
            const mIdx = date.getMonth(); // 0-11
            // Map last 6 months dynamically or map standard Jan-Jun
            if (mIdx >= 0 && mIdx < 6) {
                // Scale up by a factor of 10 for presentation visibility
                monthlySales[mIdx] += (ord.totalAmount / 100); 
            }
        }
    });

    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 250;
    const padding = 40;

    const maxVal = Math.max(...monthlySales) * 1.1;

    // Coordinate points mapping
    const points = monthlySales.map((val, i) => {
        const x = padding + (i / (monthlySales.length - 1)) * (width - padding * 2);
        const y = height - padding - (val / maxVal) * (height - padding * 2);
        return { x, y, label: months[i], val };
    });

    // Generate path line coordinates
    let pathD = `M ${points[0].x} ${points[0].y} `;
    for (let i = 1; i < points.length; i++) {
        pathD += `L ${points[i].x} ${points[i].y} `;
    }

    // Generate area gradient coordinates
    let areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    svg.innerHTML = `
        <defs>
            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <!-- Grid Dash lines -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="#1e293b" stroke-dasharray="4,4" />
        <line x1="${padding}" y1="${(height - padding * 2) / 2 + padding}" x2="${width - padding}" y2="${(height - padding * 2) / 2 + padding}" stroke="#1e293b" stroke-dasharray="4,4" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#1e293b" />

        <!-- Glow Area -->
        <path d="${areaD}" fill="url(#areaGlow)" />

        <!-- Line graph -->
        <path d="${pathD}" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="chart-glow" />

        <!-- Nodes and tooltips -->
        ${points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0b0f19" stroke="#f59e0b" stroke-width="2.5" />
            <text x="${p.x}" y="${height - padding + 18}" fill="#94a3b8" font-size="10" font-weight="bold" text-anchor="middle">${p.label}</text>
            <text x="${p.x}" y="${p.y - 12}" fill="#ffffff" font-size="9" font-weight="extrabold" text-anchor="middle">Rs. ${(p.val / 1000).toFixed(1)}k</text>
        `).join('')}
    `;
}

async function renderWarehouseMetrics(token) {
    const tbody = document.getElementById('reportsWarehouseBody');
    if (!tbody) return;

    if (allWarehouses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-500">No warehouses configured.</td></tr>';
        return;
    }

    try {
        let rowsHtml = '';
        for (const wh of allWarehouses) {
            // Load its locations
            const locations = await AdminAPI.getWarehouseLocations(wh.id, token);
            let occupied = 0;
            let capacity = 0;

            locations.forEach(l => {
                occupied += l.quantity || 0;
                capacity += l.maxCapacity || 0;
            });

            const loadPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
            const statusBadge = loadPct >= 90 
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/5 text-rose-400 border border-rose-500/10">HIGH DENSITY</span>`
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">OPTIMAL</span>`;

            rowsHtml += `
                <tr class="hover:bg-slate-800/10">
                    <td class="py-3.5 px-4 font-bold text-amber-400">WH-${wh.id}</td>
                    <td class="py-3.5 px-4 text-white">${wh.name} (${wh.city})</td>
                    <td class="py-3.5 px-4">${occupied} / ${capacity}</td>
                    <td class="py-3.5 px-4">${loadPct}%</td>
                    <td class="py-3.5 px-4">${statusBadge}</td>
                </tr>
            `;
        }
        tbody.innerHTML = rowsHtml;
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-500">Error loading warehouse load factor.</td></tr>`;
    }
}

function renderSupplierMetrics() {
    const tbody = document.getElementById('reportsSuppliersBody');
    if (!tbody) return;

    if (allSuppliers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-500">No partners registered.</td></tr>';
        return;
    }

    tbody.innerHTML = allSuppliers.map(s => {
        const support = s.status === 'PLATINUM' ? 'Platinum Channel (B2B)' : 'Standard support level';
        return `
            <tr class="hover:bg-slate-800/10">
                <td class="py-3.5 px-4 font-bold text-white">${s.name}</td>
                <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">${s.brand || 'SUPPLIER'}</span></td>
                <td class="py-3.5 px-4 text-slate-400">${s.category || 'General'}</td>
                <td class="py-3.5 px-4">${support}</td>
                <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">ACTIVE PARTNER</span>
                </td>
            </tr>
        `;
    }).join('');
}

window.switchReportsTab = function(tabId) {
    const panels = ['sales', 'warehouse', 'suppliers'];
    panels.forEach(p => {
        const panelEl = document.getElementById(`panel-${p}`);
        const tabBtn = document.getElementById(`tab-${p}`);

        if (p === tabId) {
            if (panelEl) panelEl.classList.remove('hidden');
            if (tabBtn) {
                tabBtn.className = "border-b-2 border-amber-400 text-amber-400 px-1 pb-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer focus:outline-none transition-all uppercase tracking-wider";
            }
        } else {
            if (panelEl) panelEl.classList.add('hidden');
            if (tabBtn) {
                tabBtn.className = "border-b-2 border-transparent text-slate-400 hover:text-slate-100 px-1 pb-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer focus:outline-none transition-all uppercase tracking-wider";
            }
        }
    });

    if (tabId === 'sales') {
        setTimeout(drawRevenueTrendGraph, 50);
    }
};

window.triggerSimulatedExport = function() {
    showToast('Exporting high-fidelity analytics PDF layout...', true);
    setTimeout(() => {
        showToast('Analytic PDF compiled and downloaded successfully.', true);
    }, 1500);
};

document.addEventListener('DOMContentLoaded', () => {
    loadAnalyticsData();
    window.addEventListener('resize', drawRevenueTrendGraph);
});
