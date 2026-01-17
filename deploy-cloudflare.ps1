# Cloudflare Pages 部署脚本
# 使用 Wrangler CLI 直接部署，绕过 Dashboard 配置问题

Write-Host "`n🚀 开始部署到 Cloudflare Pages...`n" -ForegroundColor Cyan

# 1. 检查 Wrangler 是否已安装
Write-Host "📦 检查 Wrangler CLI..." -ForegroundColor Yellow
$wranglerInstalled = npm list -g wrangler 2>&1 | Select-String -Pattern "wrangler@"
if (-not $wranglerInstalled) {
    Write-Host "⚠️  Wrangler 未安装，正在安装..." -ForegroundColor Yellow
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Wrangler 安装失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Wrangler 安装成功" -ForegroundColor Green
} else {
    Write-Host "✅ Wrangler 已安装" -ForegroundColor Green
}

# 2. 构建项目
Write-Host "`n🔨 构建 Next.js 项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建成功" -ForegroundColor Green

# 3. 检查 out 目录
if (-not (Test-Path "out")) {
    Write-Host "❌ 构建输出目录 'out' 不存在！" -ForegroundColor Red
    exit 1
}

# 4. 登录 Cloudflare（如果需要）
Write-Host "`n🔐 检查 Cloudflare 登录状态..." -ForegroundColor Yellow
wrangler whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  未登录，请在弹出的浏览器中登录 Cloudflare..." -ForegroundColor Yellow
    wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 登录失败！" -ForegroundColor Red
        exit 1
    }
}

# 5. 部署到 Cloudflare Pages
Write-Host "`n🚀 部署到 Cloudflare Pages..." -ForegroundColor Yellow
wrangler pages deploy out --project-name=adx-mirix
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署失败！" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ 部署成功！" -ForegroundColor Green
Write-Host "`n📝 提示：如果这是第一次部署，可能需要几分钟时间才能访问。" -ForegroundColor Cyan
Write-Host "   访问地址：https://adx-mirix.pages.dev" -ForegroundColor Cyan


