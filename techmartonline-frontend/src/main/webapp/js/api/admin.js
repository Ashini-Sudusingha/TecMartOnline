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
    async addWarehouse(warehouseDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(warehouseDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add warehouse');
        return data.data;
    },
    async updateWarehouse(id, warehouseDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(warehouseDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update warehouse');
        return data.data;
    },
    async deleteWarehouse(id, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete warehouse');
        return data.data;
    },
    async getWarehouseLocations(warehouseId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${warehouseId}/locations`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch locations');
        return data.data || [];
    },
    async addWarehouseLocation(warehouseId, dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${warehouseId}/locations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add location');
        return data.data;
    },
    async updateWarehouseLocation(warehouseId, locationId, dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${warehouseId}/locations/${locationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update location');
        return data.data;
    },
    async deleteWarehouseLocation(warehouseId, locationId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/warehouses/${warehouseId}/locations/${locationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete location');
        return data.data;
    },
    async getSuppliers(token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/suppliers`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch suppliers');
        return data.data || [];
    },
    async addSupplier(supplierDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/suppliers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supplierDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add supplier');
        return data.data;
    },
    async updateSupplier(id, supplierDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/suppliers/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supplierDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update supplier');
        return data.data;
    },
    async deleteSupplier(id, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/suppliers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete supplier');
        return data.data;
    },
    async getInvoices(token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/invoices`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch invoices');
        return data.data || [];
    },
    async addInvoice(invoiceDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create invoice');
        return data.data;
    },
    async getInvoiceInventory(invoiceId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory/invoice/${invoiceId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch invoice items');
        return data.data || [];
    },
    async addInvoiceInventory(invoiceId, dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory/invoice/${invoiceId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add item to invoice');
        return data.data;
    },
    async addInvoiceInventoryBulk(invoiceId, list, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory/invoice/${invoiceId}/bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(list)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add items to invoice bulk');
        return data.data;
    },
    async getWarehouseInventory(warehouseId, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/inventory/warehouse/${warehouseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch warehouse inventory');
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
