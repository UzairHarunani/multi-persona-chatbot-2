const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const app = express();

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Load .env for local development (optional)
try { require('dotenv').config(); } catch (_) {}

// Centralized config
const MODEL = process.env.MODEL;
const API_KEY = process.env.OPENAI_API_KEY || process.env.MPC_KEY;

if (!MODEL || !API_KEY) {
  console.error('Missing env vars: set MODEL and OPENAI_API_KEY (or MPC_KEY).');
  // don't exit here so the server can still serve static files, but /chat will return a helpful error
}

// Use multer for /chat route to handle multipart/form-data
app.post('/chat', upload.single('file'), async (req, res) => {
  console.log('POST /chat called');
  console.log('Received body:', req.body);
  const { message, persona } = req.body;
  const file = req.file; // file info if uploaded
  let fileContent = '';

  let fileLink = '';
  if (file) {
    // Only read text files for safety
    if (file.mimetype.startsWith('text/')) {
      fileContent = fs.readFileSync(path.join(__dirname, file.path), 'utf8');
      console.log('File content:', fileContent);
      // Provide a download link for the uploaded file
      fileLink = `/uploads/${file.filename}`;
    }
  }

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

  const userPrompt = fileContent
    ? `${message}\n\n[Attached file content:]\n${fileContent}`
    : message;

  // Require MODEL & API key
  if (!MODEL || !API_KEY) {
    console.error('MODEL or API key not configured.');
    return res.status(500).json({
      reply: 'Server misconfiguration: set MODEL and OPENAI_API_KEY (or MPC_KEY) environment variables.'
    });
  }

  try {
    // Build messages for the target API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    let response;
    // If using an OpenAI-style model id (gpt-...), call OpenAI API
    if (MODEL.toLowerCase().startsWith('gpt')) {
      response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: MODEL, messages },
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    } else {
      // Fallback to OpenRouter (or other) endpoint
      response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        { model: MODEL, messages },
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      );
    }

    const reply = response.data?.choices?.[0]?.message?.content
      || response.data?.choices?.[0]?.text
      || 'No reply from model.';
    res.json({ reply, fileName: file ? file.originalname : null, fileLink });
  } catch (err) {
    console.error('Error contacting AI:', err.response ? err.response.data : err.message || err);
    const providerError = err.response ? err.response.data : { message: err.message };
    res.status(500).json({
      reply: "Sorry, there was an error contacting the AI.",
      error: providerError
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('MODEL:', MODEL || 'Not set');
  console.log('API KEY:', API_KEY ? 'Loaded' : 'Not loaded');
});
