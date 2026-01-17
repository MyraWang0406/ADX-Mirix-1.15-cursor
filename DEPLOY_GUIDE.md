# Cloudflare Pages 部署指南

## 问题说明

Cloudflare Pages 仍然在拉取旧的 commit `025a023`，而不是最新的 `main` 分支代码。这是因为 Cloudflare Dashboard 中的配置指定了特定的 commit SHA。

## 解决方案

### 方案一：使用 Wrangler CLI 直接部署（推荐）

这是最简单直接的方法，可以绕过 Dashboard 配置问题。

#### 步骤 1：安装 Wrangler CLI

```powershell
npm install -g wrangler
```

#### 步骤 2：登录 Cloudflare

```powershell
wrangler login
```

这会打开浏览器，让你登录 Cloudflare 账号。

#### 步骤 3：构建项目

```powershell
npm run build
```

#### 步骤 4：部署到 Cloudflare Pages

```powershell
wrangler pages deploy out --project-name=adx-mirix
```

#### 或者使用自动化脚本

我已经创建了 `deploy-cloudflare.ps1` 脚本，可以直接运行：

```powershell
.\deploy-cloudflare.ps1
```

这个脚本会自动：
1. 检查并安装 Wrangler（如果需要）
2. 构建项目
3. 检查登录状态
4. 部署到 Cloudflare Pages

### 方案二：删除并重新创建项目

如果方案一不行，可以在 Cloudflare Dashboard 中删除并重新创建项目：

1. **删除现有项目**
   - 登录 https://dash.cloudflare.com/
   - 进入 **Workers & Pages** → 找到项目 `adx-mirix`
   - 进入项目设置 → 滚动到底部 → 点击 **Delete project**

2. **重新创建项目**
   - 点击 **Create application** → **Pages** → **Connect to Git**
   - 选择 GitHub，授权访问
   - 选择仓库：`MyraWang0406/ADX-Mirix-1.15-cursor`
   - **重要：选择 `main` 分支（不要选择特定的 commit）**
   - 构建设置：
     ```
     Framework preset: Next.js (Static HTML Export)
     Build command: npm run build
     Build output directory: out
     Root directory: /
     Node version: 18
     ```
   - 点击 **Save and Deploy**

## 验证部署

部署成功后：
- ✅ 访问你的 Cloudflare Pages URL（通常是 `https://adx-mirix.pages.dev`）
- ✅ 检查构建日志，应该显示拉取的是最新 commit
- ✅ 不应该再出现 `q_factor` 类型错误

## 当前代码状态

- ✅ 最新 commit: `4226825` - Add Cloudflare Pages deployment fix guide
- ✅ `FormulaBreakdown.tsx` 已修复：正确使用 `internal_variables?.q_factor`
- ✅ 所有类型错误已修复
- ✅ 代码已推送到 GitHub `main` 分支

## 重要提示

**使用 Wrangler CLI 部署是最可靠的方法**，因为它直接部署本地构建的文件，不依赖于 Cloudflare 的 Git 集成配置。


