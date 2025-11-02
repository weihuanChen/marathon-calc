import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* 性能优化配置 */
  
  // 启用 Gzip 压缩
  compress: true,
  
  // 生产环境优化
  productionBrowserSourceMaps: false,  // 减少 bundle 大小
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 性能监控
  experimental: {
    // 优化包导入，只包含 framer-motion 中实际使用的部分
    optimizePackageImports: ["framer-motion"],
  },
};

export default withNextIntl(nextConfig);
