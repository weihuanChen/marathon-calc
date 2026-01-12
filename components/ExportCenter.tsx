'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { SocialCardPoster } from './posters/SocialCardPoster';
import { PaceBandPoster } from './posters/PaceBandPoster';
import type { ShareData } from '@/lib/share-serialization';

interface ExportCenterProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData;
  result: {
    distance: number;
    totalSeconds: number;
    paceSecondsPerUnit: number;
  };
  unit: 'km' | 'mi';
  splits: Array<{
    splitNumber: number;
    pacePerSplit: string;
    cumulativeTime: string;
    distanceFromStart?: number;
    phase?: 'start' | 'cruise' | 'decision' | 'final';
  }>;
  environmentParams?: {
    temp: number;
    wind: number;
    surface: string;
    gain: number;
  } | null;
}

type TemplateType = 'social' | 'paceband';

// 等待所有图片资源加载完成
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img, svg');
  const promises = Array.from(images).map((img) => {
    if (img instanceof HTMLImageElement) {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // 即使失败也继续
        }
      });
    }
    // SVG 元素通常已经渲染完成
    return Promise.resolve();
  });
  await Promise.all(promises);
  // 额外等待一小段时间确保渲染完成
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// 克隆节点并离屏展开：解决滚动截断问题
function cloneAndExpandForExport(element: HTMLElement): HTMLElement {
  // 1. 深克隆节点（包括所有子节点和属性）
  const cloned = element.cloneNode(true) as HTMLElement;
  
  // 2. 获取原始尺寸和计算样式
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const originalWidth = rect.width || parseInt(computedStyle.width, 10) || 600;
  
  // 3. 应用离屏展开样式
  cloned.style.position = 'fixed';
  cloned.style.top = '0';
  cloned.style.left = '-9999px'; // 移出屏幕外
  cloned.style.width = `${originalWidth}px`;
  cloned.style.height = 'auto'; // 强制高度自适应内容
  cloned.style.maxHeight = 'none'; // 取消任何最大高度限制
  cloned.style.overflow = 'visible'; // 确保所有内容可见
  cloned.style.overflowY = 'visible';
  cloned.style.zIndex = '-1';
  cloned.style.opacity = '1'; // 保持可见以便 SnapDOM 捕获
  cloned.style.pointerEvents = 'none';
  cloned.style.visibility = 'visible'; // 必须可见，否则 SnapDOM 无法捕获
  
  // 5. 确保内部滚动容器也展开
  const scrollableChildren = cloned.querySelectorAll('*');
  scrollableChildren.forEach((child) => {
    const el = child as HTMLElement;
    const childStyle = window.getComputedStyle(el);
    
    // 检查是否有 overflow 相关的样式
    if (childStyle.overflow === 'auto' || childStyle.overflow === 'scroll' || 
        childStyle.overflowY === 'auto' || childStyle.overflowY === 'scroll') {
      el.style.overflow = 'visible';
      el.style.overflowY = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
    }
    
    // 移除任何固定高度限制
    if (el.style.height && el.style.height !== 'auto') {
      el.style.height = 'auto';
    }
    if (el.style.maxHeight && el.style.maxHeight !== 'none') {
      el.style.maxHeight = 'none';
    }
  });
  
  // 6. 添加到 document.body 以便浏览器进行布局渲染
  document.body.appendChild(cloned);
  
  // 返回克隆节点，调用者负责清理
  return cloned;
}

