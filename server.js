const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Set your key in Render env vars

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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
    const reply = completion.choices[0].message.content;
    res.json({ reply, fileName: file ? file.originalname : null, fileLink });
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
