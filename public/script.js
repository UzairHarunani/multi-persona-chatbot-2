const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const personaSelect = document.getElementById('persona');
const fileInput = document.getElementById('file-input');

let chats = {}; // { chatId: { persona, messages: [...] } }
let currentChatId = null;

function generateChatId() {
  return 'chat_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

function startNewChat(persona) {
  currentChatId = generateChatId();
  chats[currentChatId] = { persona, messages: [] };
  renderSidebar();
  renderChat();
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '<h3>Chats</h3>';
  Object.keys(chats).forEach(chatId => {
    const chat = chats[chatId];
    const btn = document.createElement('button');
    btn.textContent = `${chat.persona} (${chatId})`;
    btn.onclick = () => {
      currentChatId = chatId;
      renderChat();
    };
    sidebar.appendChild(btn);
  });
}

function addMessage(text, sender, avatar) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.innerHTML = `
    <span class="avatar">${avatar}</span>
    <span class="bubble">${text}</span>
  `;
  chatbox.appendChild(msgDiv);
  msgDiv.scrollIntoView({ behavior: "smooth", block: "start" }); // Scroll so top of new message is at top of view
}

function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot typing';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `<span class="avatar">🤖</span><span class="bubble">Typing...</span>`;
  chatbox.appendChild(typingDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function removeTyping() {
  const typingDiv = document.getElementById('typing-indicator');
  if (typingDiv) typingDiv.remove();
}

sendBtn.onclick = sendMessage;
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  const persona = personaSelect.value;
  const file = fileInput.files[0];
  if (!currentChatId) startNewChat(persona);
  if (!text && !file) return;

  const personaAvatars = {
    therapist: '🧠', chef: '👨‍🍳', coach: '🏅', comedian: '🎤',
    teacher: '📚', techexpert: '💻', doctor: '🩺', pharmacist: '💊',
    financer: '💵', businessman: '💼', scientist: '🔬', historian: '🏛️'
  };

  // Save user message
  chats[currentChatId].messages.push({
    text: text || (file ? `Sent a file: ${file.name}` : ''),
    sender: 'user',
    avatar: '🧑'
  });
  renderChat();
  userInput.value = '';
  fileInput.value = '';
  showTyping();

  const formData = new FormData();
  formData.append('persona', persona);
  formData.append('message', text);
  if (file) formData.append('file', file);

  fetch('/chat', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      removeTyping();
      let botMessage = data.reply;
      if (data.fileName && data.fileLink) {
        botMessage += `<br><a href="${data.fileLink}" target="_blank">Download: ${data.fileName}</a>`;
      }
      chats[currentChatId].messages.push({
        text: botMessage,
        sender: 'bot',
        avatar: personaAvatars[persona] || '🤖'
      });
      renderChat();
    })
    .catch(() => {
      removeTyping();
      chats[currentChatId].messages.push({
        text: "Sorry, there was an error contacting the server.",
        sender: 'bot',
        avatar: '🤖'
      });
      renderChat();
    });
}

function renderChat() {
  chatbox.innerHTML = '';
  if (!currentChatId) return;
  chats[currentChatId].messages.forEach(msg => {
    addMessage(msg.text, msg.sender, msg.avatar);
  });
}

// On page load, start a chat with the default persona
window.onload = () => {
  startNewChat(personaSelect.value);
  renderSidebar();
};