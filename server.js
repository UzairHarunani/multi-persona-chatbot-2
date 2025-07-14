const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const personas = {
  therapist: msg => `As your therapist, I hear you say: "${msg}". How does that make you feel?`,
  chef: msg => `As a chef: "${msg}" sounds delicious! Would you like a recipe or cooking tip?`,
  coach: msg => `As your sports coach: "${msg}" shows great determination. Let's train harder and smarter!`,
  comedian: msg => `Here's a joke: Why did "${msg}" cross the road? To get to the punchline!`,
  teacher: msg => `As your teacher: "${msg}" is a great question! Let's break it down together.`,
  techexpert: msg => `As a tech expert: "${msg}" is an interesting tech topic. Would you like advice or an explanation?`,
  doctor: msg => `As your doctor: "${msg}" is important for your health. Please provide more details about your symptoms.`,
  pharmacist: msg => `As your pharmacist: "${msg}" is important for your medication and health. Would you like advice on prescriptions or over-the-counter medicines?`,
  financer: msg => `As a finance expert: "${msg}" is a smart financial consideration. Would you like budgeting or investment tips?`,
  businessman: msg => `As a business person: "${msg}" is a key business insight. Let's discuss strategies for success.`,
  scientist: msg => `As a scientist: "${msg}" is a fascinating scientific topic. Would you like to know the latest research?`,
  historian: msg => `As a historian: "${msg}" has a rich history. Would you like to hear about its origins or impact?`
};

// Use multer for /chat route to handle multipart/form-data
app.post('/chat', upload.single('file'), async (req, res) => {
  console.log('POST /chat called');
  console.log('Received body:', req.body);
  const { message, persona } = req.body;
  const file = req.file; // file info if uploaded

  const personaPrompts = {
    therapist: "You are a compassionate therapist.",
    chef: "You are a friendly chef.",
    coach: "You are a motivational sports coach.",
    comedian: "You are a witty comedian.",
    teacher: "You are a knowledgeable and patient teacher.",
    techexpert: "You are a helpful technology expert.",
    doctor: "You are a caring and professional doctor.",
    pharmacist: "You are a knowledgeable and helpful pharmacist.",
    financer: "You are a smart finance expert.",
    businessman: "You are a successful business person.",
    scientist: "You are a curious and insightful scientist.",
    historian: "You are a knowledgeable historian."
  };
  const systemPrompt = personaPrompts[persona] || "You are a helpful assistant.";

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MPC_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Error contacting AI:', err.response ? err.response.data : err.message);
    res.json({ reply: "Sorry, there was an error contacting the AI." });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('API KEY:', process.env.MPC_KEY ? 'Loaded' : 'Not loaded');
});
