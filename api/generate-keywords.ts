import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateKeywords } from '../server/services/gemini.js';
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
    const { seedKeyword, targetLanguage, systemInstruction, existingKeywords, roundIndex } = req.body;

    if (!seedKeyword || !targetLanguage || !systemInstruction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const keywords = await generateKeywords(
      seedKeyword,
      targetLanguage,
      systemInstruction,
      existingKeywords || [],
      roundIndex || 1
    );

    res.json({ keywords });
  } catch (error: any) {
    console.error('Generate keywords error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate keywords' });
  }
}

