# 线上环境配置检查清单

## 🔍 "Transfer token expired" 错误排查

如果线上环境出现 `{error: 'Transfer token expired'}` 错误，请按以下步骤检查：

### 1. 检查 Vercel 环境变量配置

在 Vercel Dashboard → Project Settings → Environment Variables 中，确保以下变量已正确设置：

#### 必需的环境变量（Production 环境）

```bash
# 主应用 URL（必须设置！）
VITE_MAIN_APP_URL=https://niche-mining-web.vercel.app

# 数据库连接（必须与主应用一致）
POSTGRES_URL=你的PostgreSQL连接字符串

# JWT 密钥（必须与主应用一致）
JWT_SECRET=你的JWT密钥

# 其他必需变量
GEMINI_API_KEY=你的Gemini API密钥
GEMINI_PROXY_URL=https://api.302.ai
GEMINI_MODEL=gemini-2.5-flash
```

#### 重要提示

1. **`VITE_MAIN_APP_URL`** 必须设置为生产环境的主应用地址

   - 默认值：`https://niche-mining-web.vercel.app`
   - 如果主应用地址不同，必须更新此变量

2. **`POSTGRES_URL` 和 `JWT_SECRET`** 必须与主应用完全一致

   - 这两个变量用于共享数据库和验证 JWT token
   - 如果不一致，会导致认证失败

3. **不要在生产环境启用开发模式**
   - `ENABLE_DEV_AUTO_LOGIN` 应该设置为 `false` 或不设置
   - `NODE_ENV` 应该设置为 `production` 或不设置

### 2. 验证环境变量是否生效

部署后，在浏览器控制台查看日志：

```javascript
// 应该看到类似这样的日志：
[AuthContext] Using API: https://niche-mining-web.vercel.app/api/auth/exchange-transfer-token
[AuthContext] Main app URL: https://niche-mining-web.vercel.app
```

如果看到 `Main app URL: undefined` 或错误的 URL，说明环境变量没有正确设置。

### 3. 检查主应用 API 端点

确认主应用的 API 端点路径正确：

- 正确的端点：`${VITE_MAIN_APP_URL}/api/auth/exchange-transfer-token`
- 如果主应用使用不同的路径，需要修改 `contexts/AuthContext.tsx`

### 4. Transfer Token 过期时间

Transfer Token 通常有 5 分钟的过期时间。如果用户：

- 点击主应用的链接后等待太久
- 刷新页面多次
- Token 在传递过程中被延迟

都可能导致 token 过期。

**解决方案**：

- 用户需要重新从主应用点击链接
- 确保网络连接正常，减少延迟

### 5. 检查主应用状态

确认主应用正常运行：

```bash
# 检查主应用健康状态
curl https://niche-mining-web.vercel.app/api/health

# 检查主应用的数据库连接
# （需要主应用提供健康检查端点）
```

### 6. 查看详细日志

在浏览器控制台查看完整的错误日志：

```javascript
[AuthContext] Exchange failed: {
  status: 401,
  statusText: "Unauthorized",
  error: { error: "Transfer token expired" },
  apiUrl: "https://niche-mining-web.vercel.app/api/auth/exchange-transfer-token",
  mainAppUrl: "https://niche-mining-web.vercel.app"
}
```

### 7. 使用 Vercel CLI 检查环境变量

```bash
# 列出所有环境变量
vercel env ls

# 检查特定环境变量
vercel env pull .env.production
cat .env.production | grep VITE_MAIN_APP_URL
```

### 8. 重新部署

修改环境变量后，需要重新部署才能生效：

```bash
# 方式1: 通过 Vercel Dashboard
# 在项目页面点击 "Redeploy"

# 方式2: 通过 CLI
vercel --prod
```

## 🔧 快速修复步骤

1. **检查并设置 `VITE_MAIN_APP_URL`**

   ```bash
   vercel env add VITE_MAIN_APP_URL production
   # 输入: https://niche-mining-web.vercel.app
   ```

2. **确认 `POSTGRES_URL` 和 `JWT_SECRET` 与主应用一致**

   ```bash
   vercel env ls
   # 对比主应用的环境变量
   ```

3. **重新部署**

   ```bash
   vercel --prod
   ```

4. **清除浏览器缓存和 localStorage**
   - 打开浏览器开发者工具
   - Application → Local Storage → 清除所有项
   - 刷新页面

## 📞 如果问题仍然存在

1. 检查主应用的日志，确认 transfer token 是否正常生成
2. 检查主应用的数据库连接是否正常
3. 确认主应用的 `sessions` 表结构是否正确
4. 检查网络连接和 CORS 配置

## 🔗 相关文档

- [SUBAPP_INTEGRATION_GUIDE.md](./SUBAPP_INTEGRATION_GUIDE.md) - 子应用集成指南
- [AUTH_SETUP_SIMPLE.md](./AUTH_SETUP_SIMPLE.md) - 认证设置指南
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 部署指南
