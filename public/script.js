const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const personaSelect = document.getElementById('persona');
const fileInput = document.getElementById('file-input');

let chats = []; // [{ name, persona, messages: [...] }]
let currentChatIdx = null;

// Load chats from localStorage
function loadChats() {
  const saved = localStorage.getItem('chats');
  chats = saved ? JSON.parse(saved) : [];
}

// Save chats to localStorage
function saveChats() {
  localStorage.setItem('chats', JSON.stringify(chats));
}

function generateChatId() {
  return 'chat_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

function startNewChat(persona) {
  chats.push({
    name: "New Chat",
    persona,
    messages: []
  });
  currentChatIdx = chats.length - 1;
  saveChats();
  renderSidebar();
  renderChat();
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '<h3>Chats</h3>';
  chats.forEach((chat, idx) => {
    const btn = document.createElement('button');
    btn.className = (idx === currentChatIdx) ? 'active' : '';
    btn.textContent = chat.name;
    btn.onclick = () => {
      currentChatIdx = idx;
      renderSidebar();
      renderChat();
    };
    sidebar.appendChild(btn);

    // Edit button
    const editBtn = document.createElement('span');
    editBtn.textContent = ' ✏️';
    editBtn.style.cursor = 'pointer';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      const newName = prompt('Rename chat:', chat.name);
      if (newName && newName.trim()) {
        chat.name = newName.trim();
        saveChats();
        renderSidebar();
      }
    };
    btn.appendChild(editBtn);
  });

  // New Chat button
  const newBtn = document.createElement('button');
  newBtn.textContent = '+ New Chat';
  newBtn.onclick = () => startNewChat(personaSelect.value);
  sidebar.appendChild(newBtn);
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
  if (currentChatIdx === null) startNewChat(persona);
  if (!text && !file) return;

  const personaAvatars = {
    therapist: '🧠', chef: '👨‍🍳', coach: '🏅', comedian: '🎤',
    teacher: '📚', techexpert: '💻', doctor: '🩺', pharmacist: '💊',
    financer: '💵', businessman: '💼', scientist: '🔬', historian: '🏛️'
  };

  // Save user message
  chats[currentChatIdx].messages.push({
    text: text || (file ? `Sent a file: ${file.name}` : ''),
    sender: 'user',
    avatar: '🧑'
  });
  saveChats();
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
      chats[currentChatIdx].messages.push({
        text: botMessage,
        sender: 'bot',
        avatar: personaAvatars[persona] || '🤖'
      });
      saveChats();
      renderChat();
    })
    .catch(() => {
      removeTyping();
      chats[currentChatIdx].messages.push({
        text: "Sorry, there was an error contacting the server.",
        sender: 'bot',
        avatar: '🤖'
      });
      saveChats();
      renderChat();
    });
}

function renderChat() {
  chatbox.innerHTML = '';
  if (currentChatIdx === null || !chats[currentChatIdx]) return;
  chats[currentChatIdx].messages.forEach(msg => {
    addMessage(msg.text, msg.sender, msg.avatar);
  });
}

// When persona changes, start a new chat
personaSelect.onchange = () => startNewChat(personaSelect.value);

// On page load, load chats and show sidebar
window.onload = () => {
  loadChats();
  if (chats.length === 0) startNewChat(personaSelect.value);
  else currentChatIdx = 0;
  renderSidebar();
  renderChat();
};