// 单位常量
export const KM_TO_MI = 0.621371;
export const MI_TO_KM = 1.60934;

// 预设距离（以公里为单位）
export const PRESET_DISTANCES = {
  '5k': 5,
  '10k': 10,
  'halfMarathon': 21.0975,
  'marathon': 42.195,
  '50k': 50,
} as const;

export type PresetKey = keyof typeof PRESET_DISTANCES;

// 时间转换为秒
export function timeToSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

// 秒转换为时间对象
export function secondsToTime(totalSeconds: number): { hours: number; minutes: number; seconds: number } {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return { hours, minutes, seconds };
}

// 格式化时间显示 (HH:MM:SS)
export function formatTime(hours: number, minutes: number, seconds: number): string {
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// 格式化配速显示 (M'SS" / unit)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatPace(totalSeconds: number, unit: 'km' | 'mi'): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}

// 计算配速：输入距离和时间，输出配速（秒/单位）
export function calculatePace(
  distance: number,
  hours: number,
  minutes: number,
  seconds: number
): number {
  if (distance <= 0) return 0;
  const totalSeconds = timeToSeconds(hours, minutes, seconds);
  return totalSeconds / distance;
}

// 计算时间：输入距离和配速，输出总时间（秒）
export function calculateTime(distance: number, paceSecondsPerUnit: number): number {
  return distance * paceSecondsPerUnit;
}

// 计算距离：输入时间和配速，输出距离
export function calculateDistance(
  hours: number,
  minutes: number,
  seconds: number,
  paceSecondsPerUnit: number
): number {
  if (paceSecondsPerUnit <= 0) return 0;
  const totalSeconds = timeToSeconds(hours, minutes, seconds);
  return totalSeconds / paceSecondsPerUnit;
}

// 单位转换
export function convertDistance(distance: number, fromUnit: 'km' | 'mi', toUnit: 'km' | 'mi'): number {
  if (fromUnit === toUnit) return distance;
  return fromUnit === 'km' ? distance * KM_TO_MI : distance * MI_TO_KM;
}

// 配速单位转换
export function convertPace(paceSeconds: number, fromUnit: 'km' | 'mi', toUnit: 'km' | 'mi'): number {
  if (fromUnit === toUnit) return paceSeconds;
  // 配速是秒/单位，所以转换公里到英里时需要调整
  return fromUnit === 'km' ? paceSeconds * KM_TO_MI : paceSeconds * MI_TO_KM;
}

// 计算分段配速
export interface SplitData {
  splitNumber: number;
  pacePerSplit: string;
  cumulativeTime: string;
}

export function calculateSplits(
  totalDistance: number,
  paceSecondsPerUnit: number,
  unit: 'km' | 'mi'
): SplitData[] {
  const splits: SplitData[] = [];
  const numSplits = Math.floor(totalDistance);

  for (let i = 1; i <= numSplits; i++) {
    const cumulativeSeconds = i * paceSecondsPerUnit;
    const time = secondsToTime(cumulativeSeconds);

    splits.push({
      splitNumber: i,
      pacePerSplit: formatPace(paceSecondsPerUnit, unit),
      cumulativeTime: formatTime(time.hours, time.minutes, time.seconds),
    });
  }

  // 如果有剩余距离（不足1单位）
  const remainder = totalDistance - numSplits;
  if (remainder > 0) {
    const cumulativeSeconds = totalDistance * paceSecondsPerUnit;
    const time = secondsToTime(cumulativeSeconds);

    splits.push({
      splitNumber: numSplits + 1,
      pacePerSplit: formatPace(paceSecondsPerUnit, unit),
      cumulativeTime: formatTime(time.hours, time.minutes, time.seconds),
    });
  }

  return splits;
}

// 获取预设距离
export function getPresetDistance(key: PresetKey, unit: 'km' | 'mi'): number {
  const distanceKm = PRESET_DISTANCES[key];
  return unit === 'km' ? distanceKm : convertDistance(distanceKm, 'km', 'mi');
}

// 计算配速百分比（用于色彩指示器）
// 将配速归一化到 0-1 范围
// 慢速（7'00"/km）= 0（绿色），快速（3'00"/km）= 1（橙色）
export function getPaceIntensity(paceSecondsPerKm: number): number {
  const slowPace = 7 * 60; // 7分钟/公里 = 420秒
  const fastPace = 3 * 60; // 3分钟/公里 = 180秒

  // 归一化到 0-1
  const intensity = 1 - (paceSecondsPerKm - fastPace) / (slowPace - fastPace);

  // 限制在 0-1 范围内
  return Math.max(0, Math.min(1, intensity));
}

// 计算圆环填充百分比
export function getRingPercentage(value: number, maxValue: number): number {
  return Math.min(100, (value / maxValue) * 100);
}

// 根据配速强度获取颜色渐变
// 慢配速（轻松）→ 冷色调（青蓝色），快配速（困难）→ 暖色调（橙红色）
export function getPaceColor(intensity: number): { from: string; to: string } {
  // intensity 从 0（慢/轻松）到 1（快/困难）

  if (intensity < 0.2) {
    // 非常轻松：青色到蓝色
    return { from: '#06b6d4', to: '#0ea5e9' }; // cyan-500 to sky-500
  } else if (intensity < 0.4) {
    // 轻松：蓝色到绿色
    return { from: '#3b82f6', to: '#10b981' }; // blue-500 to emerald-500
  } else if (intensity < 0.6) {
    // 中等：绿色到黄绿色
    return { from: '#10b981', to: '#84cc16' }; // emerald-500 to lime-500
  } else if (intensity < 0.8) {
    // 较快：黄色到橙色
    return { from: '#facc15', to: '#f97316' }; // yellow-400 to orange-500
  } else {
    // 非常快：橙色到红色
    return { from: '#f97316', to: '#ef4444' }; // orange-500 to red-500
  }
}
