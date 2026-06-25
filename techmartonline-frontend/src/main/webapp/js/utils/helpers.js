const Helpers = {
    formatPrice(amount) {
        return `$${parseFloat(amount).toFixed(2)}`;
    },
    formatDate(dateVal) {
        if (!dateVal) return 'N/A';
        return new Date(dateVal).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }
};
