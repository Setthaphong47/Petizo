// Chat Popup Functionality
document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    
    // Create chat popup HTML
    const chatPopup = document.createElement('div');
    chatPopup.innerHTML = `
        <div class="chat-widget" id="chat-widget">
            <div class="chat-button" onclick="toggleChat()">
                <i class="fas fa-comments"></i>
            </div>
            <div class="chat-popup" id="chat-popup">
                <div class="chat-header">
                    <span>🐾 AI CAT Chatbot</span>
                    <button class="close-chat" onclick="toggleChat()">×</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message ai-message">
                        สวัสดีค่ะ! AI CAT ยินดีให้คำแนะนำการดูแลน้องแมวค่ะ 🐱
                    </div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chat-input-field" placeholder="พิมพ์คำถามเกี่ยวกับการดูแลแมว...">
                    <button onclick="sendChatMessage()" class="send-button">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    body.appendChild(chatPopup);

    // Add event listener for Enter key
    document.getElementById('chat-input-field').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
});

let isChatOpen = false;

function toggleChat() {
    const popup = document.getElementById('chat-popup');
    const widget = document.getElementById('chat-widget');
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        popup.style.display = 'flex';
        widget.classList.add('open');
        document.getElementById('chat-input-field').focus();
    } else {
        popup.style.display = 'none';
        widget.classList.remove('open');
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    const message = input.value.trim();
    
    if (message === '') return;
    
    const messages = document.getElementById('chat-messages');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = message;
    messages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Auto scroll to bottom
    messages.scrollTop = messages.scrollHeight;
    
    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message ai-message loading';
    loadingMessage.textContent = 'กำลังพิมพ์...';
    messages.appendChild(loadingMessage);
    
    // Send message to backend API
    const token = localStorage.getItem('token');
    if (!token) {
        // remove loading and prompt login
        messages.removeChild(loadingMessage);
        const warn = document.createElement('div');
        warn.className = 'message ai-message';
        warn.textContent = 'กรุณาเข้าสู่ระบบเพื่อใช้งาน Chatbot';
        messages.appendChild(warn);
        messages.scrollTop = messages.scrollHeight;
        return;
    }

    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
    })
    .then(r => r.json())
    .then(data => {
        if (loadingMessage.parentNode) messages.removeChild(loadingMessage);

        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai-message';
        aiMessage.textContent = data.response || 'ขออภัย ระบบไม่มีคำตอบจาก AI';
        messages.appendChild(aiMessage);
        messages.scrollTop = messages.scrollHeight;
    })
    .catch(err => {
        console.error('Chat fetch error', err);
        if (loadingMessage.parentNode) messages.removeChild(loadingMessage);
        const errDiv = document.createElement('div');
        errDiv.className = 'message ai-message';
        errDiv.textContent = 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ';
        messages.appendChild(errDiv);
        messages.scrollTop = messages.scrollHeight;
    });
}