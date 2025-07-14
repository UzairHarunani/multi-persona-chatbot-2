const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const personas = {
  therapist: msg => `As your therapist, I hear you say: "${msg}". How does that make you feel?`,
  chef: msg => `As a chef: "${msg}" sounds delicious! Would you like a recipe or cooking tip?`,
  pirate: msg => `Arrr matey! "${msg}" be a fine thing to say on the high seas!`,
  coach: msg => `Coach here! "${msg}" shows great determination. Keep pushing forward!`,
  wizard: msg => `Ah, "${msg}"... A most magical thought! Shall I cast a spell for you?`,
  comedian: msg => `Here's a joke: Why did "${msg}" cross the road? To get to the punchline!`
};

app.post('/chat', async (req, res) => {
  console.log('POST /chat called');
  console.log('Received message:', req.body);
  const { message, persona } = req.body;

  const personaPrompts = {
    therapist: "You are a compassionate therapist.",
    chef: "You are a friendly chef.",
    pirate: "You are a funny pirate.",
    coach: "You are a motivational coach.",
    wizard: "You are a wise wizard.",
    comedian: "You are a witty comedian."
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
          'Authorization': 'Bearer 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',
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
});
