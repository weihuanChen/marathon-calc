# 构建错误修复说明

## 问题描述

执行 `pnpm run build` 时出现以下错误：

```
Invalid next.config.ts options detected: 
    Unrecognized key(s) in object: 'sizes' at "images"
    Unrecognized key(s) in object: 'swcMinify'
```

## 原因分析

在初始的性能优化配置中，我添加了两个在 Next.js 15.5.5 中不支持的配置选项：

1. **`images.sizes`** - 这个配置在 Next.js 15 中已被移除
2. **`swcMinify`** - 这个配置在较新版本的 Next.js 中已被内置处理

## 修复方案

### ✅ 已修复的 next.config.ts

```typescript
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
```

## 修改说明

### 移除的配置

❌ **删除：**
```typescript
// 不支持的配置
images: {
  sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],  // ❌ 移除
}

swcMinify: true,  // ❌ 移除
```

### 保留的优化

✅ **保留的有效配置：**
- `compress: true` - Gzip 压缩（有效）
- `productionBrowserSourceMaps: false` - 减少 bundle（有效）
- `images.formats` - 图片格式优化（有效）
- `experimental.optimizePackageImports` - 包优化（有效）

## 验证

现在可以正常构建项目：

```bash
pnpm run build
# 或
npm run build
```

## 说明

- SWC 代码压缩在 Next.js 15 中已经是默认行为，无需手动配置
- 图片的 `sizes` 配置在此项目中不需要（项目没有使用 Next.js Image 组件）
- 其他性能优化选项都是有效的

## 相关资源

- [Next.js 15 Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

