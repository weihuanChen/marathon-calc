'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SplitData, formatPace, secondsToTime, formatTime } from '@/lib/calculations';

interface SplitTableProps {
  splits: SplitData[];
  unit: 'km' | 'mi';
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

export function SplitTable({ splits, unit }: SplitTableProps) {
  const t = useTranslations('splits');
  const [viewMode, setViewMode] = useState<SplitViewMode>('key');

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

    const frontPaceTime = secondsToTime(frontPace);
    const backPaceTime = secondsToTime(backPace);

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
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 px-4 py-3 min-w-[360px] min-h-[120px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <div className="font-semibold">{t('summary.frontHalf')}</div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="whitespace-nowrap">{t('summary.time')}</span>
                      <span className="font-mono">
                        {formatTime(...Object.values(secondsToTime(frontTimeSeconds)) as [number, number, number])}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="whitespace-nowrap">
                        {t('summary.pace', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                      </span>
                      <span className="font-mono whitespace-nowrap">{frontPaceStr}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">{t('summary.backHalf')}</div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="whitespace-nowrap">{t('summary.time')}</span>
                      <span className="font-mono">
                        {formatTime(...Object.values(secondsToTime(backTimeSeconds)) as [number, number, number])}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-gray-600 dark:text-gray-400">
                      <span className="whitespace-nowrap">
                        {t('summary.pace', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                      </span>
                      <span className="font-mono whitespace-nowrap">{backPaceStr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {lastChunkDistance > 0 && lastChunkTimeSeconds > 0 && (
              <div className="rounded-xl bg-lime-50 dark:bg-lime-900/20 px-4 py-3 min-w-[230px] min-h-[120px]">
                <div className="font-semibold mb-1">
                  {t('lastChunk.title')}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-1 leading-snug">
                  {t('lastChunk.subtitle')}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('lastChunk.distance', {
                      distance: lastChunkDistance.toFixed(1),
                      unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi'),
                    })}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('lastChunk.time')}
                  </span>
                  <span className="font-mono">
                    {formatTime(...Object.values(secondsToTime(lastChunkTimeSeconds)) as [number, number, number])}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('lastChunk.pace', { unit: unit === 'km' ? t('unitLabel.km') : t('unitLabel.mi') })}
                  </span>
                  <span className="font-mono">{lastChunkPaceStr}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`overflow-x-auto min-h-[320px] md:min-h-[380px] ${
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
            </tr>
          </thead>
          <tbody>
            {displaySplits.map((split, index) => (
              <tr
                key={`${split.splitNumber}-${split.distanceFromStart ?? 'd'}`}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                } hover:bg-lime-50 dark:hover:bg-lime-900/20 transition`}
              >
                <td className="px-4 py-3 font-medium">
                  {split.splitNumber} {unit}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {split.pacePerSplit}
                </td>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                  {split.cumulativeTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
