# Vercel 部署指南

本指南将帮助你将后端服务部署到 Vercel。

## 📋 前置要求

1. 一个 GitHub 账户
2. 一个 Vercel 账户（可在 [vercel.com](https://vercel.com) 免费注册）
3. 项目已推送到 GitHub 仓库

## 🚀 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**

   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录

2. **导入项目**

   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `bingSEO-AGENTs-lans`
   - 点击 "Import"

3. **配置项目**

   - **Framework Preset**: 选择 "Vite"（Vercel 会自动检测）
   - **Root Directory**: 保持默认（`.`）
   - **Build Command**: `npm run build`（Vercel 会自动检测）
   - **Output Directory**: `dist`（Vite 默认输出目录）
   - **Install Command**: `npm install`

   > **重要提示**:
   >
   > - Vercel 会自动检测 `api/` 目录中的 TypeScript 文件并部署为 serverless functions
   > - 前端代码已自动配置，在生产环境会使用相对路径 `/api/...` 调用后端 API
   > - **无需配置 `VITE_API_URL` 环境变量**，除非你需要使用不同的后端地址

4. **配置环境变量**
   在 "Environment Variables" 部分添加以下变量（如果需要覆盖默认值）：

   ```
   GEMINI_PROXY_URL=https://api.302.ai
   GEMINI_API_KEY=你的API密钥
   GEMINI_MODEL=gemini-2.5-flash
   THORDATA_API_TOKEN=你的Token
   THORDATA_API_URL=https://scraperapi.thordata.com/request
   ```

   > **注意**: 如果代码中已有默认值且你不需要修改，可以跳过这一步。

5. **部署**

   - 点击 "Deploy"
   - 等待部署完成（通常需要 1-2 分钟）

6. **获取部署 URL**
   - 部署完成后，你会得到一个 URL，例如：`https://your-project.vercel.app`
   - 你的 API 端点将是：
     - `https://your-project.vercel.app/api/generate-keywords`
     - `https://your-project.vercel.app/api/analyze-ranking`
     - `https://your-project.vercel.app/api/deep-dive-strategy`
     - `https://your-project.vercel.app/api/translate-prompt`
     - `https://your-project.vercel.app/api/translate-text`
     - `https://your-project.vercel.app/health`

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**

   ```bash
   vercel login
   ```

3. **在项目目录中部署**

   ```bash
   cd D:\bing-seo-agent
   vercel
   ```

4. **按照提示操作**

   - 选择项目范围
   - 确认项目设置
   - 如果需要，添加环境变量

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 🔧 项目结构说明

### API 目录结构（Vercel Serverless Functions）

项目已按照 Vercel 的标准结构改造：

```
api/
├── health.ts              # GET /health 或 /api/health
├── generate-keywords.ts   # POST /api/generate-keywords
├── analyze-ranking.ts     # POST /api/analyze-ranking
├── deep-dive-strategy.ts  # POST /api/deep-dive-strategy
├── translate-prompt.ts    # POST /api/translate-prompt
├── translate-text.ts      # POST /api/translate-text
└── _cors.ts               # CORS 辅助函数
```

每个 API 文件都是一个独立的 serverless function，Vercel 会自动识别和部署。

### vercel.json

简化的配置文件，只包含必要的路由重写：

- **rewrites**: 将 `/health` 重写到 `/api/health`

### server/index.ts

保留用于本地开发：

- **本地开发**: 使用 `npm run server` 启动 Express 服务器
- **Vercel 部署**: 使用 `api/` 目录下的独立 serverless functions

## 🧪 测试部署

部署完成后，测试健康检查端点：

```bash
# 方式 1: 使用重写路由
curl https://your-project.vercel.app/health

# 方式 2: 直接访问 API
curl https://your-project.vercel.app/api/health
```

应该返回：

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

测试 API 端点：

```bash
curl -X POST https://your-project.vercel.app/api/generate-keywords \
  -H "Content-Type: application/json" \
  -d '{
    "seedKeyword": "test",
    "targetLanguage": "en",
    "systemInstruction": "Generate SEO keywords"
  }'
```

## 🔄 自动部署

一旦配置完成，每次你推送到 GitHub 的 `main` 分支时，Vercel 会自动：

1. 检测到新的提交
2. 重新构建项目
3. 部署新版本

你可以在 Vercel Dashboard 中查看部署历史和日志。

## 📝 环境变量管理

### API 地址自动配置

前端代码已自动配置，会根据环境自动选择 API 地址：

- **开发环境** (`npm run dev`): 使用 `http://localhost:3001`
- **生产环境** (Vercel): 使用相对路径 `/api/...`（前端和后端在同一域名下）

**无需手动配置 `VITE_API_URL`**，除非你需要使用不同的后端地址。

### 后端环境变量

在 Vercel Dashboard 中设置后端所需的环境变量：

1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加以下变量并选择环境（Production, Preview, Development）：
   - `GEMINI_API_KEY` - Gemini API 密钥
   - `GEMINI_PROXY_URL` - Gemini 代理地址（可选，默认：`https://api.302.ai`）
   - `GEMINI_MODEL` - Gemini 模型（可选，默认：`gemini-2.5-flash`）
   - `THORDATA_API_TOKEN` - ThorData API Token（可选）
   - `THORDATA_API_URL` - ThorData API 地址（可选）

### 使用 Vercel CLI 设置

```bash
vercel env add GEMINI_API_KEY
# 然后输入值
```

## ⚠️ 注意事项

1. **冷启动**: Vercel 的 serverless functions 在长时间不活动后会有冷启动延迟（通常 < 1 秒）

2. **超时限制**:

   - Hobby 计划：10 秒
   - Pro 计划：60 秒
   - 如果 API 调用时间较长，可能需要升级计划

3. **文件系统**: Vercel 的 serverless functions 是只读的，不能写入文件系统

4. **环境变量**: 敏感信息（如 API 密钥）应该通过 Vercel Dashboard 设置，不要提交到 Git

## 🐛 故障排除

### 部署失败

- 检查构建日志中的错误信息
- 确保所有依赖都在 `package.json` 中
- 检查 TypeScript 编译错误

### API 返回 500 错误

- 查看 Vercel 的 Function Logs
- 检查环境变量是否正确设置
- 验证 API 密钥是否有效

### 路由不工作

- 确认 `vercel.json` 配置正确
- 检查路由路径是否匹配

## 📚 更多资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Node.js 运行时](https://vercel.com/docs/functions/runtimes/node-js)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
