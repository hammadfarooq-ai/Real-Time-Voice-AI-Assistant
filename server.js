const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();

console.log("Loaded API key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");
console.log("Current working dir:", process.cwd());


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/ask', async (req, res) => {
  try {
    const userText = req.body.text || "";
    if (!userText) return res.status(400).json({ error: "No text provided" });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful voice assistant. Keep replies short." },
        { role: "user", content: userText }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const assistantText = response.choices[0].message.content.trim();
    res.json({ reply: assistantText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
