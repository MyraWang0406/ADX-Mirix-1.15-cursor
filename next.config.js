/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 配置 - 使用静态导出
  output: 'export',
  images: {
    unoptimized: true
  },
  // 禁用 API Routes（Cloudflare Pages 不支持）
  // API Routes 需要改为静态数据或使用外部服务
}

module.exports = nextConfig



