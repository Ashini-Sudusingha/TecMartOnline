const AdminAPI = {
    async getWarehouses(token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch warehouses');
        return data.data || [];
    },
    async getUsers(token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
        return data.data || [];
    }
};
