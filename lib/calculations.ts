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
  // 从起点到当前分段末尾的累计距离（单位：与当前 unit 一致）
  distanceFromStart?: number;
}

// 分段配速策略类型
export type SplitStrategy = 'even' | 'negative' | 'slightPositive' | 'tenTenTen' | 'custom';

// 高级微调：在关键里程点之后，对倍率做百分比调整（+变慢，-变快）
export interface SplitFineTunePercent {
  after5k?: number;
  after10k?: number;
  afterHalf?: number;
  after30k?: number;
}

// 分段策略配置
export interface SplitStrategyOptions {
  strategy: SplitStrategy;
  unit: 'km' | 'mi';
  /**
   * 主强度：后半程相对前半程“快多少秒 / 每单位”
   * 仅对负分段 / 轻微正分段 / 10-10-10 / 自定义等有意义
   */
  strengthSeconds?: number;
  /**
   * 高级微调：在 5K / 10K / 半程 / 30K 之后的百分比调整（+ 变慢，- 变快）
   */
  fineTunePercent?: SplitFineTunePercent;
}

// 内部工具：根据总距离拆成每段距离（单位为 km/mi）
function buildSegmentDistances(totalDistance: number): number[] {
  const segments: number[] = [];
  if (totalDistance <= 0) return segments;

  const numSplits = Math.floor(totalDistance);
  for (let i = 0; i < numSplits; i++) {
    segments.push(1);
  }

  const remainder = totalDistance - numSplits;
  if (remainder > 0) {
    segments.push(remainder);
  }

  return segments;
}

// 内部工具：生成基础倍率曲线（不含高级微调）
function buildBaseMultipliers(
  segmentsCount: number,
  totalDistance: number,
  totalTimeSeconds: number,
  options: SplitStrategyOptions
): number[] {
  const { strategy, unit, strengthSeconds = 0 } = options;

  // 默认全部 1（匀速）
  const multipliers = Array(segmentsCount).fill(1) as number[];
  if (segmentsCount === 0 || totalDistance <= 0 || totalTimeSeconds <= 0) {
    return multipliers;
  }

  if (strategy === 'even' || strengthSeconds <= 0) {
    return multipliers;
  }

  // 使用平均配速估算强度对应的倍率（限制在 0.02~0.08 范围内，避免过激）
  const avgPace = totalTimeSeconds / totalDistance;
  const rawAmplitude = strengthSeconds / avgPace;
  const amplitude = Math.max(0.02, Math.min(0.08, Math.abs(rawAmplitude)));

  // 线性从前到后映射到 [-1, 1]，便于做对称分布
  const getX = (index: number) => {
    if (segmentsCount === 1) return 0;
    return (index / (segmentsCount - 1)) * 2 - 1;
  };

  if (strategy === 'negative' || strategy === 'slightPositive' || strategy === 'custom') {
    for (let i = 0; i < segmentsCount; i++) {
      const x = getX(i); // -1（起点）→ 1（终点）

      if (strategy === 'negative') {
        // 负分段：前半慢（>1），后半快（<1）
        multipliers[i] = 1 + (-x) * amplitude;
      } else if (strategy === 'slightPositive') {
        // 轻微正分段：前半快（<1），后半慢（>1）
        multipliers[i] = 1 + x * amplitude;
      } else {
        // 自定义：默认做成“弱负分段”作为起点
        multipliers[i] = 1 + (-x) * (amplitude / 2);
      }
    }
    return multipliers;
  }

  if (strategy === 'tenTenTen') {
    // 10-10-10 / 分段执行法：
    // 前 10 英里保守、中段稳定、最后 10 公里略快
    const tenMilesInUnit = convertDistance(10, 'mi', unit);
    const tenKmInUnit = convertDistance(10, 'km', unit);

    const segments = buildSegmentDistances(totalDistance);
    let cumulative = 0;

    // 这里使用 amplitude 控制“保守/冲刺”的幅度
    for (let i = 0; i < segmentsCount; i++) {
      const segDist = segments[i] ?? 1;
      const segCenter = cumulative + segDist / 2;

      let factor = 1;
      if (segCenter <= tenMilesInUnit) {
        // 前 10 英里：略慢
        factor = 1 + amplitude;
      } else if (totalDistance - segCenter <= tenKmInUnit) {
        // 最后 10 公里：略快
        factor = 1 - amplitude;
      } else {
        // 中段：稳定
        factor = 1;
      }

      multipliers[i] = factor;
      cumulative += segDist;
    }

    return multipliers;
  }

  return multipliers;
}

