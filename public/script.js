const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const personaSelect = document.getElementById('persona');
const fileInput = document.getElementById('file-input');

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

  if (!text && !file) return;

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

  addMessage(
    text || (file ? `Sent a file: ${file.name}` : ''),
    'user',
    '🧑'
  );
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
      // If a file was uploaded, show a link to it
      if (data.fileName && data.fileLink) {
        botMessage += `<br><a href="${data.fileLink}" target="_blank">Download: ${data.fileName}</a>`;
      }
      addMessage(botMessage, 'bot', personaAvatars[persona] || '🤖');
    })
    .catch(() => {
      removeTyping();
      addMessage("Sorry, there was an error contacting the server.", 'bot', '🤖');
    });
}