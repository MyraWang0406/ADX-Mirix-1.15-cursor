# Cloudflare Pages 部署修复指南

## 问题诊断

Cloudflare Pages 正在拉取旧的 commit `025a023`，而不是最新的 `bb2db16`。

从错误日志可以看到：
```
* branch            025a023096d909ee282113ec2c6daf8cdcad5418 -> FETCH_HEAD
HEAD is now at 025a023 Fix wrangler.toml build output directory
```

这说明 Cloudflare Pages 的配置中可能指定了特定的 commit SHA，而不是使用 `main` 分支的最新代码。

## 解决方案

### 方法一：在 Cloudflare Dashboard 中修复（必须操作）

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 进入 **Workers & Pages** → 找到你的项目 `adx-mirix`

2. **进入项目设置**
   - 点击项目名称进入详情页
   - 点击左侧菜单的 **Settings**

3. **检查 Builds & deployments 配置**
   - 在 Settings 页面找到 **Builds & deployments** 部分
   - 查看 **Production branch** 设置
   - **如果显示的是 commit SHA（如 `025a023`），必须改为 `main` 分支**

4. **修改 Production branch**
   - 点击 **Edit** 或 **Configure** 按钮
   - 将 **Production branch** 从 commit SHA 改为 `main`
   - 保存更改

5. **手动触发重新部署**
   - 进入 **Deployments** 标签页
   - 点击 **Create deployment** 或 **Retry deployment**
   - 确保选择的是 `main` 分支（不是特定的 commit）
   - 点击 **Deploy**

### 方法二：删除并重新创建项目

如果方法一无效，可以删除并重新创建项目：

1. **删除现有项目**
   - 在 Cloudflare Dashboard 中进入项目设置
   - 滚动到底部，点击 **Delete project**
   - 确认删除

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

### 方法三：使用 Wrangler CLI 直接部署

如果 Dashboard 操作不方便，可以使用 CLI：

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 本地构建（测试）
npm run build

# 4. 直接部署到 Cloudflare Pages
wrangler pages deploy out --project-name=adx-mirix
```

## 验证修复

部署成功后，检查构建日志：
- ✅ 应该显示拉取的是最新 commit（`bb2db16` 或更新）
- ✅ 不应该再出现 `q_factor` 类型错误
- ✅ 构建应该成功完成

## 当前代码状态

- ✅ 最新 commit: `bb2db16` - Remove unnecessary Cloudflare config file
- ✅ `FormulaBreakdown.tsx` 已修复：正确使用 `internal_variables?.q_factor`
- ✅ 所有类型错误已修复
- ✅ 代码已推送到 GitHub `main` 分支

## 重要提示

**Cloudflare Pages 配置问题必须在 Cloudflare Dashboard 中手动修复，代码本身已经正确。**

如果 Dashboard 中无法找到修改 Production branch 的选项，可能需要：
1. 检查是否有权限修改项目设置
2. 联系 Cloudflare 支持
3. 或者使用 Wrangler CLI 直接部署


