import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translateText } from '../server/services/gemini.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const translated = await translateText(text, targetLanguage);

    res.json({ translated });
  } catch (error: any) {
    console.error('Translate text error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate text' });
  }
}

