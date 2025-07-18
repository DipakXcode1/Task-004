// Global variables
let socket;
let currentUser = null;
let currentRoom = null;
let rooms = [];
let users = [];
let messages = {};
let typingTimeout = null;

// DOM elements
const authModal = document.getElementById('authModal');
const chatApp = document.getElementById('chatApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabBtns = document.querySelectorAll('.tab-btn');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
const roomsList = document.getElementById('roomsList');
const usersList = document.getElementById('usersList');
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const currentRoomName = document.getElementById('currentRoomName');
const roomParticipants = document.getElementById('roomParticipants');
const typingIndicator = document.getElementById('typingIndicator');
const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomModal = document.getElementById('createRoomModal');
const createRoomForm = document.getElementById('createRoomForm');
const fileUploadBtn = document.getElementById('fileUploadBtn');
const fileInput = document.getElementById('fileInput');
const notificationContainer = document.getElementById('notificationContainer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkAuthStatus();
});

// Event listeners
function initializeEventListeners() {
    // Auth tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    // Chat functionality
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', handleMessageKeypress);
    messageInput.addEventListener('input', handleTyping);
    createRoomBtn.addEventListener('click', showCreateRoomModal);
    createRoomForm.addEventListener('submit', handleCreateRoom);
    document.getElementById('cancelCreateRoom').addEventListener('click', hideCreateRoomModal);
    fileUploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideAuthModal();
        }
        if (e.target === createRoomModal) {
            hideCreateRoomModal();
        }
    });
}

