import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        reply: "Hey! Thanks for messaging us! Check out our link in bio for instant access or reply with your email ✨",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { chatHistory, userHandle, customerNote } = req.body || {};

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

    return res.status(200).json({
      reply: response.text?.trim() || 'Hey there! Thanks for reaching out. How can I help you today? 😊',
    });
  } catch (error) {
    console.error('Gemini serverless error:', error);
    return res.status(200).json({
      reply: "Hey! Thanks for messaging us! Check out our link in bio for instant access or reply with your email ✨",
    });
  }
}
