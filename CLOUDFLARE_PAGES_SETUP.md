# Cloudflare Pages 部署配置指南

## ✅ 已完成的步骤

1. ✅ 代码已推送到 GitHub: `bb3700f`
2. ✅ 已删除 API routes (`app/api/*`)
3. ✅ 已配置静态导出 (`next.config.js`: `output: 'export'`)
4. ✅ 已配置 `wrangler.toml` (`pages_build_output_dir = "out"`)

## 🔧 Cloudflare Pages 配置检查

### 方法 1: 通过 Cloudflare Dashboard 配置（推荐）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → 选择你的项目 **adx-mirix**
3. 点击 **Settings** → **Builds & deployments**
4. 检查以下配置：

```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build
Build output directory: out
Root directory: /
Node version: 18
```

5. **重要**: 在 **Production branch** 设置中，确保选择的是 `main` 分支，而不是某个特定的 commit SHA
6. 点击 **Save** 保存配置
7. 点击 **Retry deployment** 重新部署

### 方法 2: 使用 Wrangler CLI 直接部署（绕过 Git）

如果 Dashboard 配置有问题，可以直接使用 Wrangler 部署本地构建：

```powershell
# 1. 确保已构建
npm run build

# 2. 部署到 Cloudflare Pages
wrangler pages deploy out --project-name=adx-mirix
```

## 📋 验证部署

部署成功后，访问 Cloudflare Pages 提供的 URL（通常是 `https://adx-mirix.pages.dev`）

### 预期行为

- ✅ 页面正常加载
- ✅ 所有组件显示模拟数据
- ✅ 无 API 调用错误
- ✅ 无 `force-dynamic` 错误

## 🐛 如果仍然有问题

1. **检查构建日志**: 在 Cloudflare Dashboard 中查看最新的构建日志
2. **确认分支**: 确保 Cloudflare 从 `main` 分支构建，而不是旧的 commit
3. **清除缓存**: 在 Cloudflare Dashboard 中清除构建缓存
4. **手动触发**: 点击 **Retry deployment** 重新构建

## 📝 当前配置摘要

- **GitHub 仓库**: `https://github.com/MyraWang0406/ADX-Mirix-1.15-cursor.git`
- **分支**: `main`
- **最新 Commit**: `bb3700f`
- **构建输出**: `out/`
- **框架**: Next.js 14.0.4 (Static HTML Export)

