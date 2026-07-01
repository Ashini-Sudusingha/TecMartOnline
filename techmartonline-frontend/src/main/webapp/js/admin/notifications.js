// Global Live WebSocket Notification listener for Admin Dashboard & Warehouse Screens
function initLiveNotifications() {
    if (typeof AuthUtils !== 'undefined' && !AuthUtils.getToken()) {
        console.warn("Skipping WebSocket: User not authenticated.");
        return;
    }

    // Load WS endpoint from API_CONFIG if present, otherwise build it dynamically
    let wsUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.WS_URL) ? API_CONFIG.WS_URL : null;
    if (!wsUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/tecmartonline-sever/ws/inventory`;
    }

    console.log("Connecting to WebSocket Stock Notifications:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = function() {
        console.log("✅ WebSocket stock alerts connection established successfully!");
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log("📥 WebSocket stock alert received:", data);
            
            if (data.type === 'order' || (data.customerName && data.totalAmount && data.orderId)) {
                showStockToast(
                    `🔔 New Order Received`, 
                    `Customer <b>${data.customerName}</b> placed an order for <b>$${Helpers.formatPrice(data.totalAmount)}</b> (Order ID: #${data.orderId}).`
                );
                
                // Dispatch custom event for live dashboard and order list listeners
                window.dispatchEvent(new CustomEvent('newOrder', { detail: data }));
            } else if (data.type === 'picklist' || (data.picklistId && data.warehouseId)) {
                showStockToast(
                    `📋 New Pick List Assigned`, 
                    `Pick list <b>#PL-${1000 + data.picklistId}</b> with <b>${data.ordersCount} orders</b> assigned to warehouse <b>${data.warehouseName}</b>.`
                );
                
                // Dispatch custom event for warehouse listeners
                window.dispatchEvent(new CustomEvent('newPicklist', { detail: data }));
            } else if (data.type === 'locationTransfer' || (data.oldLoc && data.newLoc)) {
                showStockToast(
                    `🔄 Location Transfer`, 
                    `Moved <b>${data.qty} units</b> of <b>${data.productName}</b> from <b>${data.oldLoc}</b> to <b>${data.newLoc}</b> at warehouse <b>${data.warehouseName}</b>.`
                );
                
                window.dispatchEvent(new CustomEvent('locationTransfer', { detail: data }));
            } else if (data.productName && data.replenishedQuantity && data.warehouseName) {
                showStockToast(
                    `🔔 Stock Update`, 
                    `Added <b>${data.replenishedQuantity} units</b> of <b>${data.productName}</b> to <b>${data.warehouseName}</b> (${data.locationName || 'Slot'}).`
                );
                
                // Dispatch custom event for live dashboard listeners
                window.dispatchEvent(new CustomEvent('stockUpdate', { detail: data }));
            }
        } catch (e) {
            console.error("❌ Error parsing WebSocket stock notification:", e);
        }
    };

    ws.onerror = function(error) {
        console.error("⚠️ WebSocket error occurred:", error);
    };

    ws.onclose = function(event) {
        console.warn("🔌 WebSocket stock alerts disconnected. Reconnecting in 5 seconds...", event.reason);
        setTimeout(initLiveNotifications, 5000);
    };
}

function showStockToast(title, body) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        // Inline styles to guarantee viewport layout placement and avoid Tailwind purge issues
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 12px; max-width: 380px; width: calc(100% - 40px); pointer-events: none;";
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = "background-color: #0f172a; border: 1px solid rgba(251, 191, 36, 0.3); color: #f8fafc; padding: 16px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; gap: 6px; pointer-events: auto; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(20px); opacity: 0;";
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span style="font-size: 11px; font-weight: 900; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em;">${title}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 4px;">✕</button>
        </div>
        <p style="font-size: 13px; font-weight: 600; line-height: 1.5; color: #cbd5e1; margin: 0;">${body}</p>
    `;

    container.appendChild(toast);

    // Slide in animation trigger
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    // Auto-remove toast after 10 seconds
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 10000);
}

// Automatically initiate live connection on document load
document.addEventListener('DOMContentLoaded', () => {
    initLiveNotifications();
});
