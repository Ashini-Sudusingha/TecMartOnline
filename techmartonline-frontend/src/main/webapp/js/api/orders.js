const OrdersAPI = {
    async place(orderRequest, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderRequest)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to place order');
        return data;
    },
    async getByUserId(userId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/orders/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch user orders');
        return data.data || [];
    }
};
