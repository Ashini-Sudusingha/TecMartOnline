const Helpers = {
    formatPrice(amount) {
        return `$${parseFloat(amount).toFixed(2)}`;
    },
    formatDate(dateVal) {
        if (!dateVal) return 'N/A';
        // Clean timezone suffix like "[UTC]" or "[Asia/Colombo]" that breaks JS Date parsing
        let cleanedDate = dateVal;
        if (typeof dateVal === 'string') {
            cleanedDate = dateVal.replace(/\[[^\]]+\]$/, '');
        }
        return new Date(cleanedDate).toLocaleDateString(undefined, {
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
