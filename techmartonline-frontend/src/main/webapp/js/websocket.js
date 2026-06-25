const InventoryWebSocketClient = {
    socket: null,
    connect(onMessageCallback) {
        try {
            this.socket = new WebSocket(API_CONFIG.WS_URL);
            
            this.socket.onopen = () => {
                console.log('WS Connection established successfully with server.');
            };

            this.socket.onmessage = (event) => {
                console.log('WS Received stock replenishment notification: ', event.data);
                if (onMessageCallback) onMessageCallback(JSON.parse(event.data));
            };

            this.socket.onclose = () => {
                console.log('WS Connection closed. Reconnecting in 5 seconds...');
                setTimeout(() => this.connect(onMessageCallback), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('WS Error observed: ', error);
                this.socket.close();
            };
        } catch (e) {
            console.error('WS Init failed: ', e);
        }
    }
};