// Tab switching
function switchTab(tabName) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}Form`).classList.add('active');
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeSocket();
            hideAuthModal();
            showChatApp();
        } else {
            showNotification('Login failed', data.error, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Failed to connect to server', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeSocket();
            hideAuthModal();
            showChatApp();
        } else {
            showNotification('Registration failed', data.error, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Failed to connect to server', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    if (socket) {
        socket.disconnect();
    }
    currentUser = null;
    currentRoom = null;
    showAuthModal();
    hideChatApp();
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // Validate token and get user info
        fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(response => {
            if (response.ok) {
                // Token is valid, initialize app
                initializeSocket();
                showChatApp();
            } else {
                localStorage.removeItem('token');
                showAuthModal();
            }
        }).catch(() => {
            localStorage.removeItem('token');
            showAuthModal();
        });
    } else {
        showAuthModal();
    }
}

// Socket.io functions
function initializeSocket() {
    const token = localStorage.getItem('token');
    socket = io();
    
    socket.emit('authenticate', token);
    
    socket.on('authenticated', (data) => {
        if (data.success) {
            loadInitialData();
        } else {
            localStorage.removeItem('token');
            showAuthModal();
        }
    });
    
    socket.on('user_status_change', (data) => {
        updateUserStatus(data.username, data.isOnline);
    });
    
    socket.on('new_message', (message) => {
        addMessage(message);
        if (message.sender !== currentUser.username) {
            showNotification('New message', `${message.sender}: ${message.content.substring(0, 30)}...`);
        }
    });
    
    socket.on('user_typing', (data) => {
        showTypingIndicator(data.username, data.isTyping);
    });
    
    socket.on('user_joined_room', (data) => {
        showNotification('User joined', `${data.username} joined the room`);
    });
    
    socket.on('user_left_room', (data) => {
        showNotification('User left', `${data.username} left the room`);
    });
    
    socket.on('notification', (data) => {
        showNotification('New message', `${data.sender}: ${data.content}`);
    });
}

// Data loading
async function loadInitialData() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Load users and rooms
        const [usersResponse, roomsResponse] = await Promise.all([
            fetch('/api/users', { headers }),
            fetch('/api/rooms', { headers })
        ]);
        
        users = await usersResponse.json();
        rooms = await roomsResponse.json();
        
        updateUsersList();
        updateRoomsList();
        
        // Join default room
        if (rooms.length > 0) {
            joinRoom(rooms[0].id);
        }
        
        currentUserSpan.textContent = currentUser.username;
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
}

// Room management
function updateRoomsList() {
    roomsList.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = 'room-item';
        roomElement.dataset.roomId = room.id;
        roomElement.innerHTML = `
            <div class="room-info">
                <div class="room-name">${room.name}</div>
                <div class="room-participants">${room.participants} participants</div>
            </div>
        `;
        
        roomElement.addEventListener('click', () => joinRoom(room.id));
        roomsList.appendChild(roomElement);
    });
}

function joinRoom(roomId) {
    if (currentRoom) {
        socket.emit('leave_room', currentRoom);
        document.querySelector(`[data-room-id="${currentRoom}"]`)?.classList.remove('active');
    }
    
    currentRoom = roomId;
    socket.emit('join_room', roomId);
    
    document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
    
    const room = rooms.find(r => r.id === roomId);
    currentRoomName.textContent = room ? room.name : 'Unknown Room';
    roomParticipants.textContent = `${room ? room.participants : 0} participants`;
    
    loadRoomMessages(roomId);
}

async function loadRoomMessages(roomId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/${roomId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const roomMessages = await response.json();
        messages[roomId] = roomMessages;
        
        displayMessages(roomMessages);
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

function handleCreateRoom(e) {
    e.preventDefault();
    
    const roomName = document.getElementById('roomName').value;
    const roomType = document.getElementById('roomType').value;
    
    const token = localStorage.getItem('token');
    
    fetch('/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: roomName,
            type: roomType
        })
    }).then(response => response.json())
    .then(newRoom => {
        rooms.push(newRoom);
        updateRoomsList();
        hideCreateRoomModal();
        document.getElementById('roomName').value = '';
        showNotification('Success', 'Room created successfully');
    }).catch(error => {
        showNotification('Error', 'Failed to create room');
    });
}

// Message handling
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentRoom) return;
    
    socket.emit('send_message', {
        roomId: currentRoom,
        content: content,
        type: 'text'
    });
    
    messageInput.value = '';
    hideTypingIndicator();
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleTyping() {
    if (!currentRoom) return;
    
    socket.emit('typing', {
        roomId: currentRoom,
        isTyping: true
    });
    
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    typingTimeout = setTimeout(() => {
        socket.emit('typing', {
            roomId: currentRoom,
            isTyping: false
        });
        hideTypingIndicator();
    }, 1000);
}

function addMessage(message) {
    if (!messages[message.roomId]) {
        messages[message.roomId] = [];
    }
    messages[message.roomId].push(message);
    
    if (currentRoom === message.roomId) {
        displayMessages(messages[message.roomId]);
    }
}

function displayMessages(messageList) {
    messagesList.innerHTML = '';
    
    messageList.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesList.appendChild(messageElement);
    });
    
    scrollToBottom();
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === currentUser.username ? 'own' : ''}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.sender.charAt(0).toUpperCase();
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerHTML = `
        <span class="message-sender">${message.sender}</span>
        <span class="message-time">${formatTime(message.timestamp)}</span>
    `;
    
    const text = document.createElement('div');
    text.className = 'message-text';
    
    if (message.type === 'file') {
        const fileInfo = JSON.parse(message.content);
        text.innerHTML = `
            <div class="message-file">
                <i class="fas fa-file"></i>
                <a href="${fileInfo.fileUrl}" target="_blank">${fileInfo.filename}</a>
            </div>
        `;
    } else {
        text.textContent = message.content;
    }
    
    content.appendChild(header);
    content.appendChild(text);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    return messageDiv;
}

// File upload
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentRoom) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            socket.emit('send_message', {
                roomId: currentRoom,
                content: JSON.stringify({
                    fileUrl: data.fileUrl,
                    filename: data.filename,
                    size: data.size
                }),
                type: 'file'
            });
        } else {
            showNotification('Upload failed', data.error, 'error');
        }
    } catch (error) {
        showNotification('Error', 'Failed to upload file', 'error');
    }
    
    fileInput.value = '';
}

// User management
function updateUsersList() {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        if (user.username !== currentUser.username) {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-status ${user.isOnline ? 'online' : 'offline'}"></div>
                <span>${user.username}</span>
            `;
            usersList.appendChild(userElement);
        }
    });
}

function updateUserStatus(username, isOnline) {
    const userElement = usersList.querySelector(`[data-username="${username}"]`);
    if (userElement) {
        const statusElement = userElement.querySelector('.user-status');
        statusElement.className = `user-status ${isOnline ? 'online' : 'offline'}`;
    }
}

// Typing indicator
function showTypingIndicator(username, isTyping) {
    if (isTyping) {
        typingIndicator.classList.remove('hidden');
        typingIndicator.querySelector('.typing-text').textContent = `${username} is typing...`;
    } else {
        hideTypingIndicator();
    }
}

function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// Notifications
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Modal functions
function showAuthModal() {
    authModal.classList.remove('hidden');
    chatApp.classList.add('hidden');
}

function hideAuthModal() {
    authModal.classList.add('hidden');
}

function showChatApp() {
    chatApp.classList.remove('hidden');
    authModal.classList.add('hidden');
}

function hideChatApp() {
    chatApp.classList.add('hidden');
}

function showCreateRoomModal() {
    createRoomModal.classList.remove('hidden');
}

function hideCreateRoomModal() {
    createRoomModal.classList.add('hidden');
} 