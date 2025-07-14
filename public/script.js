const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const personaSelect = document.getElementById('persona');

function addMessage(text, sender, avatar) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.innerHTML = `
    <span class="avatar">${avatar}</span>
    <span class="bubble">${text}</span>
  `;
  chatbox.appendChild(msgDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
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
  if (!text) return;
  const persona = personaSelect.value;
  const personaAvatars = {
    therapist: '🧠',
    chef: '👨‍🍳',
    coach: '🏅',
    comedian: '🎤',
    teacher: '📚',
    techexpert: '💻',
    doctor: '🩺',
    pharmacist: '💊',
    financer: '💵',
    businessman: '💼',
    scientist: '🔬',
    historian: '🏛️'
  };
  addMessage(text, 'user', '🧑');
  userInput.value = '';
  showTyping();

  fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, persona })
  })
    .then(res => res.json())
    .then(data => {
      removeTyping();
      addMessage(data.reply, 'bot', personaAvatars[persona] || '🤖');
    })
    .catch(() => {
      removeTyping();
      addMessage("Sorry, there was an error contacting the server.", 'bot', '🤖');
    });
}