# API 结构说明

## 📁 项目结构

项目已按照 Vercel Serverless Functions 的标准结构进行改造：

```
bing-seo-agent/
├── api/                          # Vercel Serverless Functions
│   ├── health.ts                # 健康检查端点
│   ├── generate-keywords.ts     # 生成关键词
│   ├── analyze-ranking.ts       # 分析排名概率
│   ├── deep-dive-strategy.ts    # 深度策略报告
│   ├── translate-prompt.ts       # 翻译提示词
│   ├── translate-text.ts        # 翻译文本
│   └── _cors.ts                  # CORS 辅助函数
├── server/                       # 本地开发服务器（Express）
│   ├── index.ts                 # Express 服务器入口
│   └── services/                 # 业务逻辑服务
│       ├── gemini.ts            # Gemini API 服务
│       └── thordata.ts          # ThorData SERP 服务
└── vercel.json                   # Vercel 配置文件
```

## 🔄 双模式支持

### 本地开发模式
使用 Express 服务器，支持热重载：
```bash
npm run server
```
服务器运行在 `http://localhost:3001`

### Vercel 部署模式
使用独立的 serverless functions，每个 API 端点都是独立的函数：
- 自动部署到 Vercel
- 每个函数独立扩展
- 按需执行，节省资源

## 🌐 API 端点

### 健康检查
- **GET** `/health` 或 `/api/health`
- 返回服务器状态

### 生成关键词
- **POST** `/api/generate-keywords`
- 请求体：
  ```json
  {
    "seedKeyword": "string",
    "targetLanguage": "string",
    "systemInstruction": "string",
    "existingKeywords": ["string"],
    "roundIndex": number
  }
  ```

### 分析排名概率
- **POST** `/api/analyze-ranking`
- 请求体：
  ```json
  {
    "keywords": [KeywordData],
    "systemInstruction": "string",
    "uiLanguage": "zh" | "en",
    "targetLanguage": "string"
  }
  ```

### 深度策略报告
- **POST** `/api/deep-dive-strategy`
- 请求体：
  ```json
  {
    "keyword": "string",
    "uiLanguage": "string",
    "targetLanguage": "string"
  }
  ```

### 翻译提示词
- **POST** `/api/translate-prompt`
- 请求体：
  ```json
  {
    "prompt": "string"
  }
  ```

### 翻译文本
- **POST** `/api/translate-text`
- 请求体：
  ```json
  {
    "text": "string",
    "targetLanguage": "string"
  }
  ```

## 🔒 CORS 支持

所有 API 端点都支持 CORS，允许跨域请求：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## 📝 注意事项

1. **环境变量**: 在 Vercel Dashboard 中配置以下环境变量：
   - `GEMINI_API_KEY`
   - `GEMINI_PROXY_URL`
   - `GEMINI_MODEL`
   - `THORDATA_API_TOKEN`
   - `THORDATA_API_URL`

2. **类型定义**: 确保安装了 `@vercel/node` 类型定义：
   ```bash
   npm install --save-dev @vercel/node
   ```

3. **导入路径**: API 文件中使用 `.js` 扩展名导入 TypeScript 文件（ESM 模块要求）

4. **本地开发**: `server/index.ts` 保留用于本地开发，不影响 Vercel 部署

