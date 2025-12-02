import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeRankingProbability } from '../server/services/gemini.js';
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
    const { keywords, systemInstruction, uiLanguage, targetLanguage } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0 || !systemInstruction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 如果没有提供 uiLanguage 和 targetLanguage，尝试从 keywords 中推断
    const uiLang = uiLanguage || (keywords[0]?.uiLanguage) || 'en';
    const targetLang = targetLanguage || (keywords[0]?.targetLanguage) || 'en';

    const analyzedKeywords = await analyzeRankingProbability(
      keywords,
      systemInstruction,
      uiLang as 'zh' | 'en',
      targetLang
    );

    res.json({ keywords: analyzedKeywords });
  } catch (error: any) {
    console.error('Analyze ranking error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze ranking' });
  }
}

