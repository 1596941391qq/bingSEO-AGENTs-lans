import { KeywordData, IntentType, ProbabilityLevel, SEOStrategyReport, TargetLanguage } from "../../types.js";
import { getBingSerpData, parseSerpResponse } from "./thordata.js";

const PROXY_BASE_URL = process.env.GEMINI_PROXY_URL || 'https://api.302.ai';
const API_KEY = process.env.GEMINI_API_KEY || 'sk-BMlZyFmI7p2DVrv53P0WOiigC4H6fcgYTevils2nXkW0Wv9s';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function callGeminiAPI(prompt: string, systemInstruction?: string, config?: any) {
  const url = `${PROXY_BASE_URL}/v1/v1beta/models/${config?.model || MODEL}:generateContent`;

  const contents: any[] = [];
  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: systemInstruction }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody: any = {
    contents: contents,
    generationConfig: {
      maxOutputTokens: 8192
    }
  };

  if (config?.responseMimeType === 'application/json') {
    if (!prompt.includes('JSON') && !prompt.includes('json')) {
      contents[contents.length - 1].parts[0].text += '\n\nPlease respond with valid JSON only, no markdown formatting.';
    }
    if (config?.responseSchema) {
      requestBody.generationConfig.responseSchema = config.responseSchema;
      requestBody.generationConfig.responseMimeType = 'application/json';
    }
  }

  try {
    console.log('调用 302.ai 代理 API:', url);
    console.log('使用模型:', config?.model || MODEL);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 响应错误:', response.status, errorText);
      throw new Error(`API 请求失败: ${response.status} ${errorText}`);
    }

    const data: any = await response.json();
    let content = '';

    if (data.error) {
      console.error('API 返回错误:', data.error);
      throw new Error(`API 错误: ${data.error}`);
    }

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        content = candidate.content.parts[0].text || '';
      }
    }

    if (!content && data.output) {
      content = data.output;
    }

    if (!content) {
      console.warn('⚠️  API 响应中没有找到文本内容');
      console.log('响应结构:', JSON.stringify(data, null, 2).substring(0, 500));
      throw new Error('API 响应中没有找到文本内容');
    }

    return {
      text: content,
      raw: data,
    };
  } catch (error: any) {
    console.error('调用 Gemini API 失败:', error);
    throw error;
  }
}

const getLanguageName = (code: TargetLanguage): string => {
  switch (code) {
    case 'en': return 'English';
    case 'fr': return 'French';
    case 'ru': return 'Russian';
    case 'ja': return 'Japanese';
    case 'ko': return 'Korean';
    case 'pt': return 'Portuguese';
    case 'id': return 'Indonesian';
    case 'es': return 'Spanish';
    case 'ar': return 'Arabic';
    default: return 'English';
  }
};

export const translatePromptToSystemInstruction = async (userPrompt: string): Promise<string> => {
  const response = await callGeminiAPI(
    `Translate and optimize the following prompt into a high-quality System Instruction for an AI SEO Agent targeting Google Search. Keep the instruction in English for better model performance:\n\n"${userPrompt}"`
  );
  return response.text || userPrompt;
};

export const translateText = async (text: string, targetLanguage: 'zh' | 'en'): Promise<string> => {
  const langName = targetLanguage === 'zh' ? 'Chinese' : 'English';
  const response = await callGeminiAPI(
    `Translate the following system instruction text into ${langName} for reference purposes. Preserve the original meaning and formatting:\n\n${text}`
  );
  return response.text || text;
};

/**
 * Step 1: Generate Keywords
 */
