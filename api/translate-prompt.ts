import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translatePromptToSystemInstruction } from '../server/services/gemini.js';
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
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt field' });
    }

    const optimized = await translatePromptToSystemInstruction(prompt);

    res.json({ optimized });
  } catch (error: any) {
    console.error('Translate prompt error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate prompt' });
  }
}

