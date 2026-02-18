// ========== إعداد Firebase ==========
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyForTestingPurposes123456789",
    // ... 
};
```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-ZDe3_PRq2eSt-mgHiI3yKRIW32jvKfw",
  authDomain: "chat-app-7791c.firebaseapp.com",
  projectId: "chat-app-7791c",
  storageBucket: "chat-app-7791c.firebasestorage.app",
  messagingSenderId: "959302551896",
  appId: "1:959302551896:web:3dee4d03ff36a256947d2d",
  measurementId: "G-QPC8EZCGD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// ========== المتغيرات العامة ==========

let currentUser = {
    id: localStorage.getItem('userId'),
    username: localStorage.getItem('chatUsername'),
    room: localStorage.getItem('chatRoom')
};

let isTyping = false;
let typingTimeout;

// ========== التحقق من تسجيل الدخول ==========

window.addEventListener('load', function() {
    if (!currentUser.id || !currentUser.username || !currentUser.room) {
        window.location.href = 'index.html';
        return;
    }
    
    initializeChat();
});

// ========== تهيئة الدردشة ==========

function initializeChat() {
    // عرض معلومات الغرفة
    const roomData = {
        'general': { name: '💬 الغرفة العامة', icon: '💬' },
        'gaming': { name: '🎮 عشاق الألعاب', icon: '🎮' },
        'tech': { name: '💻 التقنية والبرمجة', icon: '💻' },
        'sports': { name: '⚽ الرياضة', icon: '⚽' },
        'movies': { name: '🎬 الأفلام والمسلسلات', icon: '🎬' },
        'music': { name: '🎵 الموسيقى', icon: '🎵' }
    };
    
    const room = roomData[currentUser.room];
    document.getElementById('roomName').textContent = room.name;
    document.getElementById('roomIcon').textContent = room.icon;
    
    // تسجيل المستخدم كمتصل
    registerUser();
    
    // الاستماع للرسائل الجديدة
    listenForMessages();
    
    // الاستماع للمستخدمين المتصلين
    listenForUsers();
    
    // الاستماع لحالة الكتابة
    listenForTyping();
    
    // إرسال رسالة ترحيب
    addSystemMessage(`${currentUser.username} انضم للدردشة 👋`);
    
    // مستمع لحقل الإدخال
    const messageInput = document.getElementById('messageInput');
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        
        // إرسال حالة الكتابة
        if (!isTyping) {
            isTyping = true;
            database.ref(`rooms/${currentUser.room}/typing/${currentUser.id}`).set({
                username: currentUser.username,
                timestamp: Date.now()
            });
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            database.ref(`rooms/${currentUser.room}/typing/${currentUser.id}`).remove();
        }, 1000);
    });
    
    // إزالة رسالة الترحيب بعد أول رسالة
    database.ref(`rooms/${currentUser.room}/messages`).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'none';
            }
        }
    });
}

// ========== تسجيل المستخدم ==========

function registerUser() {
    const userRef = database.ref(`rooms/${currentUser.room}/users/${currentUser.id}`);
    
    userRef.set({
        username: currentUser.username,
        status: 'online',
        lastSeen: Date.now()
    });
    
    // تحديث حالة المستخدم كل 30 ثانية
    setInterval(() => {
        userRef.update({
            lastSeen: Date.now()
        });
    }, 30000);
    
    // إزالة المستخدم عند الخروج
    userRef.onDisconnect().remove();
    
    // إزالة حالة الكتابة عند الخروج
    database.ref(`rooms/${currentUser.room}/typing/${currentUser.id}`).onDisconnect().remove();
}

// ========== إرسال رسالة ==========

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // إخفاء رسالة الترحيب
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            welcomeMsg.style.display = 'none';
        }, 300);
    }
    
    const messageData = {
        userId: currentUser.id,
        username: currentUser.username,
        message: message,
        timestamp: Date.now()
    };
    
    // إضافة الرسالة إلى Firebase
    database.ref(`rooms/${currentUser.room}/messages`).push(messageData);
    
    // مسح حقل الإدخال
    input.value = '';
    input.focus();
    
    // إزالة حالة الكتابة
    isTyping = false;
    database.ref(`rooms/${currentUser.room}/typing/${currentUser.id}`).remove();
}

// ========== الاستماع للرسائل ==========

function listenForMessages() {
    const messagesRef = database.ref(`rooms/${currentUser.room}/messages`);
    
    messagesRef.on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        addMessage(messageData);
    });
}

// ========== إضافة رسالة للواجهة ==========

function addMessage(data) {
    const messagesArea = document.getElementById('messagesArea');
    
    const isOwn = data.userId === currentUser.id;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString('ar-DZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const firstLetter = data.username.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
        <div class="message-wrapper">
            <div class="message-avatar">${firstLetter}</div>
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="message-username">${escapeHtml(data.username)}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">
                    ${escapeHtml(data.message)}
                </div>
            </div>
        </div>
    `;
    
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