export const generateKeywords = async (
  seedKeyword: string,
  targetLanguage: TargetLanguage,
  systemInstruction: string,
  existingKeywords: string[] = [],
  roundIndex: number = 1
): Promise<KeywordData[]> => {
  const targetLangName = getLanguageName(targetLanguage);

  let promptContext = "";

  if (roundIndex === 1) {
    promptContext = `Generate 10 high-potential ${targetLangName} SEO keywords for the seed term: "${seedKeyword}". Focus on commercial and informational intent.

Return a JSON array with objects containing:
- keyword: The keyword in ${targetLangName}
- translation: Meaning in English/Chinese
- intent: One of "Informational", "Transactional", "Local", "Commercial"
- volume: Estimated monthly searches (number)

Example format:
[{"keyword": "example", "translation": "示例", "intent": "Informational", "volume": 1000}]`;
  } else {
    promptContext = `
The user is looking for "Blue Ocean" opportunities in the ${targetLangName} market. 
We have already generated these: ${existingKeywords.slice(-20).join(', ')}.

CRITICAL: Do NOT generate similar words.
Think LATERALLY. Use the "SCAMPER" method.
Example: If seed is "AI Pet Photos", think "Pet ID Cards", "Fake Dog Passport", "Cat Genealogy".

Generate 10 NEW, UNEXPECTED, but SEARCHABLE keywords related to "${seedKeyword}" in ${targetLangName}.

Return a JSON array with objects containing:
- keyword: The keyword in ${targetLangName}
- translation: Meaning in English/Chinese
- intent: One of "Informational", "Transactional", "Local", "Commercial"
- volume: Estimated monthly searches (number)`;
  }

  try {
    const response = await callGeminiAPI(promptContext, systemInstruction, {
      responseMimeType: "application/json"
    });

    let text = response.text || "[]";
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    const rawData = JSON.parse(text);

    return rawData.map((item: any, index: number) => ({
      ...item,
      id: `kw-${Date.now()}-${index}`,
      targetLanguage: targetLanguage,
    }));
  } catch (error: any) {
    console.error("Generate Keywords Error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      cause: error?.cause,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n')
    });
    return [];
  }
};

/**
 * Step 2: Analyze Keywords (Batched Parallel Execution for Stability)
 */
