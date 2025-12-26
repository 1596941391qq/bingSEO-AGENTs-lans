# ERR_CONNECTION_REFUSED 错误修复指南

## 🔍 错误原因

`ERR_CONNECTION_REFUSED` 表示前端无法连接到主应用的 API 服务器。常见原因：

1. **`VITE_MAIN_APP_URL` 环境变量未设置或设置错误**
   - 设置为 `localhost` 或本地地址
   - 设置为 `undefined` 或空字符串
   - URL 格式不正确

2. **主应用服务器不可用**
   - 主应用部署失败
   - 主应用域名变更
   - 网络连接问题

3. **CORS 配置问题**
   - 主应用未允许子应用的域名访问

## ✅ 快速修复步骤

### 1. 检查 Vercel 环境变量

在 Vercel Dashboard → Project Settings → Environment Variables 中：

```bash
# ✅ 正确设置（生产环境）
VITE_MAIN_APP_URL=https://niche-mining-web.vercel.app

# ❌ 错误示例（会导致 ERR_CONNECTION_REFUSED）
VITE_MAIN_APP_URL=http://localhost:3000
VITE_MAIN_APP_URL=localhost:3000
VITE_MAIN_APP_URL=undefined
VITE_MAIN_APP_URL=  # 空值
```

### 2. 使用 Vercel CLI 检查和设置

```bash
# 列出所有环境变量
vercel env ls

# 检查特定变量
vercel env pull .env.production
cat .env.production | grep VITE_MAIN_APP_URL

# 如果不存在或错误，设置正确的值
vercel env add VITE_MAIN_APP_URL production
# 输入: https://niche-mining-web.vercel.app

# 确保所有环境都设置了
vercel env add VITE_MAIN_APP_URL preview
vercel env add VITE_MAIN_APP_URL development
```

### 3. 验证主应用可访问性

在浏览器中测试主应用的 API：

```bash
# 测试主应用健康检查
curl https://niche-mining-web.vercel.app/api/health

# 应该返回类似：
# {"status":"ok","message":"Server is running"}
```

如果无法访问，说明主应用有问题，需要先修复主应用。

### 4. 检查浏览器控制台日志

部署后，在浏览器控制台查看：

```javascript
// 应该看到：
[AuthContext] Main app URL: https://niche-mining-web.vercel.app
[AuthContext] VITE_MAIN_APP_URL env: https://niche-mining-web.vercel.app
[AuthContext] Target API: https://niche-mining-web.vercel.app/api/auth/exchange-transfer-token

// ❌ 如果看到这些，说明配置错误：
[AuthContext] Main app URL: http://localhost:3000
[AuthContext] VITE_MAIN_APP_URL env: undefined
[AuthContext] Invalid or localhost URL detected, using default production URL
```

### 5. 重新部署

修改环境变量后，**必须重新部署**才能生效：

```bash
# 方式1: 通过 Vercel Dashboard
# 在项目页面点击 "Redeploy" → "Redeploy with existing Build Cache"

# 方式2: 通过 CLI
vercel --prod

# 方式3: 推送代码触发自动部署
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 🔧 代码改进

代码已添加以下改进：

1. **URL 验证和清理**
   - 自动检测并修复无效的 URL
   - 移除 `localhost` URL，使用默认生产 URL
   - 自动添加 `https://` 前缀（如果缺失）
   - 移除末尾斜杠

2. **错误处理和后备机制**
   - 连接失败时自动尝试本地 API
   - 详细的错误日志，便于排查问题
   - 优雅降级，不会阻塞应用启动

3. **详细日志**
   - 记录使用的 API URL
   - 记录环境变量值
   - 记录错误详情

## 📋 检查清单

- [ ] `VITE_MAIN_APP_URL` 已设置为生产环境 URL（`https://niche-mining-web.vercel.app`）
- [ ] 环境变量在所有环境（Production, Preview, Development）中都已设置
- [ ] 主应用可以正常访问（测试健康检查端点）
- [ ] 已重新部署应用（环境变量修改后必须重新部署）
- [ ] 浏览器控制台显示正确的 URL
- [ ] 清除浏览器缓存和 localStorage 后重新测试

## 🐛 常见问题

### Q: 为什么修改环境变量后还是报错？

A: 环境变量修改后必须重新部署才能生效。Vercel 在构建时注入环境变量，运行时不会自动更新。

### Q: 如何确认环境变量是否正确设置？

A: 
1. 在 Vercel Dashboard 中检查环境变量列表
2. 重新部署后，在浏览器控制台查看日志
3. 使用 `vercel env pull` 下载环境变量文件检查

### Q: 本地开发正常，但线上报错？

A: 
- 检查线上环境变量是否设置
- 确认使用的是生产环境的 URL，不是 `localhost`
- 检查主应用是否正常运行

### Q: 主应用 URL 是什么？

A: 默认是 `https://niche-mining-web.vercel.app`，如果你的主应用部署在不同的域名，需要更新 `VITE_MAIN_APP_URL`。

## 🔗 相关文档

- [SUBAPP_INTEGRATION_GUIDE.md](./SUBAPP_INTEGRATION_GUIDE.md) - 子应用集成指南
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 部署指南