// 内部工具：应用高级微调倍率
function applyFineTune(
  multipliers: number[],
  totalDistance: number,
  unit: 'km' | 'mi',
  fineTune?: SplitFineTunePercent
): number[] {
  if (!fineTune) return multipliers;

  const segments = buildSegmentDistances(totalDistance);
  const result = [...multipliers];

  // 将关键点统一转换为当前单位
  const checkpoints: { distance: number; value?: number }[] = [
    { distance: convertDistance(5, 'km', unit), value: fineTune.after5k },
    { distance: convertDistance(10, 'km', unit), value: fineTune.after10k },
    { distance: convertDistance(PRESET_DISTANCES.halfMarathon, 'km', unit), value: fineTune.afterHalf },
    { distance: convertDistance(30, 'km', unit), value: fineTune.after30k },
  ];

  let cumulative = 0;

  for (let i = 0; i < segments.length; i++) {
    const segDist = segments[i];
    const segCenter = cumulative + segDist / 2;

    // 收集所有已经“经过”的关键点增益（可叠加）
    let extraPercent = 0;
    for (const cp of checkpoints) {
      if (cp.value === undefined) continue;
      if (segCenter >= cp.distance) {
        extraPercent += cp.value;
      }
    }

    if (extraPercent !== 0) {
      result[i] = result[i] * (1 + extraPercent / 100);
    }

    cumulative += segDist;
  }

  return result;
}

/**
 * 基于“倍率模型”的分段配速计算：
 * - 给每一段一个倍率 m_i
 * - 基准配速 p0 = T / Σ(d_i * m_i)
 * - 每段配速 p_i = p0 * m_i
 * - 每段用时 t_i = p_i * d_i
 */
export function calculateStrategySplits(
  totalDistance: number,
  totalTimeSeconds: number,
  options: SplitStrategyOptions
): SplitData[] {
  if (totalDistance <= 0 || totalTimeSeconds <= 0) {
    return [];
  }

  const segments = buildSegmentDistances(totalDistance);
  const baseMultipliers = buildBaseMultipliers(segments.length, totalDistance, totalTimeSeconds, options);
  const multipliers = applyFineTune(baseMultipliers, totalDistance, options.unit, options.fineTunePercent);

  // 计算加权距离和
  let weightedDistanceSum = 0;
  for (let i = 0; i < segments.length; i++) {
    weightedDistanceSum += segments[i] * multipliers[i];
  }

  if (weightedDistanceSum <= 0) {
    return [];
  }

  const basePace = totalTimeSeconds / weightedDistanceSum; // p0

  const splits: SplitData[] = [];
  let cumulativeSeconds = 0;
  let cumulativeDistance = 0;

  for (let i = 0; i < segments.length; i++) {
    const segDist = segments[i];
    const m = multipliers[i];
    const segPace = basePace * m; // p_i
    const segTime = segPace * segDist; // t_i

    cumulativeSeconds += segTime;
    cumulativeDistance += segDist;
    const time = secondsToTime(cumulativeSeconds);

    splits.push({
      splitNumber: i + 1,
      pacePerSplit: formatPace(segPace, options.unit),
      cumulativeTime: formatTime(time.hours, time.minutes, time.seconds),
      distanceFromStart: cumulativeDistance,
    });
  }

  return splits;
}

export function calculateSplits(
  totalDistance: number,
  paceSecondsPerUnit: number,
  unit: 'km' | 'mi'
): SplitData[] {
  const totalTimeSeconds = totalDistance * paceSecondsPerUnit;
  return calculateStrategySplits(totalDistance, totalTimeSeconds, {
    strategy: 'even',
    unit,
  });
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
