const InventoryAPI = {
    async replenish(replenishDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory/replenish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(replenishDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to replenish inventory');
        return data;
    }
};
