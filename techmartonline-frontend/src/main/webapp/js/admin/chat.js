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
    const messagesContainer = document.getElementById('messagesContainer');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const wsStatusDot = document.getElementById('wsStatusDot');

    // Modals
    const broadcastModal = document.getElementById('broadcastModal');
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
        if (activeContact && (
            (msg.senderId === activeContact.id && msg.recipientId === myUserId) ||
            (msg.senderId === myUserId && msg.recipientId === activeContact.id)
        )) {
            appendMessageBubble(msg);
            scrollMessagesToBottom();
            
            if (msg.senderId === activeContact.id) {
                markMessageAsRead(msg.id);
            }
        } else {
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
            const res = await fetch(`${API_CONFIG.BASE_URL}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.data && data.data.length > 0) {
                allContacts = data.data;
            } else {
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
            contactsList.innerHTML = `<div class="text-center py-8 text-xs text-slate-500 font-semibold">No conversations found.</div>`;
            return;
        }

        contactsList.innerHTML = contacts.map(c => {
            const name = `${c.fname || c.firstName} ${c.lname || c.lastName}`;
            const initials = `${c.fname ? c.fname[0] : ''}${c.lname ? c.lname[0] : ''}`.toUpperCase() || 'U';
            
            let roleColors = "bg-slate-800 text-slate-400 border border-slate-700/40";
            if (c.role === 'ADMIN') roleColors = 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
            else if (c.role === 'WAREHOUSE_STAFF') roleColors = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

            const unread = unreadCounts[c.id] || 0;
            const unreadClass = unread > 0 ? '' : 'hidden';

            const isActive = activeContact && activeContact.id === c.id ? 'bg-[#0d121f] border-slate-800' : 'hover:bg-slate-900/10 border-transparent';

            return `
                <div onclick="window.selectContact(${c.id})" class="flex items-start gap-3 p-3 rounded-2xl cursor-pointer border ${isActive} transition-all duration-200 group relative" id="contact-${c.id}">
                    <div class="w-11 h-11 rounded-full bg-slate-900/60 text-slate-350 border border-slate-800 flex items-center justify-center font-bold text-sm shadow-inner shrink-0 uppercase">
                        ${initials}
                    </div>
                    <div class="flex-1 min-w-0 text-left">
                        <div class="flex justify-between items-baseline mb-0.5">
                            <h4 class="text-sm font-bold text-white truncate pr-2">${name}</h4>
                            <span class="text-[9px] text-slate-500 font-bold whitespace-nowrap">Active</span>
                        </div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${roleColors}">${c.role}</span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <p class="text-xs text-slate-450 truncate font-medium">${c.email}</p>
                            <span id="badge-${c.id}" class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black ${unreadClass}">${unread}</span>
                        </div>
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

        unreadCounts[contactId] = 0;
        updateContactItemBadge(contactId);
        updateSidebarBadge();

        allContacts.forEach(c => {
            const el = document.getElementById(`contact-${c.id}`);
            if (el) {
                if (c.id === contactId) {
                    el.className = 'flex items-start gap-3 p-3 rounded-2xl cursor-pointer border bg-[#0d121f] border-slate-800 transition-all duration-200 group relative';
                } else {
                    el.className = 'flex items-start gap-3 p-3 rounded-2xl cursor-pointer border hover:bg-slate-900/10 border-transparent transition-all duration-200 group relative';
                }
            }
        });

        // Setup Chat Header
        const initials = `${contact.fname ? contact.fname[0] : ''}${contact.lname ? contact.lname[0] : ''}`.toUpperCase() || 'U';
        document.getElementById('activeChatAvatar').style.display = 'none';
        
        // Let's create initials block for header avatar
        let avatarContainer = document.getElementById('activeChatInitialsAvatar');
        if (!avatarContainer) {
            avatarContainer = document.createElement('div');
            avatarContainer.id = 'activeChatInitialsAvatar';
            avatarContainer.className = 'w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-slate-200 uppercase';
            document.getElementById('activeChatAvatar').parentNode.insertBefore(avatarContainer, document.getElementById('activeChatAvatar'));
        }
        avatarContainer.textContent = initials;

        document.getElementById('activeChatName').textContent = `${contact.fname || contact.firstName} ${contact.lastName || contact.lastName}`;
        
        const roleTag = document.getElementById('activeChatRoleTag');
        roleTag.textContent = contact.role;
        if (contact.role === "ADMIN") roleTag.className = "px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[9px] font-bold tracking-wider uppercase";
        else if (contact.role === "WAREHOUSE_STAFF") roleTag.className = "px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold tracking-wider uppercase";
        else roleTag.className = "px-2 py-0.5 rounded bg-slate-800 text-slate-405 border border-slate-700/40 text-[9px] font-bold tracking-wider uppercase";

        const welcome = document.getElementById('welcomePanel');
        if (welcome) welcome.style.display = 'none';

        const chatPanel = document.getElementById('activeChatPanel');
        if (chatPanel) {
            chatPanel.classList.remove('opacity-0', 'pointer-events-none');
            chatPanel.classList.add('opacity-100');
        }

        document.body.classList.add('mobile-chat-active');

        await loadChatHistory(contactId);
    };

    window.closeMobileChat = function() {
        document.body.classList.remove('mobile-chat-active');
        activeContact = null;
        renderContacts(allContacts);
    };

    window.openBroadcastModal = function() {
        if (!broadcastModal) return;
        broadcastModal.classList.remove('hidden');
        setTimeout(() => {
            broadcastModal.classList.remove('opacity-0');
            const content = document.getElementById('broadcastModalContent');
            if (content) content.classList.remove('scale-95');
        }, 10);
    };

    window.closeBroadcastModal = function() {
        if (!broadcastModal) return;
        broadcastModal.classList.add('opacity-0');
        const content = document.getElementById('broadcastModalContent');
        if (content) content.classList.add('scale-95');
        setTimeout(() => {
            broadcastModal.classList.add('hidden');
        }, 300);
    };

    // Load Chat History
    async function loadChatHistory(contactId) {
        try {
            messagesContainer.innerHTML = `<div class="text-center py-8 text-xs text-slate-500 font-semibold">Loading conversation...</div>`;
            
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
        const bubbleBg = isMyMsg ? 'bg-amber-400 text-slate-950 rounded-tr-none' : 'bg-slate-900/60 text-slate-200 border border-slate-800/80 rounded-tl-none';
        const justify = isMyMsg ? 'justify-end' : 'justify-start';
        const formattedTime = Helpers.formatDate ? Helpers.formatDate(msg.sentAt) : new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const html = `
            <div class="flex ${justify} w-full animate-slide-up">
                <div class="max-w-[75%] md:max-w-[65%] space-y-1">
                    <div class="p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${bubbleBg}">
                        ${msg.messageText}
                    </div>
                    <span class="text-[9px] text-slate-500 font-semibold mt-1 block text-right px-1">${formattedTime}</span>
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
                    messageInput.style.height = 'auto'; // Reset textarea height
                } else {
                    alert('WebSocket connection is not active. Message could not be sent.');
                }
            });
        }

        // Enter key to submit textarea
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    chatForm.dispatchEvent(new Event('submit'));
                }
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
                    closeBroadcastModal();
                    broadcastMessage.value = '';
                    alert(`📢 Broadcast message published to role group: ${role}`);
                } else {
                    alert('WebSocket connection is not active. Broadcast could not be sent.');
                }
            });
        }
    }
});
