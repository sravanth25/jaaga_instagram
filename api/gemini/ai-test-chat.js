import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        reply: "Thanks for reaching out! Our team is available 9am-5pm EST, or reply with your email for priority response 🚀",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { userMessage, persona, faqs, systemPrompt } = req.body || {};

    const faqText = (faqs || [])
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
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

    return res.status(200).json({
      reply: response.text?.trim() || "Thanks for your message! Let me double check that for you.",
    });
  } catch (error) {
    console.error('Gemini test-chat error:', error);
    return res.status(200).json({
      reply: "Thanks for reaching out! Our team is available 9am-5pm EST, or reply with your email for priority response 🚀",
    });
  }
}
