document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!AuthUtils.checkAuth('ADMIN')) return;

    const token = AuthUtils.getToken();
    const currentUser = AuthUtils.getUser();
    if (!currentUser) return;

    const myUserId = currentUser.id || currentUser.userId;
    const myRole = currentUser.role || AuthUtils.getRole();

    // DOM Elements
    const contactsList = document.getElementById('contactsList');
    const contactSearch = document.getElementById('contactSearch');
    const btnRoleBroadcast = document.getElementById('btnRoleBroadcast');
    const chatArea = document.getElementById('chatArea');
    const welcomePanel = document.getElementById('welcomePanel');
    const activeChatPanel = document.getElementById('activeChatPanel');
    const chatHeaderName = document.getElementById('chatHeaderName');
    const chatHeaderSub = document.getElementById('chatHeaderSub');
    const chatHeaderInitials = document.getElementById('chatHeaderInitials');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const wsStatusDot = document.getElementById('wsStatusDot');

    // Modals
    const broadcastModal = document.getElementById('broadcastModal');
    const btnCloseBroadcastModal = document.getElementById('btnCloseBroadcastModal');
    const broadcastForm = document.getElementById('broadcastForm');
    const broadcastRole = document.getElementById('broadcastRole');
    const broadcastMessage = document.getElementById('broadcastMessage');

    // State Variables
    let allContacts = [];
    let activeContact = null; // Currently selected user object
    let chatSocket = null;
    let unreadCounts = {}; // contactId -> count

    // Initialize Page
    init();

    async function init() {
        setupWebSocket();
        await loadContacts();
        setupEventListeners();
    }

    // Connect to WebSocket Server
    function setupWebSocket() {
        const wsBase = API_CONFIG.BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
        const wsUrl = `${wsBase}/ws/chat/${myUserId}/${myRole}`;

        chatSocket = new WebSocket(wsUrl);

        chatSocket.onopen = () => {
            console.log('ChatWebSocket connected successfully.');
            if (wsStatusDot) {
                wsStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
            }
        };

        chatSocket.onclose = () => {
            console.warn('ChatWebSocket disconnected. Retrying in 5 seconds...');
            if (wsStatusDot) {
                wsStatusDot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-pulse';
            }
            setTimeout(setupWebSocket, 5000);
        };

        chatSocket.onerror = (error) => {
            console.error('ChatWebSocket encountered an error:', error);
        };

        chatSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleIncomingMessage(message);
            } catch (e) {
                console.error('Error handling WebSocket message:', e);
            }
        };
    }

    // Handle incoming messages in real-time
    function handleIncomingMessage(msg) {
        // If it's a message for the active chat
        if (activeContact && (
            (msg.senderId === activeContact.id && msg.recipientId === myUserId) ||
            (msg.senderId === myUserId && msg.recipientId === activeContact.id)
        )) {
            appendMessageBubble(msg);
            scrollMessagesToBottom();
            
            // Mark as read in DB if sent by the other user
            if (msg.senderId === activeContact.id) {
                markMessageAsRead(msg.id);
            }
        } else {
            // Increment unread count for the sender
            if (msg.senderId !== myUserId) {
                unreadCounts[msg.senderId] = (unreadCounts[msg.senderId] || 0) + 1;
                updateContactItemBadge(msg.senderId);
                updateSidebarBadge();
            }
        }
    }

    // Fetch and populate contacts list
    async function loadContacts() {
        try {
            // 1. Fetch active conversations list
            const res = await fetch(`${API_CONFIG.BASE_URL}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.data && data.data.length > 0) {
                allContacts = data.data;
            } else {
                // 2. If no prior chats, fetch all users so the admin can start a chat
                const usersRes = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();
                if (usersRes.ok && usersData.data) {
                    allContacts = usersData.data.filter(u => u.id !== myUserId);
                }
            }

            renderContacts(allContacts);
        } catch (e) {
            console.error('Error loading contacts:', e);
            contactsList.innerHTML = `<div class="text-center py-8 text-xs text-rose-500 font-bold">Failed to load contacts lists.</div>`;
        }
    }

    // Render Contacts HTML List
    function renderContacts(contacts) {
        if (contacts.length === 0) {
            contactsList.innerHTML = `<div class="text-center py-8 text-xs text-slate-400 font-semibold">No contacts found.</div>`;
            return;
        }

        contactsList.innerHTML = contacts.map(c => {
            const name = `${c.fname || c.firstName} ${c.lname || c.lastName}`;
            const initials = `${c.fname ? c.fname[0] : ''}${c.lname ? c.lname[0] : ''}`.toUpperCase() || 'U';
            
            let roleBadgeClass = 'bg-slate-100 text-slate-600';
            if (c.role === 'ADMIN') roleBadgeClass = 'bg-amber-500/10 text-amber-600';
            else if (c.role === 'WAREHOUSE_STAFF') roleBadgeClass = 'bg-blue-500/10 text-blue-600';

            const unread = unreadCounts[c.id] || 0;
            const unreadClass = unread > 0 ? '' : 'hidden';

            const activeClass = activeContact && activeContact.id === c.id ? 'bg-amber-400/10 border-amber-300' : 'hover:bg-slate-50 border-transparent';

            return `
                <div onclick="window.selectContact(${c.id})" class="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${activeClass}" id="contact-${c.id}">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-inner">
                            ${initials}
                        </div>
                        <div class="text-left">
                            <h4 class="font-bold text-slate-800 text-xs">${name}</h4>
                            <p class="text-[9px] text-slate-400 font-semibold truncate max-w-[130px]">${c.email}</p>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1.5">
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${roleBadgeClass}">${c.role}</span>
                        <span id="badge-${c.id}" class="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white ${unreadClass}">${unread}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Expose selectContact to global scope
    window.selectContact = async function(contactId) {
        const contact = allContacts.find(c => c.id === contactId);
        if (!contact) return;

        activeContact = contact;

        // Clear unread count locally
        unreadCounts[contactId] = 0;
        updateContactItemBadge(contactId);
        updateSidebarBadge();

        // Highlight selected contact in UI
        allContacts.forEach(c => {
            const el = document.getElementById(`contact-${c.id}`);
            if (el) {
                if (c.id === contactId) {
                    el.className = 'p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer bg-amber-400/10 border-amber-300';
                } else {
                    el.className = 'p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer hover:bg-slate-50 border-transparent';
                }
            }
        });

        // Setup Chat Header
        chatHeaderName.textContent = `${contact.fname || contact.firstName} ${contact.lname || contact.lastName}`;
        chatHeaderSub.textContent = `${contact.role} • ${contact.email}`;
        chatHeaderInitials.textContent = `${contact.fname ? contact.fname[0] : ''}${contact.lname ? contact.lname[0] : ''}`.toUpperCase() || 'U';

        welcomePanel.classList.add('hidden');
        activeChatPanel.classList.remove('hidden');

        // Load Messages History
        await loadChatHistory(contactId);
    };

    // Load Chat History
    async function loadChatHistory(contactId) {
        try {
            messagesContainer.innerHTML = `<div class="text-center py-8 text-xs text-slate-400 font-semibold">Loading conversation...</div>`;
            
            const res = await fetch(`${API_CONFIG.BASE_URL}/messages/direct/${contactId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.data) {
                messagesContainer.innerHTML = '';
                data.data.forEach(msg => {
                    appendMessageBubble(msg);
                    if (msg.senderId === contactId && !msg.isRead) {
                        markMessageAsRead(msg.id);
                    }
                });
                scrollMessagesToBottom();
            }
        } catch (e) {
            console.error('Error loading chat history:', e);
            messagesContainer.innerHTML = `<div class="text-center py-8 text-xs text-rose-500 font-bold">Failed to load chat history.</div>`;
        }
    }

    // Append single bubble to chat container
    function appendMessageBubble(msg) {
        const isMyMsg = msg.senderId === myUserId;
        const bubbleBg = isMyMsg ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none';
        const justify = isMyMsg ? 'justify-end' : 'justify-start';
        const formattedTime = Helpers.formatDate ? Helpers.formatDate(msg.sentAt) : new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const html = `
            <div class="flex ${justify} w-full">
                <div class="max-w-[70%] space-y-1">
                    <div class="p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${bubbleBg}">
                        ${msg.messageText}
                    </div>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-right px-1">${formattedTime}</p>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', html);
    }

    // Mark Message as Read in DB
    async function markMessageAsRead(messageId) {
        try {
            await fetch(`${API_CONFIG.BASE_URL}/messages/${messageId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Error marking message as read:', e);
        }
    }

    // Update unread badge count for specific contact item
    function updateContactItemBadge(contactId) {
        const badge = document.getElementById(`badge-${contactId}`);
        if (!badge) return;

        const count = unreadCounts[contactId] || 0;
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Update global sidebar badge count
    function updateSidebarBadge() {
        const sidebarBadge = document.getElementById('sidebar-chat-badge');
        if (!sidebarBadge) return;

        const totalUnread = Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
        if (totalUnread > 0) {
            sidebarBadge.textContent = totalUnread;
            sidebarBadge.classList.remove('hidden');
        } else {
            sidebarBadge.classList.add('hidden');
        }
    }

    // Helper: Scroll Chat to bottom
    function scrollMessagesToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Setup events
    function setupEventListeners() {
        // Search Contacts filter
        if (contactSearch) {
            contactSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = allContacts.filter(c => {
                    const name = `${c.fname || c.firstName} ${c.lname || c.lastName}`.toLowerCase();
                    return name.includes(query) || c.email.toLowerCase().includes(query) || c.role.toLowerCase().includes(query);
                });
                renderContacts(filtered);
            });
        }

        // Direct Message Form Submit
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!activeContact) return;

                const text = messageInput.value.trim();
                if (!text) return;

                const msgPayload = {
                    senderId: myUserId,
                    recipientId: activeContact.id,
                    messageText: text
                };

                if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                    chatSocket.send(JSON.stringify(msgPayload));
                    messageInput.value = '';
                } else {
                    alert('WebSocket connection is not active. Message could not be sent.');
                }
            });
        }

        // Role Broadcast Modal Toggles
        if (btnRoleBroadcast) {
            btnRoleBroadcast.addEventListener('click', () => {
                broadcastModal.classList.remove('hidden');
            });
        }

        if (btnCloseBroadcastModal) {
            btnCloseBroadcastModal.addEventListener('click', () => {
                broadcastModal.classList.add('hidden');
            });
        }

        // Broadcast Form Submit
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const role = broadcastRole.value;
                const text = broadcastMessage.value.trim();
                if (!text) return;

                const msgPayload = {
                    senderId: myUserId,
                    recipientRole: role,
                    messageText: text
                };

                if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                    chatSocket.send(JSON.stringify(msgPayload));
                    broadcastModal.classList.add('hidden');
                    broadcastMessage.value = '';
                    alert(`📢 Broadcast message published to role group: ${role}`);
                } else {
                    alert('WebSocket connection is not active. Broadcast could not be sent.');
                }
            });
        }
    }
});
