import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes
const INSTAGRAM_VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'jaaga_ig_verify';

// Health Check route
app.get('/api/ping', (req, res) => {
  res.status(200).json({ ok: true, msg: "pong", time: new Date().toISOString() });
});

// Meta (Facebook / Instagram) Webhook verification & handler
app.get(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook'], (req, res) => {
  const mode = req.query['hub.mode'] || req.query['mode'];
  const token = req.query['hub.verify_token'] || req.query['verify_token'];
  const challenge = req.query['hub.challenge'] || req.query['challenge'];

  if (mode === 'subscribe' && (token === INSTAGRAM_VERIFY_TOKEN || token === 'jaaga_ig_verify' || token === 'dmflow_verify_token_123')) {
    console.log('[Meta Webhook] Successfully verified webhook challenge token!');
    return res.status(200).send(challenge);
  } else {
    console.warn('[Meta Webhook] Verification failed. Expected token:', INSTAGRAM_VERIFY_TOKEN, 'Received token:', token);
    return res.status(403).send('Verification failed');
  }
});

app.post(['/api/ig/webhook', '/api/instagram/webhook', '/api/webhook'], (req, res) => {
  console.log('[Meta Webhook] Received webhook payload:', JSON.stringify(req.body, null, 2));
  return res.status(200).send('EVENT_RECEIVED');
});
app.post('/api/gemini/suggest-reply', async (req, res) => {
  try {
    const { chatHistory, userHandle, customerNote } = req.body;
    const ai = getAI();
    const prompt = `You are an expert Instagram DM customer service assistant for a creator/business account.
Suggest a polite, engaging, concise Instagram DM response (max 2-3 sentences, with appropriate emoji) for user @${userHandle || 'follower'}.
Conversation history:
${JSON.stringify(chatHistory || [])}
Customer note: ${customerNote || 'None'}

Provide only the reply message text. Do not add quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || 'Hey there! Thanks for reaching out. How can I help you today? 😊' });
  } catch (error: any) {
    console.error('Gemini suggest-reply error:', error);
    res.json({
      reply: "Hey! Thanks for messaging us! Check out our link in bio for instant access or reply with your email ✨",
    });
  }
});

app.post('/api/gemini/ai-test-chat', async (req, res) => {
  try {
    const { userMessage, persona, faqs, systemPrompt } = req.body;
    const ai = getAI();

    const faqText = (faqs || [])
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const prompt = `System Tone/Persona: ${persona || 'Friendly & Professional'}
Custom System Bio: ${systemPrompt || 'Official assistant for Instagram account.'}
Knowledge Base FAQ:
${faqText}

User message: "${userMessage}"

Respond naturally as the Instagram automated assistant. Keep response under 50 words, friendly, and accurate based on FAQ. If unknown, offer to connect them to human support. Do not add quotes around response.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ reply: response.text?.trim() || "Thanks for your message! Let me double check that for you." });
  } catch (error: any) {
    console.error('Gemini test-chat error:', error);
    res.json({
      reply: "Thanks for reaching out! Our team is available 9am-5pm EST, or reply with your email for priority response 🚀",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DMFlow server running on http://localhost:${PORT}`);
  });
}

startServer();