export const analyzeRankingProbability = async (
  keywords: KeywordData[],
  systemInstruction: string,
  uiLanguage: 'zh' | 'en',
  targetLanguage: string
): Promise<KeywordData[]> => {

  const analyzeSingleKeyword: (keywordData: KeywordData, lang: string) => Promise<KeywordData> = async (
    keywordData: KeywordData,
    targetLang: string
  ) => {
    try {
      // 1. 获取真实的Bing SERP数据
      let realSerpData = null;
      let serpSnippets: any[] = [];
      let resultCount = -1;
      let topDomainType = 'Unknown';

      try {
        const lang = targetLang || keywordData.targetLanguage || 'en';
        realSerpData = await getBingSerpData(keywordData.keyword, lang);
        const parsed = parseSerpResponse(realSerpData);
        serpSnippets = parsed.serpSnippets;
        resultCount = parsed.resultCount;
        topDomainType = parsed.topDomainType;
      } catch (serpError) {
        console.warn(`获取SERP数据失败，使用AI估计: ${serpError}`);
        // SERP获取失败时，继续使用AI分析
      }

      // 2. 构建包含真实SERP数据的分析提示
      const serpContext = realSerpData ? `
REAL BING SERP DATA:
- Total Results Found: ${resultCount}
- Top Domain Type: ${topDomainType}
- Top 3 Results: ${serpSnippets.map((s: any, i: number) => `${i+1}. ${s.title} (${s.url})`).join('; ')}

Use this REAL data to make your analysis more accurate.` : `No real SERP data available, use your knowledge to estimate.`;

      const isZh = uiLanguage === 'zh';
      const fullSystemInstruction = `
${systemInstruction}

TASK: ${isZh ? `分析关键词 "${keywordData.keyword}" 的 Bing SERP 竞争度。` : `Analyze the Bing SERP competition for the keyword: "${keywordData.keyword}".`}

${serpContext}

${isZh ? `根据以上真实数据（如有）或您的知识分析：
请注意：Bing首页通常显示10个结果，这是正常数量。

重点分析：
1. **结果数量**：如果少于10个结果（<10），这是蓝海机会。
2. **结果相关性**：首页结果是否与搜索词高度相关？如果有大量不相关结果，说明竞争弱。
3. **页面权威性**：首页结果是否是论坛帖子（Reddit、Quora）、社交媒体、文章、博客等低权威性页面？

评分标准：
- **HIGH (高概率)**:
  • 结果数量 < 10个（蓝海机会）
  • 首页是论坛、社交媒体、文章、博客等低权威性页面
  • 大量结果与搜索词不相关

- **MEDIUM (中概率)**:
  • 有竞争但非完全饱和
  • 首页有混合结果（部分权威网站 + 部分弱页面）

- **LOW (低概率)**:
  • 首页全是维基百科、政府/教育机构(.gov/.edu)、大品牌网站（Amazon等）
  • 专业领域权威网站占据首页
  • 所有结果都与搜索词高度相关且优化良好

返回 JSON 对象（reasoning 字段请直接用 ${uiLanguage === 'zh' ? '中文' : 'English'} 解释）：
{
  "probability": "High" | "Medium" | "Low",
  "reasoning": "用 ${uiLanguage === 'zh' ? '中文' : 'English'} 解释的分析依据，重点说明为什么这个结果数量和相关性值得这个评分"
}` : `Based on the real SERP data above (if available) or your knowledge, analyze:

IMPORTANT: Bing typically shows exactly 10 results on page 1, which is NORMAL. Do NOT consider 10 results as "few".

Key Analysis Points:
1. **RESULT COUNT**: If there are FEWER than 10 results (<10), this is a Blue Ocean opportunity.
2. **RELEVANCE**: Are the top results highly relevant to the search query? Many irrelevant results indicate weak competition.
3. **PAGE AUTHORITY**: Are the top results low-authority pages like forum posts (Reddit, Quora), social media, articles, or blogs?

SCORING:
- **HIGH Probability**:
  • Result count < 10 (Blue Ocean)
  • Top results are low-authority: forums, social media, articles, blogs
  • Many results are irrelevant to the search query

- **MEDIUM Probability**:
  • Moderate competition, not fully saturated
  • Mixed results on page 1 (some authority sites + some weak pages)

- **LOW Probability**:
  • Top results are Wikipedia, Government/Educational sites (.gov/.edu), Big Brands (Amazon, etc.)
  • Authority sites dominate the entire page
  • All results are highly relevant and well-optimized

Return a JSON object:
{
  "probability": "High" | "Medium" | "Low",
  "reasoning": "explanation in ${uiLanguage === 'zh' ? 'Chinese' : 'English'} focusing on result count, relevance, and authority of competing pages"
}`}`;

      // 3. 使用Gemini分析竞争度
      const response = await callGeminiAPI(
        `Analyze Bing SERP competition for: ${keywordData.keyword}`,
        fullSystemInstruction,
        { responseMimeType: "application/json" }
      );

      let text = response.text || "{}";
      text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error:", text);
        analysis = {
          probability: "Medium",
          reasoning: "AI分析解析失败，默认中等概率"
        };
      }

      // 4. 基于真实数据调整结果（如果API返回的resultCount是有效数字）
      if (resultCount >= 0 && resultCount < 10) {
        // 少于10个结果是真正的蓝海机会
        analysis.probability = "HIGH";
        analysis.reasoning = `${isZh ? `🌊 蓝海机会！仅发现 ${resultCount} 个搜索结果（正常首页应有10个）。` : `🌊 Blue Ocean opportunity! Only ${resultCount} results found (normal page has 10).`} ${analysis.reasoning}`;
      } else if (topDomainType === 'Forum/Social' || topDomainType === 'Niche Site') {
        // 如果首页是论坛或利基网站，提升概率
        if (analysis.probability === 'MEDIUM') {
          analysis.probability = "HIGH";
          analysis.reasoning = `${isZh ? `基于SERP数据：首页主要是论坛/利基网站，竞争较弱。` : `Based on SERP: Top results are forums/niche sites, indicating weak competition.`} ${analysis.reasoning}`;
        }
      } else if (topDomainType === 'Gov/Edu' || topDomainType === 'Big Brand') {
        // 如果首页是政府/大品牌，降低概率
        if (analysis.probability === 'MEDIUM') {
          analysis.probability = "LOW";
          analysis.reasoning = `${isZh ? `基于SERP数据：首页是政府/大品牌网站，竞争极强。` : `Based on SERP: Top results are Gov/Edu/Big Brands, very strong competition.`} ${analysis.reasoning}`;
        }
      }

      return {
        ...keywordData,
        serpResultCount: resultCount,
        topDomainType: topDomainType as any,
        probability: analysis.probability === 'High' ? ProbabilityLevel.HIGH : 
                    analysis.probability === 'Medium' ? ProbabilityLevel.MEDIUM : ProbabilityLevel.LOW,
        reasoning: analysis.reasoning || "AI分析完成",
        topSerpSnippets: serpSnippets
      };

    } catch (error) {
      console.error(`分析关键词失败 ${keywordData.keyword}:`, error);
      return {
        ...keywordData,
        probability: ProbabilityLevel.LOW,
        reasoning: "分析失败（API错误或超时）。",
        topDomainType: "Unknown",
        serpResultCount: -1,
        topSerpSnippets: []
      };
    }
  };

  const results: KeywordData[] = [];
  const BATCH_SIZE = 3;

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(k => {
      const lang = k.targetLanguage || targetLanguage || 'en';
      return analyzeSingleKeyword(k, lang);
    }));
    results.push(...batchResults);

    if (i + BATCH_SIZE < keywords.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

/**
 * Step 3: Deep Dive Strategy Report
 */
export const generateDeepDiveStrategy = async (
  keyword: KeywordData,
  uiLanguage: 'zh' | 'en',
  targetLanguage: TargetLanguage
): Promise<SEOStrategyReport> => {
  const uiLangName = uiLanguage === 'zh' ? 'Chinese' : 'English';
  const targetLangName = getLanguageName(targetLanguage);

  const prompt = `
You are a Strategic SEO Content Manager for Google ${targetLangName}. 
Create a detailed Content Strategy Report for the keyword: "${keyword.keyword}".

Target Language: ${targetLangName}
User Interface Language: ${uiLangName}

Your goal is to outline a page that WILL rank #1 on Google.

Requirements:
1. Page Title (H1): Optimized for CTR and SEO in ${targetLangName}. Provide ${uiLangName} translation.
2. URL Slug: SEO friendly (English characters preferred).
3. User Intent Summary: What is the user looking for? (Write in ${uiLangName})
4. Content Structure: List 3-5 H2 headers (${targetLangName}). Provide ${uiLangName} translations.
5. Long-tail Keywords: Generate 5 specific long-tail variations (${targetLangName}). Provide ${uiLangName} translations.
6. Word Count: Recommended length.

Return a JSON object:
{
  "targetKeyword": "string",
  "pageTitleH1": "H1 in ${targetLangName}",
  "pageTitleH1_trans": "translation in ${uiLangName}",
  "metaDescription": "160 chars max in ${targetLangName}",
  "metaDescription_trans": "translation in ${uiLangName}",
  "urlSlug": "seo-friendly-slug",
  "userIntentSummary": "string",
  "contentStructure": [
    {"header": "H2 in ${targetLangName}", "header_trans": "trans", "description": "guide", "description_trans": "trans"}
  ],
  "longTailKeywords": ["keyword1", "keyword2"],
  "longTailKeywords_trans": ["trans1", "trans2"],
  "recommendedWordCount": 2000
}`;

  try {
    const response = await callGeminiAPI(prompt, undefined, {
      responseMimeType: "application/json"
    });

    let text = response.text || "{}";
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Deep Dive Error:", error);
    throw new Error("Failed to generate strategy report.");
  }
};

export const DEFAULT_GEN_PROMPT_EN = `
You are a Senior SEO Specialist for Google Search.
Your task is to generate a comprehensive list of high-potential keywords in the target language.

Rules:
1. **Grammar**: Ensure perfect grammar and native phrasing for the target language.
2. **Intent**: Mix Informational (How-to, guide) and Commercial (Best, Review, Buy).
3. **LSI**: Include synonyms and semantically related terms.
4. **Volume**: Estimate realistic monthly search volume for Google.
`;

export const DEFAULT_ANALYZE_PROMPT_EN = `
You are a Google SERP Analysis AI.
Estimate "Page 1 Probability" based on COMPETITION STRENGTH.

**High Probability Indicators**:
- Top results are Forums (Reddit, Quora), Social Media, or PDF files.
- Top results do not have the keyword in the Title tag.
- Very few results (< 20) in total index.

**Low Probability Indicators**:
- Top results are Wikipedia, Government sites, or Major Brands (Amazon, etc).
- Top results are highly optimized niche authority sites.
- Exact match optimized pages.
`;
