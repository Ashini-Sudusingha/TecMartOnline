document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    
    // Initial fetch
    fetchPerformanceMetrics();

    // Auto refresh interval handler
    setInterval(() => {
        const checkbox = document.getElementById('autoRefreshCheckbox');
        if (checkbox && checkbox.checked) {
            fetchPerformanceMetrics();
        }
    }, 3000);
});

async function fetchPerformanceMetrics() {
    const tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/performance/metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load performance metrics");
        
        const json = await res.json();
        const data = json.data || {};
        const metrics = data.metrics || [];

        // 1. Update Cards
        document.getElementById('statTotalCalls').textContent = metrics.length;
        
        const lookups = data.cacheLookups || 0;
        const hits = data.cacheHits || 0;
        const ratio = lookups > 0 ? ((hits / lookups) * 100).toFixed(1) : "0.0";
        document.getElementById('statCacheRatio').textContent = `${ratio}%`;

        const pool = data.connectionPool || {};
        document.getElementById('statActiveConnections').textContent = `${pool.activeConnections || 0} / ${pool.maxSize || 100}`;

        document.getElementById('statMdbOrders').textContent = data.ordersProcessed || 0;

        // 2. Update EJB Pools and Progress Bar
        const ejbPool = data.ejbPool || {};
        const stateless = ejbPool.statelessInstances || 15;
        const stateful = ejbPool.statefulInstances || 4;
        const singleton = ejbPool.singletonInstances || 3;
        
        const statelessEl = document.getElementById('reportsStatelessCount');
        const statefulEl = document.getElementById('reportsStatefulCount');
        const singletonEl = document.getElementById('reportsSingletonCount');
        
        if (statelessEl) statelessEl.textContent = `${stateless} instances active`;
        if (statefulEl) statefulEl.textContent = `${stateful} active sessions`;
        if (singletonEl) singletonEl.textContent = `${singleton} loaded (Cache, Core, Tracker)`;

        const dbBar = document.getElementById('barDbPool');
        if (dbBar && pool.maxSize > 0) {
            const activePct = Math.round(((pool.activeConnections || 0) / pool.maxSize) * 100);
            dbBar.style.width = `${Math.max(activePct, 2)}%`;
        }

        // 3. Update Table Rows (most recent first)
        if (metrics.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-bold">No EJB executions timed yet. Perform activities in the portal to populate logs.</td></tr>`;
            return;
        }

        const sortedMetrics = [...metrics].reverse();

        tbody.innerHTML = sortedMetrics.map(item => {
            let statusBadge = '';
            if (item.durationMs > 500) {
                statusBadge = `<span class="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider">🚨 Critical slow</span>`;
            } else if (item.durationMs > 100) {
                statusBadge = `<span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider">⚠️ Warning</span>`;
            } else {
                statusBadge = `<span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider">✅ SLA Healthy</span>`;
            }

            return `
                <tr class="hover:bg-slate-800/20 border-b border-slate-800/40">
                    <td class="py-3 px-4 text-slate-400 font-semibold">${item.className}</td>
                    <td class="py-3 px-4 text-white font-bold">${item.methodName}()</td>
                    <td class="py-3 px-4 text-indigo-400 font-black">${item.durationMs} ms</td>
                    <td class="py-3 px-4 text-right">${statusBadge}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-rose-500 font-bold">Error: ${err.message}</td></tr>`;
    }
}
