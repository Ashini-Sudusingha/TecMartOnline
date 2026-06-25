const CartAPI = {
    async get(userId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cart/${userId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch cart');
        return data.data || [];
    },
    async add(userId, productId, quantity, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cart/${userId}?productId=${productId}&quantity=${quantity}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add to cart');
        return data;
    },
    async remove(cartItemId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cart/item/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to remove from cart');
        return data;
    }
};