// ========== إضافة رسالة نظام ==========

function addSystemMessage(text) {
    const messagesArea = document.getElementById('messagesArea');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

// ========== الاستماع للمستخدمين ==========

function listenForUsers() {
    const usersRef = database.ref(`rooms/${currentUser.room}/users`);
    
    usersRef.on('value', (snapshot) => {
        updateUsersList(snapshot.val());
    });
}

// ========== تحديث قائمة المستخدمين ==========

function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    const onlineCount = document.getElementById('onlineCount');
    
    if (!users) {
        usersList.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">لا يوجد مستخدمين</p>';
        onlineCount.textContent = '0';
        return;
    }
    
    const usersArray = Object.entries(users);
    onlineCount.textContent = usersArray.length;
    
    usersList.innerHTML = '';
    
    usersArray.forEach(([userId, userData]) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        const firstLetter = userData.username.charAt(0).toUpperCase();
        
        userDiv.innerHTML = `
            <div class="user-avatar">${firstLetter}</div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(userData.username)}</div>
                <div class="user-status">متصل الآن</div>
            </div>
        `;
        
        usersList.appendChild(userDiv);
    });
}

// ========== الاستماع لحالة الكتابة ==========

function listenForTyping() {
    const typingRef = database.ref(`rooms/${currentUser.room}/typing`);
    
    typingRef.on('value', (snapshot) => {
        const typingUsers = snapshot.val();
        const typingIndicator = document.getElementById('typingIndicator');
        
        if (!typingUsers) {
            typingIndicator.style.display = 'none';
            return;
        }
        
        // استبعاد المستخدم الحالي
        const otherTypingUsers = Object.entries(typingUsers)
            .filter(([userId]) => userId !== currentUser.id)
            .map(([_, data]) => data.username);
        
        if (otherTypingUsers.length > 0) {
            const typingText = otherTypingUsers.length === 1
                ? otherTypingUsers[0]
                : `${otherTypingUsers.length} مستخدمين`;
            
            typingIndicator.querySelector('.typing-user').textContent = typingText;
            typingIndicator.style.display = 'flex';
        } else {
            typingIndicator.style.display = 'none';
        }
    });
}

// ========== toggle Sidebar ==========

function toggleSidebar() {
    const sidebar = document.getElementById('usersSidebar');
    sidebar.classList.toggle('active');
}

// ========== toggle Emoji Picker ==========

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('active');
}

function closeEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.remove('active');
}

// ========== إدراج Emoji ==========

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
    
    closeEmojiPicker();
}

// ========== تسجيل خروج ==========

function logout() {
    if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        return;
    }
    
    // إرسال رسالة مغادرة
    addSystemMessage(`${currentUser.username} غادر الدردشة 👋`);
    
    // حذف المستخدم من القائمة
    database.ref(`rooms/${currentUser.room}/users/${currentUser.id}`).remove();
    
    // حذف حالة الكتابة
    database.ref(`rooms/${currentUser.room}/typing/${currentUser.id}`).remove();
    
    // مسح البيانات المحلية
    localStorage.removeItem('chatUsername');
    localStorage.removeItem('chatRoom');
    localStorage.removeItem('userId');
    
    // الانتقال لصفحة الدخول
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// ========== وظائف مساعدة ==========

function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== تنظيف الرسائل القديمة ==========

// حذف الرسائل الأقدم من 24 ساعة كل ساعة
setInterval(() => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    database.ref(`rooms/${currentUser.room}/messages`)
        .orderByChild('timestamp')
        .endAt(oneDayAgo)
        .once('value', (snapshot) => {
            snapshot.forEach((child) => {
                child.ref.remove();
            });
        });
}, 60 * 60 * 1000); // كل ساعة

// ========== Animation للـ fadeOut ==========

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

