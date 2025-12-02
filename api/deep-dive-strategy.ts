import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDeepDiveStrategy } from '../server/services/gemini.js';
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
    const { keyword, uiLanguage, targetLanguage } = req.body;

    if (!keyword || !uiLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report = await generateDeepDiveStrategy(keyword, uiLanguage, targetLanguage);

    res.json({ report });
  } catch (error: any) {
    console.error('Deep dive strategy error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate strategy report' });
  }
}

