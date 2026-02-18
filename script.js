// التحقق من تسجيل الدخول
window.addEventListener('load', function() {
    const username = localStorage.getItem('chatUsername');
    const room = localStorage.getItem('chatRoom');
    
    if (!username || !room) {
        window.location.href = 'index.html';
        return;
    }
    
    // تحميل البيانات
    initChat(username, room);
});

// تهيئة الدردشة
function initChat(username, room) {
    // عرض اسم الغرفة
    const roomNames = {
        'general': '💬 الغرفة العامة',
        'gaming': '🎮 غرفة الألعاب',
        'tech': '💻 غرفة التقنية',
        'sports': '⚽ غرفة الرياضة'
    };
    
    const roomIcons = {
        'general': '💬',
        'gaming': '🎮',
        'tech': '💻',
        'sports': '⚽'
    };
    
    document.getElementById('roomName').textContent = roomNames[room];
    document.getElementById('roomIcon').textContent = roomIcons[room];
    
    // تحميل الرسائل المحفوظة
    loadMessages(room);
    
    // تحديث قائمة المستخدمين
    updateUsersList();
    
    // رسالة ترحيب
    addSystemMessage(`مرحباً ${username}! 👋`);
    
    // مستمع للضغط على Enter
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // تحديث العد التنازلي للمستخدمين
    updateOnlineCount();
    setInterval(updateOnlineCount, 5000);
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const username = localStorage.getItem('chatUsername');
    const room = localStorage.getItem('chatRoom');
    
    const messageData = {
        username: username,
        message: message,
        time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        own: true
    };
    
    // إضافة الرسالة للواجهة
    addMessage(messageData);
    
    // حفظ الرسالة
    saveMessage(room, messageData);
    
    // تفريغ المدخل
    input.value = '';
    input.focus();
}

// إضافة رسالة للواجهة
function addMessage(data) {
    const container = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.own ? 'own' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${data.time}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// إضافة رسالة نظام
function addSystemMessage(text) {
    const container = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// حفظ الرسالة
function saveMessage(room, messageData) {
    let messages = JSON.parse(localStorage.getItem(`chat_${room}`) || '[]');
    messages.push(messageData);
    
    // الاحتفاظ بآخر 100 رسالة فقط
    if (messages.length > 100) {
        messages = messages.slice(-100);
    }
    
    localStorage.setItem(`chat_${room}`, JSON.stringify(messages));
}

// تحميل الرسائل
function loadMessages(room) {
    const messages = JSON.parse(localStorage.getItem(`chat_${room}`) || '[]');
    const username = localStorage.getItem('chatUsername');
    
    messages.forEach(msg => {
        msg.own = (msg.username === username);
        addMessage(msg);
    });
}

// تحديث قائمة المستخدمين
function updateUsersList() {
    const usersList = document.getElementById('usersList');
    
    // قائمة وهمية للتجربة
    const users = [
        'أحمد 🟢',
        'فاطمة 🟢',
        'محمد 🟢',
        'سارة 🟡',
        'يوسف 🟢'
    ];
    
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        usersList.appendChild(li);
    });
}

// تحديث عدد المستخدمين النشطين
function updateOnlineCount() {
    const count = Math.floor(Math.random() * 10) + 5;
    document.getElementById('onlineCount').textContent = count;
}

// toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('usersSidebar');
    sidebar.classList.toggle('active');
}

// toggle Emoji Picker
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
}

// إدراج emoji
function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
    toggleEmojiPicker();
}

// تسجيل خروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        const username = localStorage.getItem('chatUsername');
        addSystemMessage(`${username} غادر الدردشة 👋`);
        
        localStorage.removeItem('chatUsername');
        localStorage.removeItem('chatRoom');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// تأمين النص من XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// إضافة رسالة وهمية كل فترة (للتجربة)
setInterval(() => {
    const randomUsers = ['أحمد', 'فاطمة', 'محمد', 'سارة'];
    const randomMessages = [
        'مرحباً بالجميع! 👋',
        'كيف حالكم اليوم؟',
        'أخبار رائعة! 🎉',
        'من جرب المشروع الجديد؟',
        'هذا التطبيق رهيب! 🔥'
    ];
    
    const username = localStorage.getItem('chatUsername');
    const room = localStorage.getItem('chatRoom');
    
    if (Math.random() > 0.7 && username) {
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        const randomMsg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        
        if (randomUser !== username) {
            const messageData = {
                username: randomUser,
                message: randomMsg,
                time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                own: false
            };
            
            addMessage(messageData);
            saveMessage(room, messageData);
        }
    }
}, 15000); // كل 15 ثانية
```

**احفظه باسم:** `"script.js"`

---

## 📂 **وين تحط الملفات:**

### على الكمبيوتر:

1. **أنشئ مجلد جديد** على Desktop اسمه: `chat-app`

2. **حط الملفات داخله:**
```
   Desktop/
   └── chat-app/
       ├── index.html
       ├── chat.html
       ├── style.css
       └── script.js