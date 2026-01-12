'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { formatTime, formatPace, secondsToTime } from '@/lib/calculations';
import { serializeShareData } from '@/lib/share-serialization';
import { RunningIcon } from '@/components/RunningIcon';
import { SITE_URL } from '@/lib/site';
import type { ShareData } from '@/lib/share-serialization';

interface SocialCardPosterProps {
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

export function SocialCardPoster({
  shareData,
  result,
  unit,
  splits,
  environmentParams,
}: SocialCardPosterProps) {
  const t = useTranslations('export');

  // 生成分享URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}${serializeShareData(shareData)}`
    : '';

  const timeObj = secondsToTime(result.totalSeconds);
  const paceDisplay = formatPace(result.paceSecondsPerUnit, unit);
  const timeDisplay = formatTime(timeObj.hours, timeObj.minutes, timeObj.seconds);

  // 找到决策区（decision phase）
  const decisionSplits = splits.filter((s) => s.phase === 'decision');
  const hasDecisionZone = decisionSplits.length > 0;
  
  // 计算决策区里程范围
  const decisionRange = hasDecisionZone && decisionSplits.length > 0
    ? `${decisionSplits[0].distanceFromStart?.toFixed(0) || '30'}-${decisionSplits[decisionSplits.length - 1].distanceFromStart?.toFixed(0) || '38'}${unit === 'km' ? 'km' : 'mi'}`
    : '';

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden flex flex-col">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-lime-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-8 pb-10">
        {/* 顶部：Logo + 网站名 - 提高 z-index 确保不被遮挡 */}
        <div className="flex items-center justify-center gap-2 mb-6 shrink-0 relative z-20">
          <RunningIcon className="h-4 w-4 text-lime-400 shrink-0" />
          <h1 className="text-base font-semibold text-gray-300 whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>
            Marathon Pace Studio
          </h1>
        </div>

        {/* 中间区域：阶梯式排版 - 使用 justify-start 避免内容居中导致遮挡，增加底部 padding 为二维码留空间 */}
        <div className="flex-1 flex flex-col items-center justify-start pt-2 pb-40 space-y-3 min-h-0 relative">
          {/* 主配速 - 勋章化设计，Apple Watch 风格霓虹发光效果 */}
          <div className="text-center relative shrink-0">
            {/* 背景发光层 - 限制向上扩散 */}
            <div 
              className="absolute inset-x-0 bottom-0 blur-xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.4) 0%, rgba(96, 165, 250, 0.4) 100%)',
                transform: 'scale(1.1)',
                top: '-20%', // 限制向上扩散范围
                height: '140%', // 只向下和两侧扩散
              }}
            />
            {/* 主配速文字 - 增强霓虹发光效果，缩小字体以适应空间 */}
            <div 
              className="relative text-7xl font-bold bg-gradient-to-r from-lime-400 via-lime-300 to-blue-400 bg-clip-text text-transparent whitespace-nowrap"
              style={{
                textShadow: `
                  0 0 20px rgba(163, 230, 53, 0.8),
                  0 0 40px rgba(163, 230, 53, 0.6),
                  0 0 60px rgba(163, 230, 53, 0.4),
                  0 0 80px rgba(163, 230, 53, 0.3),
                  0 0 100px rgba(163, 230, 53, 0.2)
                `,
                filter: 'drop-shadow(0 2px 15px rgba(163, 230, 53, 0.7))', // 向下偏移阴影
              }}
            >
              {paceDisplay}
            </div>
          </div>

          {/* 总里程和总时间 - 阶梯式排版 */}
          <div className="text-center space-y-1 shrink-0">
            <div className="text-2xl font-semibold text-gray-200 whitespace-nowrap">
              {result.distance.toFixed(2)} {unit}
            </div>
            <div className="text-xl text-gray-400 font-mono whitespace-nowrap">
              {timeDisplay}
            </div>
          </div>

          {/* 决策区 - 毛玻璃卡片（Decision Zone）- 限制宽度避免与二维码重叠 */}
          {hasDecisionZone && (
            <div className="w-full max-w-sm shrink-0" style={{ maxWidth: 'calc(100% - 140px)' }}>
              <div 
                className="border border-white/20 rounded-xl p-4 shadow-xl"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-yellow-300 font-semibold text-base whitespace-nowrap">
                    {t('decisionZone')}
                  </div>
                  {decisionRange && (
                    <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
                      {decisionRange}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {decisionSplits.map((split, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-mono whitespace-nowrap">
                        {split.distanceFromStart?.toFixed(1)} {unit}
                      </span>
                      <span className="text-white font-mono font-semibold whitespace-nowrap">
                        {split.cumulativeTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 环境参数（如果有） */}
          {environmentParams && (
            <div className="text-xs text-gray-400 space-y-1 flex items-center gap-3 shrink-0">
              {environmentParams.temp > 0 && (
                <div className="whitespace-nowrap">🌡️ {environmentParams.temp}°C</div>
              )}
              {environmentParams.gain > 0 && (
                <div className="whitespace-nowrap">⛰️ +{environmentParams.gain}m</div>
              )}
            </div>
          )}
        </div>

        {/* 底部：二维码（右下角）和品牌信息 - 使用绝对定位确保不遮挡内容 */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-8 pb-2 flex-shrink-0 z-30">
          {/* 左下角：SEO 语义化文字 */}
          <div className="text-[8px] text-gray-500/50 font-light leading-tight whitespace-nowrap">
            Generated by Marathon Pace Studio - 2026 Strategy
          </div>

          {/* 右下角：二维码区域（120px，周围留白） */}
          {shareUrl && (
            <div className="flex flex-col items-end" style={{ padding: '4px' }}>
              <div 
                className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg"
                style={{ 
                  padding: '8px',
                  width: '100px',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  imageRendering: 'pixelated',
                }}
              >
                <QRCodeSVG
                  value={shareUrl}
                  size={84}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <div className="text-[10px] text-gray-500/70 mt-1 text-right max-w-[100px] whitespace-nowrap">
                扫码克隆此计划
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
