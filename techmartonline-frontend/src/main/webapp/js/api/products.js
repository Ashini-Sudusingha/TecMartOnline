const ProductsAPI = {
    async getAll() {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
        return data.data || [];
    },
    async getById(id) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Product not found');
        return data.data;
    },
    async add(productDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add product');
        return data;
    },
    async update(productDto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productDto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update product');
        return data;
    },
    async delete(id, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete product');
        return data;
    },
    async getCategories() {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/categories`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');
        return data.data || [];
    },
    async getBrands() {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/brands`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch brands');
        return data.data || [];
    },
    async getColors() {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/colors`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch colors');
        return data.data || [];
    },
    async addCategory(dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add category');
        return data.data;
    },
    async addBrand(dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/brands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add brand');
        return data.data;
    },
    async addColor(dto, token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/colors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add color');
        return data.data;
    }
};
