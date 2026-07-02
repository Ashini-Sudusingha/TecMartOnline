(function() {
    // Check if user is authenticated and is a CUSTOMER
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    if (!token || !userJson || role !== 'CUSTOMER') return;

    const user = JSON.parse(userJson);
    const myUserId = user.id || user.userId;
    const myRole = 'CUSTOMER';
    const adminId = 1; // Admin user ID from database

    let ws = null;
    let isOpen = false;

    // Create Chat Widget HTML Elements dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        #chat-widget-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: #0f172a;
            color: #fbbf24;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
            border: 2px solid #fbbf24;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #chat-widget-btn:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 30px -5px rgba(15, 23, 42, 0.4);
        }
        #chat-widget-container {
            position: fixed;
            bottom: 96px;
            right: 24px;
            z-index: 9999;
            width: 320px;
            height: 400px;
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #chat-widget-container.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        #chat-widget-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            padding: 3px 6px;
            font-size: 9px;
            font-weight: 800;
            border: 2px solid #0f172a;
        }
        .widget-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .widget-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .widget-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
    `;
    document.head.appendChild(style);

    const widgetBtn = document.createElement('div');
    widgetBtn.id = 'chat-widget-btn';
    widgetBtn.innerHTML = '💬 <span id="chat-widget-badge" class="hidden">0</span>';
    document.body.appendChild(widgetBtn);

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chat-widget-container';
    widgetContainer.innerHTML = `
        <!-- Header -->
        <div style="background: #0f172a;" class="px-4 py-3 flex items-center justify-between text-white border-b border-slate-800">
            <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div class="text-left">
                    <h4 class="text-xs font-black text-white leading-tight">TechMart Support</h4>
                    <p class="text-[9px] text-slate-400 font-semibold mt-0.5">Online Support Helpdesk</p>
                </div>
            </div>
            <button id="chat-widget-close" class="text-slate-400 hover:text-white transition-all text-xs font-bold focus:outline-none cursor-pointer">✕</button>
        </div>
        
        <!-- Messages list -->
        <div id="chat-widget-messages" class="flex-1 overflow-y-auto widget-scrollbar p-4 space-y-3 bg-slate-50">
            <!-- Loading indicator -->
            <div class="text-center py-8 text-[10px] text-slate-400 font-bold">Loading chat history...</div>
        </div>
        
        <!-- Input Form -->
        <form id="chat-widget-form" class="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input type="text" id="chat-widget-input" placeholder="Type a message..." class="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 font-semibold" autocomplete="off" required />
            <button type="submit" style="background: #0f172a;" class="px-3 py-2 rounded-xl text-white text-xs font-bold hover:bg-amber-400 hover:text-slate-900 transition-all cursor-pointer">➔</button>
        </form>
    `;
    document.body.appendChild(widgetContainer);

    const messagesBox = document.getElementById('chat-widget-messages');
    const inputForm = document.getElementById('chat-widget-form');
    const msgInput = document.getElementById('chat-widget-input');
    const closeBtn = document.getElementById('chat-widget-close');
    const badge = document.getElementById('chat-widget-badge');

    let unreadCount = 0;

    // Toggle Widget expanded/collapsed state
    widgetBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            widgetContainer.classList.add('open');
            widgetBtn.innerHTML = '✕';
            unreadCount = 0;
            badge.classList.add('hidden');
            
            // Connect to WebSocket if not already connected
            if (!ws) {
                connectWebSocket();
            }
            loadHistory();
        } else {
            widgetContainer.classList.remove('open');
            widgetBtn.innerHTML = '💬 <span id="chat-widget-badge" class="hidden">0</span>';
        }
    });

    closeBtn.addEventListener('click', () => {
        isOpen = false;
        widgetContainer.classList.remove('open');
        widgetBtn.innerHTML = '💬 <span id="chat-widget-badge" class="hidden">0</span>';
    });

    // Connect to WebSocket
    function connectWebSocket() {
        const base = window.location.origin.replace(/^http/, 'ws');
        // Derive contextual endpoint (e.g. ws://localhost:8080/tecmartonline-sever)
        const path = window.location.pathname;
        const contextRoot = path.substring(0, path.indexOf('/', 1)) || '/tecmartonline-sever';
        const wsUrl = `${base}${contextRoot}/ws/chat/${myUserId}/${myRole}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Support Widget chat connected.');
        };

        ws.onclose = () => {
            console.warn('Support Widget disconnected. Retrying...');
            ws = null;
            if (isOpen) {
                setTimeout(connectWebSocket, 5000);
            }
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                
                // If message is from Admin or broad message
                if (msg.senderId === adminId || msg.recipientRole === 'CUSTOMER') {
                    appendMessage(msg);
                    scrollBottom();

                    if (!isOpen) {
                        unreadCount++;
                        badge.textContent = unreadCount;
                        badge.classList.remove('hidden');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
    }

    // Load Chat History
    async function loadHistory() {
        try {
            const path = window.location.pathname;
            const contextRoot = path.substring(0, path.indexOf('/', 1)) || '/tecmartonline-sever';
            const baseApiUrl = `${window.location.origin}${contextRoot}/api`;

            const res = await fetch(`${baseApiUrl}/messages/direct/${adminId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.data) {
                messagesBox.innerHTML = '';
                
                // Load direct messages
                data.data.forEach(msg => appendMessage(msg));

                // Also load role broadcasts for CUSTOMER role
                const broadRes = await fetch(`${baseApiUrl}/messages/role/CUSTOMER`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const broadData = await broadRes.json();
                if (broadRes.ok && broadData.data) {
                    broadData.data.forEach(msg => appendMessage(msg));
                }

                // Sort messages in UI by timestamp
                const bubbles = Array.from(messagesBox.children);
                bubbles.sort((a, b) => parseInt(a.dataset.time) - parseInt(b.dataset.time));
                messagesBox.innerHTML = '';
                bubbles.forEach(b => messagesBox.appendChild(b));

                scrollBottom();
            }
        } catch (e) {
            console.error(e);
            messagesBox.innerHTML = `<div class="text-center py-8 text-[10px] text-rose-500 font-bold">Failed to load messages.</div>`;
        }
    }

    // Append single bubble
    function appendMessage(msg) {
        const isMe = msg.senderId === myUserId;
        const align = isMe ? 'justify-end' : 'justify-start';
        const bg = isMe ? 'bg-amber-400 text-slate-900 rounded-tr-none' : 'bg-slate-200 text-slate-800 rounded-tl-none';
        const formattedTime = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = `flex ${align} w-full`;
        div.dataset.time = msg.sentAt;
        div.innerHTML = `
            <div class="max-w-[80%]">
                <div class="p-2.5 rounded-xl text-[11px] font-semibold leading-relaxed shadow-sm ${bg}">
                    ${msg.messageText}
                </div>
                <p class="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-right px-1 mt-0.5">${formattedTime}</p>
            </div>
        `;
        messagesBox.appendChild(div);
    }

    function scrollBottom() {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    // Submit form
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = msgInput.value.trim();
        if (!text) return;

        const payload = {
            senderId: myUserId,
            recipientId: adminId,
            messageText: text
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
            
            // Render locally immediately
            appendMessage({
                senderId: myUserId,
                recipientId: adminId,
                messageText: text,
                sentAt: Date.now()
            });
            scrollBottom();
            msgInput.value = '';
        } else {
            alert('Unable to send. Chat connection lost.');
        }
    });

})();
