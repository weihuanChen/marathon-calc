# 分享海报图功能设置指南

## 概述

分享海报图功能允许用户将配速计划导出为可分享的图片，包括：
- **社交卡片**：1:1比例，适合社交媒体分享
- **配速带**：A4打印优化，包含每5km的分段时间

## 需要安装的依赖

由于npm安装可能遇到权限问题，请手动安装以下依赖：

```bash
npm install qrcode.react lz-string @types/lz-string html2canvas
```

或者使用pnpm：

```bash
pnpm add qrcode.react lz-string @types/lz-string html2canvas
```

## 功能说明

### 1. 数据序列化
- 位置：`lib/share-serialization.ts`
- 功能：将用户输入序列化为URL查询字符串
- 压缩：如果URL超过200字符，使用LZ-String压缩

### 2. 导出中心
- 位置：`components/ExportCenter.tsx`
- 功能：模态框界面，允许用户选择模板并导出/分享

### 3. 海报模板
- **社交卡片**：`components/posters/SocialCardPoster.tsx`
  - 1:1比例
  - 展示Apple Watch风格仪表盘
  - 高亮"决策区"
  - 包含二维码
  
- **配速带**：`components/posters/PaceBandPoster.tsx`
  - A4打印优化
  - 包含每5km的分段时间
  - 包含二维码

### 4. URL参数解析
- 位置：`components/Calculator.tsx`
- 功能：页面加载时自动解析URL参数并应用共享计划
- 动画：支持自动应用动画效果

## 使用方法

1. 在计算器中设置配速计划
2. 点击"分享海报"按钮
3. 选择模板（社交卡片或配速带）
4. 点击"下载图片"或"分享"

## 多语言支持

已添加以下语言的翻译：
- 中文（zh）
- 英文（en）
- 法语（fr）
- 西班牙语（es）

翻译键位于 `messages/*.json` 文件的 `export` 部分。

## 注意事项

1. **html2canvas**：用于将HTML转换为图片，如果未安装，导出功能会降级为提示用户手动截图
2. **二维码**：使用 `qrcode.react` 生成，扫描后可直接打开配速计划
3. **压缩**：长URL会自动压缩，确保二维码可扫描性

## 未来改进

- [ ] 添加更多海报模板
- [ ] 支持自定义颜色主题
- [ ] 添加PDF导出功能
- [ ] 支持批量导出多个计划
