'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { formatTime, formatPace, secondsToTime } from '@/lib/calculations';
import { serializeShareData } from '@/lib/share-serialization';
import type { ShareData } from '@/lib/share-serialization';

interface PaceBandPosterProps {
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
}

export function PaceBandPoster({
  shareData,
  result,
  unit,
  splits,
}: PaceBandPosterProps) {
  const t = useTranslations('export');

  // 生成分享URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}${serializeShareData(shareData)}`
    : '';

  const timeObj = secondsToTime(result.totalSeconds);
  const paceDisplay = formatPace(result.paceSecondsPerUnit, unit);
  const timeDisplay = formatTime(timeObj.hours, timeObj.minutes, timeObj.seconds);

  // 获取所有关键分段（每5km或每5mi）
  const interval = unit === 'km' ? 5 : 3.10686; // 约5英里
  const keySplits = splits.filter((split) => {
    const dist = split.distanceFromStart || 0;
    return Math.abs(dist % interval) < 0.1 || dist === result.distance;
  });

  // 获取阶段背景色（用于 Cruise 段）
  const getPhaseBgColor = (phase?: 'start' | 'cruise' | 'decision' | 'final'): string => {
    switch (phase) {
      case 'cruise': return '#f3f4f6'; // 浅灰背景
      default: return 'transparent';
    }
  };

  // 获取阶段图标或标识
  const getPhaseLabel = (phase?: 'start' | 'cruise' | 'decision' | 'final'): string => {
    switch (phase) {
      case 'start': return '🚀';
      case 'cruise': return '⚡';
      case 'decision': return '⚖️';
      case 'final': return '🔥';
      default: return '';
    }
  };

  // 计算动态行高（如果分段过多，缩小行高）
  const rowHeight = keySplits.length > 20 ? 'py-2' : 'py-3';
  const fontSize = keySplits.length > 20 ? 'text-sm' : 'text-base';

  return (
    <div className="bg-white text-black print:bg-white relative" style={{ width: '350px', borderLeft: '2px dashed #9ca3af', borderRight: '2px dashed #9ca3af' }}>
      <div className="px-4 py-6">
        {/* 顶部信息 */}
        <div className="text-center mb-6 pb-4 border-b-2 border-black">
          <div className="text-lg font-bold mb-1">目标时间</div>
          <div className="text-2xl font-mono font-bold mb-2">{timeDisplay}</div>
          <div className="text-base font-semibold mb-1">平均配速</div>
          <div className="text-xl font-mono font-bold">{paceDisplay} / {unit}</div>
          {/* 比赛名称（如果有） */}
          <div className="text-sm text-gray-700 mt-2">
            {result.distance.toFixed(2)} {unit} Marathon
          </div>
        </div>

        {/* 分段表格 - 长条纵向布局 */}
        <div className="space-y-0">
          {keySplits.map((split, idx) => {
            const phaseBg = getPhaseBgColor(split.phase);
            const phaseIcon = getPhaseLabel(split.phase);
            const prevPhase = idx > 0 ? keySplits[idx - 1].phase : null;
            const isPhaseBoundary = prevPhase !== split.phase && idx > 0;
            
            return (
              <div key={idx}>
                {/* 阶段分割线 */}
                {isPhaseBoundary && (
                  <div className="h-1 bg-black/20 my-1" style={{ marginLeft: '-16px', marginRight: '-16px' }} />
                )}
                <div
                  className={`flex items-center justify-between ${rowHeight} px-2 border-b border-gray-300`}
                  style={{ 
                    backgroundColor: phaseBg,
                    minHeight: '48px', // 增加行高确保可读性
                  }}
                >
                  {/* 第一列：KM/Mile - 加粗，字体稍大 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width: '28%' }}>
                    <div className={`font-bold ${fontSize === 'text-sm' ? 'text-base' : 'text-lg'} text-right`} style={{ minWidth: '45px' }}>
                      {split.distanceFromStart?.toFixed(1) || split.splitNumber}
                    </div>
                    <div className="text-xs font-bold">{unit.toUpperCase()}</div>
                  </div>

                  {/* 第二列：Time（累计时间）- 核心关注点，最大最醒目 */}
                  <div className={`font-mono font-bold ${fontSize === 'text-sm' ? 'text-xl' : 'text-2xl'} text-center flex-1`}>
                    {split.cumulativeTime}
                  </div>

                  {/* 第三列：Split/Phase - 极简图标或背景色块 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 justify-end" style={{ width: '32%' }}>
                    {phaseIcon && (
                      <span className="text-base">{phaseIcon}</span>
                    )}
                    <div className={`text-xs ${fontSize} text-gray-700 font-mono`}>
                      {split.pacePerSplit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部：二维码和页脚 */}
        <div className="mt-6 pt-4 border-t-2 border-black flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs font-semibold mb-2">{t('scanToView')}</div>
            {shareUrl && (
              <div 
                className="bg-white p-1.5 border border-black rounded inline-block"
                style={{ imageRendering: 'pixelated' }}
              >
                <QRCodeSVG
                  value={shareUrl}
                  size={80}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
            )}
          </div>
          <div className="text-right text-xs text-gray-700 ml-4">
            <div className="font-semibold">{t('footer', { siteName: 'Marathon Pace Studio' })}</div>
            <div className="mt-1">Built for 2026 Marathons</div>
          </div>
        </div>

        {/* 裁剪辅助线 */}
        <div className="mt-4 pt-2 border-t-2 border-dashed border-gray-400">
          <div className="text-center text-xs text-gray-500 font-semibold mb-1">
            ──── Fold Here ────
          </div>
          <div className="text-center text-[10px] text-gray-400">
            Cut along this line for easy carrying
          </div>
        </div>
      </div>
    </div>
  );
}
