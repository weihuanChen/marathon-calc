'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { SplitData, formatPace, secondsToTime, formatTime, RacePhase, AidStationType, getRacePhases, getRPEInfo, calculateTargetHeartRate } from '@/lib/calculations';

interface SplitTableProps {
  splits: SplitData[];
  unit: 'km' | 'mi';
  maxHR?: number; // 最大心率（可选）
  restHR?: number; // 静息心率（可选，默认60）
}

type SplitViewMode = 'per1' | 'per5' | 'key';

function parseTimeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

// 获取阶段颜色
function getPhaseColor(phase: RacePhase | undefined): string {
  if (!phase) return 'transparent';
  const colors: Record<RacePhase, string> = {
    start: '#10b981', // 绿色 🟢
    cruise: '#3b82f6', // 蓝色 🔵
    decision: '#facc15', // 黄色 🟡
    final: '#ef4444', // 红色 🔴
  };
  return colors[phase] || 'transparent';
}

export function SplitTable({ splits, unit, maxHR, restHR = 60 }: SplitTableProps) {
  const t = useTranslations('splits');
  const [viewMode, setViewMode] = useState<SplitViewMode>('key');
  const [selectedSplit, setSelectedSplit] = useState<SplitData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; placement: 'above' | 'below' } | null>(null);
  const [coachVoiceSplit, setCoachVoiceSplit] = useState<SplitData | null>(null);
  const [coachVoicePosition, setCoachVoicePosition] = useState<{ x: number; y: number } | null>(null);
  const [coachVoicePlacement, setCoachVoicePlacement] = useState<'left' | 'right'>('right');
  const isBrowser = typeof document !== 'undefined';
  const tooltipRef = useRef<HTMLDivElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const coachVoiceRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const calculateCoachVoicePosition = (split: SplitData, rect: DOMRect) => {
    const margin = 8;
    const estimatedWidth = 260;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceRight = viewportWidth - rect.right - margin;
    const spaceLeft = rect.left - margin;
    const placement: 'left' | 'right' =
      spaceRight >= estimatedWidth || spaceRight >= spaceLeft ? 'right' : 'left';

    const x = placement === 'right'
      ? Math.min(rect.right + margin, viewportWidth - margin)
      : Math.max(rect.left - margin, margin);
    const y = Math.min(Math.max(rect.top + rect.height / 2, margin), viewportHeight - margin);

    setCoachVoicePlacement(placement);
    setCoachVoiceSplit(split);
    setCoachVoicePosition({ x, y });
  };

  // 点击外部区域关闭Tooltip/Bottom Sheet/Coach Voice
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      if (selectedSplit) {
        if (
          tooltipRef.current && !tooltipRef.current.contains(target) &&
          bottomSheetRef.current && !bottomSheetRef.current.contains(target)
        ) {
          setSelectedSplit(null);
          setTooltipPosition(null);
        }
      }
      
      if (coachVoiceSplit) {
        if (coachVoiceRef.current && !coachVoiceRef.current.contains(target)) {
          // 检查是否点击的是RPE圆点按钮本身
          const isRpeButton = (target as HTMLElement)?.closest('button[aria-label*="RPE"]');
          if (!isRpeButton) {
            setCoachVoiceSplit(null);
            setCoachVoicePosition(null);
          }
        }
      }
    };

    if (selectedSplit || coachVoiceSplit) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [selectedSplit, coachVoiceSplit]);

  if (splits.length === 0) {
    return null;
  }

  const lastSplit = splits[splits.length - 1];
  const totalDistance = lastSplit.distanceFromStart ?? splits.length;
  const totalTimeSeconds = parseTimeStringToSeconds(lastSplit.cumulativeTime);

  // 前半程 / 后半程统计
  let frontTimeSeconds = 0;
  let backTimeSeconds = 0;
  let frontPaceStr = '';
  let backPaceStr = '';

  if (totalDistance > 0 && totalTimeSeconds > 0) {
    const halfDistance = totalDistance / 2;

    // 找到刚好覆盖到“半程”的那一行
    let halfSplit = lastSplit;
    for (const s of splits) {
      const d = s.distanceFromStart ?? s.splitNumber;
      if (d >= halfDistance) {
        halfSplit = s;
        break;
      }
    }

    frontTimeSeconds = parseTimeStringToSeconds(halfSplit.cumulativeTime);
    backTimeSeconds = Math.max(0, totalTimeSeconds - frontTimeSeconds);

    const frontPace = frontTimeSeconds / halfDistance;
    const backPace = backTimeSeconds / halfDistance;

    frontPaceStr = formatPace(frontPace, unit);
    backPaceStr = formatPace(backPace, unit);
  }

  // 最后 7-12km 小结（这里用“最后约 10km”来近似）
  let lastChunkDistance = 0;
  let lastChunkTimeSeconds = 0;
  let lastChunkPaceStr = '';

  if (totalDistance > 0 && totalTimeSeconds > 0) {
    const approxLength = Math.min(12, Math.max(7, 10)); // 目前固定约 10km，在 7-12km 区间内
    const startDistance = Math.max(0, totalDistance - approxLength);

    // 找到“最后 7-12km”开始时刻
    let beforeSplitTime = 0;
    let beforeSplitDistance = 0;

    for (const s of splits) {
      const d = s.distanceFromStart ?? s.splitNumber;
      if (d >= startDistance) {
        beforeSplitTime = parseTimeStringToSeconds(s.cumulativeTime);
        beforeSplitDistance = d;
        break;
      }
    }

    lastChunkDistance = totalDistance - beforeSplitDistance;
    lastChunkTimeSeconds = Math.max(0, totalTimeSeconds - beforeSplitTime);

    if (lastChunkDistance > 0 && lastChunkTimeSeconds > 0) {
      const lastChunkPace = lastChunkTimeSeconds / lastChunkDistance;
      lastChunkPaceStr = formatPace(lastChunkPace, unit);
    }
  }

  // 根据视图模式计算要显示的分段
  let displaySplits: SplitData[] = splits;

  const epsilon = 0.2; // 用于浮点误差的容差

  if (viewMode === 'per5') {
    displaySplits = splits.filter((split, index) => {
      if (!split.distanceFromStart) {
        // 回退：没有距离信息时，保留每 5 段和最后一段
        return index === splits.length - 1 || ((split.splitNumber % 5 === 0) as boolean);
      }
      const d = split.distanceFromStart;
      const isLast = index === splits.length - 1;
      if (isLast) return true;

      // 判断是否接近某个 5 的倍数（按当前单位）
      const multipleOfFive = Math.round(d / 5);
      const target = multipleOfFive * 5;
      return Math.abs(d - target) <= epsilon;
    });
  } else if (viewMode === 'key') {
    const targets: number[] = [];

    // 关键节点：5、10、半程（用总距离的一半近似）、30、35、40、终点
    const half = totalDistance / 2;
    const candidates = [5, 10, half, 30, 35, 40, totalDistance];

    for (const c of candidates) {
      if (c <= 0) continue;
      if (c > totalDistance + epsilon) continue;
      if (!targets.some((t) => Math.abs(t - c) <= epsilon)) {
        targets.push(c);
      }
    }

    const picked: SplitData[] = [];

    for (const target of targets) {
      let best: SplitData | null = null;

      for (const split of splits) {
        const d = split.distanceFromStart ?? split.splitNumber;
        if (d + epsilon < target) continue;
        if (!best || (best.distanceFromStart ?? best.splitNumber) > d) {
          best = split;
        }
      }

      if (best && !picked.includes(best)) {
        picked.push(best);
      }
    }

    displaySplits = picked;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3 min-w-0">
        <h3 className="text-xl md:text-2xl font-bold md:whitespace-nowrap">
          {t('title')}
        </h3>
        <div className="inline-flex self-start lg:self-auto rounded-full bg-gray-100 dark:bg-gray-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('per1')}
            className={`px-3 py-1 rounded-full ${
              viewMode === 'per1'
                ? 'bg-lime-400 text-black shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('view.per1')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('per5')}
            className={`px-3 py-1 rounded-full ${
              viewMode === 'per5'
                ? 'bg-lime-400 text-black shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('view.per5')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('key')}
            className={`px-3 py-1 rounded-full ${
              viewMode === 'key'
                ? 'bg-lime-400 text-black shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('view.key')}
          </button>
        </div>
      </div>

      {/* 前半程 / 后半程 & 最后 7-12km 概览 */}
      {totalDistance > 0 && totalTimeSeconds > 0 && (
        <div className="mb-4 -mx-2 overflow-x-auto pb-2 text-xs md:text-sm">
          <div className="grid gap-3 px-2 min-w-[640px] md:min-w-0 md:grid-cols-[1.2fr_0.8fr] items-stretch">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 px-4 py-3 min-w-[360px] min-h-[120px] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="font-semibold">{t('summary.frontHalf')}</div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex-shrink-0">{t('summary.time')}</span>
                      <span className="font-mono whitespace-nowrap flex-shrink-0">
                        {formatTime(...Object.values(secondsToTime(frontTimeSeconds)) as [number, number, number])}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex-shrink-0">{t('summary.pace')}</span>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-mono whitespace-nowrap">{frontPaceStr}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight">
                          {t('summary.paceUnit', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">{t('summary.backHalf')}</div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex-shrink-0">{t('summary.time')}</span>
                      <span className="font-mono whitespace-nowrap flex-shrink-0">
                        {formatTime(...Object.values(secondsToTime(backTimeSeconds)) as [number, number, number])}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex-shrink-0">{t('summary.pace')}</span>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-mono whitespace-nowrap">{backPaceStr}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight">
                          {t('summary.paceUnit', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {lastChunkDistance > 0 && lastChunkTimeSeconds > 0 && (
              <div className="rounded-xl bg-lime-50 dark:bg-lime-900/20 px-4 py-3 min-w-[230px] min-h-[120px] overflow-hidden">
                <div className="font-semibold mb-1">
                  {t('lastChunk.title')}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-1 leading-snug">
                  {t('lastChunk.subtitle')}
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {t('lastChunk.distance', {
                      distance: lastChunkDistance.toFixed(1),
                      unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi'),
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-3 mt-1">
                  <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {t('lastChunk.time')}
                  </span>
                  <span className="font-mono whitespace-nowrap flex-shrink-0">
                    {formatTime(...Object.values(secondsToTime(lastChunkTimeSeconds)) as [number, number, number])}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 mt-1">
                  <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {t('lastChunk.pace')}
                  </span>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="font-mono whitespace-nowrap">{lastChunkPaceStr}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight">
                      {t('lastChunk.paceUnit', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={tableContainerRef}
        className={`overflow-x-auto min-h-[320px] md:min-h-[380px] relative ${
          viewMode === 'per1' ? 'max-h-[380px] md:max-h-[440px] overflow-y-auto' : ''
        }`}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('splitNumber')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('pacePerSplit')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('cumulativeTime')}
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-12">
                <span className="sr-only">{t('rpe.label')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displaySplits.map((split, index) => {
              const phaseColor = getPhaseColor(split.phase);
              const hasAidStations = split.aidStations && split.aidStations.length > 0;
              const rpeInfo = getRPEInfo(split.phase);
              const hrInfo = maxHR && rpeInfo
                ? calculateTargetHeartRate(maxHR, restHR, rpeInfo.intensityPercent)
                : null;

              const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
                if (!rpeInfo) return;
                e.stopPropagation();

                const rowRect = e.currentTarget.getBoundingClientRect();

                // 桌面端显示Tooltip，移动端显示Bottom Sheet
                if (window.innerWidth >= 768) {
                  const viewportHeight = window.innerHeight;
                  const margin = 12;
                  const estimatedHeight = 220;
                const canPlaceBelow = rowRect.bottom + margin + estimatedHeight <= viewportHeight - margin;
                const canPlaceAbove = rowRect.top - margin - estimatedHeight >= margin;
                const placement: 'above' | 'below' = canPlaceBelow || !canPlaceAbove ? 'below' : 'above';
                const y = placement === 'below'
                  ? rowRect.bottom + margin
                  : rowRect.top - margin;

                  setTooltipPosition({
                    x: rowRect.left + rowRect.width / 2,
                    y,
                    placement,
                  });
                } else {
                  setTooltipPosition(null);
                }
                setSelectedSplit(split);
              };

              const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                if (!rpeInfo) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();

                  const rowRect = e.currentTarget.getBoundingClientRect();

                  if (window.innerWidth >= 768) {
                    const viewportHeight = window.innerHeight;
                    const margin = 12;
                    const estimatedHeight = 220;
                    const canPlaceBelow = rowRect.bottom + margin + estimatedHeight <= viewportHeight - margin;
                    const canPlaceAbove = rowRect.top - margin - estimatedHeight >= margin;
                    const placement: 'above' | 'below' = canPlaceBelow || !canPlaceAbove ? 'below' : 'above';
                    const y = placement === 'below'
                      ? rowRect.bottom + margin
                      : rowRect.top - margin;

                    setTooltipPosition({
                      x: rowRect.left + rowRect.width / 2,
                      y,
                      placement,
                    });
                  } else {
                    setTooltipPosition(null);
                  }
                  setSelectedSplit(split);
                } else if (e.key === 'Escape') {
                  setSelectedSplit(null);
                  setTooltipPosition(null);
                }
              };

              // 生成aria-label
              const rpeKey = rpeInfo ? `rpe.rpe${rpeInfo.rpe.replace('-', '')}` : '';
              const ariaLabelParts = [
                `${split.splitNumber} ${unit}`,
                rpeInfo ? (t(rpeKey, { defaultValue: `RPE ${rpeInfo.rpe}` })) : '',
                rpeInfo ? t(`rpe.breathing.${rpeInfo.breathing}`, { defaultValue: rpeInfo.breathing }) : '',
              ].filter(Boolean);
              const ariaLabel = ariaLabelParts.join(', ');

              return (
                <tr
                  key={`${split.splitNumber}-${split.distanceFromStart ?? 'd'}`}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                  } hover:bg-lime-50 dark:hover:bg-lime-900/20 transition cursor-pointer`}
                  onClick={handleRowClick}
                  onKeyDown={handleRowKeyDown}
                  tabIndex={rpeInfo ? 0 : -1}
                  aria-label={ariaLabel || undefined}
                  role={rpeInfo ? 'button' : undefined}
                >
                    <td className="px-4 py-3 font-medium relative pl-6">
                      {/* 阶段颜色侧边条 */}
                      {split.phase && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: phaseColor }}
                          aria-label={t(`phases.${split.phase}.name`, { defaultValue: split.phase })}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <span>
                          {split.splitNumber} {unit}
                        </span>
                        {/* RPE 徽章 */}
                        {rpeInfo && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${rpeInfo.color}20`,
                              color: rpeInfo.color,
                              border: `1px solid ${rpeInfo.color}40`,
                            }}
                            title={t('rpe.badgeTitle', { rpe: rpeInfo.rpe })}
                          >
                            RPE {rpeInfo.rpe}
                          </span>
                        )}
                        {/* 补给点图标 */}
                        {hasAidStations && (
                          <div className="flex items-center gap-1">
                            {split.aidStations?.map((station, idx) => (
                              <span
                                key={idx}
                                className="text-sm"
                                title={
                                  station.type === 'water'
                                    ? t('aidStations.water')
                                    : t('aidStations.energy')
                                }
                              >
                                {station.type === 'water' ? '💧' : '⚡'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {split.pacePerSplit}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                      {split.cumulativeTime}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      {rpeInfo && (
                        <button
                          type="button"
                          className="relative group"
                          onMouseEnter={(e) => {
                            if (window.innerWidth >= 768) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              calculateCoachVoicePosition(split, rect);
                            }
                          }}
                          onMouseLeave={() => {
                            if (window.innerWidth >= 768) {
                              // 延迟关闭，允许鼠标移动到气泡上
                              setTimeout(() => {
                                if (!coachVoiceRef.current?.matches(':hover')) {
                                  setCoachVoiceSplit(null);
                                  setCoachVoicePosition(null);
                                }
                              }, 100);
                            }
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (coachVoiceSplit === split) {
                              setCoachVoiceSplit(null);
                              setCoachVoicePosition(null);
                            } else {
                              calculateCoachVoicePosition(split, rect);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth < 768) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (coachVoiceSplit === split) {
                                setCoachVoiceSplit(null);
                                setCoachVoicePosition(null);
                              } else {
                                calculateCoachVoicePosition(split, rect);
                              }
                            }
                          }}
                          aria-label={t('rpe.coachVoice.ariaLabel', { rpe: rpeInfo.rpe })}
                        >
                          <div
                            className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-110 active:scale-95"
                            style={{ backgroundColor: rpeInfo.color }}
                          >
                            {rpeInfo.rpe.split('-')[0]}
                          </div>
                        </button>
                      )}
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tooltip (桌面端) - 移到容器内部,使用 absolute 定位 */}
        {selectedSplit && tooltipPosition && (() => {
          const rpeInfo = getRPEInfo(selectedSplit.phase);
          const hrInfo = maxHR && rpeInfo
            ? calculateTargetHeartRate(maxHR, restHR, rpeInfo.intensityPercent)
            : null;

          if (!rpeInfo) return null;

          const margin = 12;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const finalX = Math.min(Math.max(tooltipPosition.x, margin), viewportWidth - margin);
          const finalY = Math.min(Math.max(tooltipPosition.y, margin), viewportHeight - margin);
          const translateY = tooltipPosition.placement === 'below' ? '0%' : '-100%';

          return createPortal(
            <div
              ref={tooltipRef}
              className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border border-gray-200 dark:border-gray-700 pointer-events-auto"
              style={{
                left: `${finalX}px`,
                top: `${finalY}px`,
                transform: `translate(-50%, ${translateY})`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={() => {
                setSelectedSplit(null);
                setTooltipPosition(null);
              }}
            >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {selectedSplit.splitNumber} {unit}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${rpeInfo.color}20`,
                    color: rpeInfo.color,
                  }}
                >
                  RPE {rpeInfo.rpe}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="mb-1">
                  <strong>{t('rpe.breathing.label')}:</strong> {t(`rpe.breathing.${rpeInfo.breathing}`)}
                </div>
                {hrInfo && (
                  <div className="mb-1">
                    <strong>{t('rpe.heartRate.label')}:</strong> {hrInfo.min}-{hrInfo.max} bpm ({hrInfo.zone})
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 italic border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                {selectedSplit.phase
                  ? t(`rpe.coachTip.${selectedSplit.phase}`, {
                      distance: selectedSplit.splitNumber,
                      unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi'),
                      defaultValue: `第 ${selectedSplit.splitNumber} ${unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi')}：RPE ${rpeInfo.rpe}`,
                    })
                  : `第 ${selectedSplit.splitNumber} ${unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi')}：RPE ${rpeInfo.rpe}`}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
      </div>

      {/* Bottom Sheet (移动端) */}
      {selectedSplit && !tooltipPosition && (() => {
        const rpeInfo = getRPEInfo(selectedSplit.phase);
        const hrInfo = maxHR && rpeInfo
          ? calculateTargetHeartRate(maxHR, restHR, rpeInfo.intensityPercent)
          : null;

        if (!rpeInfo) return null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/50 md:hidden"
            onClick={() => {
              setSelectedSplit(null);
              setTooltipPosition(null);
            }}
          >
            <div
              ref={bottomSheetRef}
              className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 max-h-[60vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {selectedSplit.splitNumber} {unit}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: `${rpeInfo.color}20`,
                        color: rpeInfo.color,
                      }}
                    >
                      RPE {rpeInfo.rpe}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSplit(null);
                      setTooltipPosition(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>{t('rpe.breathing.label')}:</strong> {t(`rpe.breathing.${rpeInfo.breathing}`)}
                  </div>
                  {hrInfo && (
                    <div>
                      <strong>{t('rpe.heartRate.label')}:</strong> {hrInfo.min}-{hrInfo.max} bpm ({hrInfo.zone})
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-700 pt-3">
                  {selectedSplit.phase
                    ? t(`rpe.coachTip.${selectedSplit.phase}`, {
                        distance: selectedSplit.splitNumber,
                        unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi'),
                        defaultValue: `第 ${selectedSplit.splitNumber} ${unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi')}：RPE ${rpeInfo.rpe}`,
                      })
                    : `第 ${selectedSplit.splitNumber} ${unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi')}：RPE ${rpeInfo.rpe}`}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Coach's Voice 气泡 (微型气泡) */}
      {coachVoiceSplit && coachVoicePosition && isBrowser && (() => {
        const rpeInfo = getRPEInfo(coachVoiceSplit.phase);
        if (!rpeInfo) return null;

        // 根据可用空间决定在左右显示，避免被截断。相对表格容器定位，避免受上层 transform 影响。
        return createPortal(
          <div
            ref={coachVoiceRef}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2.5 md:p-3 min-w-[200px] md:min-w-[220px] max-w-[260px] md:max-w-sm border border-gray-200 dark:border-gray-700 pointer-events-auto"
            style={{
              left: `${coachVoicePosition.x}px`,
              top: `${coachVoicePosition.y}px`,
              transform: coachVoicePlacement === 'right' ? 'translate(0, -50%)' : 'translate(-100%, -50%)',
            }}
            onMouseEnter={() => {
              // 保持显示
            }}
            onMouseLeave={() => {
              if (window.innerWidth >= 768) {
                setCoachVoiceSplit(null);
                setCoachVoicePosition(null);
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 mt-0.5 md:mt-1"
                style={{ backgroundColor: rpeInfo.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] md:text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5 md:mb-1">
                  {t('rpe.coachVoice.title', { rpe: rpeInfo.rpe })}
                </div>
                <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {coachVoiceSplit.phase
                    ? t(`rpe.coachVoice.message.${coachVoiceSplit.phase}`, {
                        defaultValue: `RPE ${rpeInfo.rpe}: ${t(`rpe.breathing.${rpeInfo.breathing}`, { defaultValue: rpeInfo.breathing })}`,
                      })
                    : `RPE ${rpeInfo.rpe}: ${t(`rpe.breathing.${rpeInfo.breathing}`, { defaultValue: rpeInfo.breathing })}`}
                </div>
              </div>
            </div>
            {/* 小箭头指向圆点 - 始终指向左侧 */}
            {coachVoicePlacement === 'right' ? (
              <>
                <div
                  className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-200 dark:border-r-gray-700 border-b-[6px] border-b-transparent"
                />
                <div
                  className="absolute left-0 top-1/2 -translate-x-0.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-white dark:border-r-gray-800 border-b-[6px] border-b-transparent"
                />
              </>
            ) : (
              <>
                <div
                  className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[6px] border-l-gray-200 dark:border-l-gray-700 border-b-[6px] border-b-transparent"
                />
                <div
                  className="absolute right-0 top-1/2 translate-x-0.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[6px] border-l-white dark:border-l-gray-800 border-b-[6px] border-b-transparent"
                />
              </>
            )}
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