// 将图片转换为 JPEG Blob（压缩）
async function imageToJpegBlob(img: HTMLImageElement, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create JPEG blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

export function ExportCenter({
  isOpen,
  onClose,
  shareData,
  result,
  unit,
  splits,
  environmentParams,
}: ExportCenterProps) {
  const t = useTranslations('export');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('social');
  const [isGenerating, setIsGenerating] = useState(false);
  const socialCardRef = useRef<HTMLDivElement>(null);
  const paceBandRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const ref = selectedTemplate === 'social' ? socialCardRef : paceBandRef;
    if (!ref.current) return;

    setIsGenerating(true);
    let clonedElement: HTMLElement | null = null;
    
    try {
      // 1. 克隆节点并离屏展开
      clonedElement = cloneAndExpandForExport(ref.current);
      
      // 2. 等待克隆节点的所有资源加载完成
      await waitForImages(clonedElement);
      
      // 3. 等待一小段时间确保布局完成
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // 4. 动态导入 SnapDOM
      const { snapdom } = await import('@zumer/snapdom');
      
      // 5. 截取完全展开的克隆节点
      const capture = await snapdom(clonedElement, {
        scale: 2, // 固定使用 2 倍缩放
        backgroundColor: selectedTemplate === 'social' ? '#111827' : '#ffffff',
      });
      
      const img = await capture.toPng();
      
      // 7. 转换为 JPEG 格式以压缩体积
      const blob = await imageToJpegBlob(img, 0.85);
      
      // 8. 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `marathon-pace-${selectedTemplate}-${Date.now()}.jpg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export image:', error);
      // 降级方案：提示用户手动截图
      alert(t('downloadFallback'));
    } finally {
      // 8. 清理：移除克隆节点
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const ref = selectedTemplate === 'social' ? socialCardRef : paceBandRef;
    if (!ref.current) return;

    setIsGenerating(true);
    let clonedElement: HTMLElement | null = null;
    
    try {
      // 1. 克隆节点并离屏展开
      clonedElement = cloneAndExpandForExport(ref.current);
      
      // 2. 等待克隆节点的所有资源加载完成
      await waitForImages(clonedElement);
      
      // 3. 等待布局和渲染完成（增加等待时间确保 SVG 等元素正确渲染）
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // 4. 验证克隆节点是否有内容
      if (!clonedElement || clonedElement.children.length === 0) {
        throw new Error('Cloned element is empty');
      }
      
      // 5. 动态导入 SnapDOM
      const { snapdom } = await import('@zumer/snapdom');
      
      // 6. 截取完全展开的克隆节点
      const capture = await snapdom(clonedElement, {
        scale: 2, // 固定使用 2 倍缩放
        backgroundColor: selectedTemplate === 'social' ? '#111827' : '#ffffff',
      });
      
      const img = await capture.toPng();
      
      // 7. 转换为 JPEG 格式以压缩体积
      const blob = await imageToJpegBlob(img, 0.85);

      // 8. 优先使用原生分享 API
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `marathon-pace-${selectedTemplate}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: t('shareTitle'),
            text: t('shareText'),
          });
          return;
        }
      }

      // 降级方案：复制图片到剪贴板
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/jpeg': blob,
          }),
        ]);
        alert(t('copiedToClipboard'));
      } catch {
        // 如果剪贴板API不支持，触发下载
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `marathon-pace-${selectedTemplate}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to share:', error);
      alert(t('shareError'));
    } finally {
      // 8. 清理：移除克隆节点
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-4 mt-8 mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label={t('close')}
          >
            <X size={24} />
          </button>
        </div>

        {/* 模板选择 */}
        <div className="flex gap-4 p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setSelectedTemplate('social')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
              selectedTemplate === 'social'
                ? 'bg-lime-400 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('templates.social')}
          </button>
          <button
            onClick={() => setSelectedTemplate('paceband')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
              selectedTemplate === 'paceband'
                ? 'bg-lime-400 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('templates.paceband')}
          </button>
        </div>

        {/* 预览区域 - 支持滚动，用户可预览完整内容（包括底部二维码） */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-0">
          <div className="flex justify-center items-start">
            {selectedTemplate === 'social' ? (
              <div ref={socialCardRef} className="w-[600px] h-[600px] shrink-0 overflow-hidden">
                <SocialCardPoster
                  shareData={shareData}
                  result={result}
                  unit={unit}
                  splits={splits}
                  environmentParams={environmentParams}
                />
              </div>
            ) : (
              <div ref={paceBandRef} className="bg-white" style={{ width: '350px', minHeight: '1123px' }}>
                <PaceBandPoster
                  shareData={shareData}
                  result={result}
                  unit={unit}
                  splits={splits}
                />
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Download size={20} />
                {t('download')}
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Share2 size={20} />
                {t('share')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
