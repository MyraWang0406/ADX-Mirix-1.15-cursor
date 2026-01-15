/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 配置
  output: 'standalone',
  // 如果需要静态导出，取消下面的注释
  // output: 'export',
  // images: {
  //   unoptimized: true
  // }
}

module.exports = nextConfig



