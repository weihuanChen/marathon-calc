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

// Race Phases 类型定义
export type RacePhase = 'start' | 'cruise' | 'decision' | 'final';

// RPE (Rate of Perceived Exertion) 相关类型
export type RPERange = '2-3' | '4-6' | '7-8' | '9-10';
export type BreathingStatus = 'fullSentences' | 'shortPhrases' | 'fewWords' | 'gasping';

export interface RPEInfo {
  rpe: RPERange;
  breathing: BreathingStatus;
  color: string;
  intensityPercent: number; // 用于心率区间计算 (50-100%)
  hrZone?: string; // 心率区间，如 "Zone 2" 或 "Zone 4"
}

export interface RacePhaseConfig {
  phase: RacePhase;
  startDistance: number; // 阶段起始距离（单位：km）
  endDistance: number; // 阶段结束距离（单位：km）
  paceOffsetSeconds: number; // 相对目标配速的偏差（秒/单位）
  color: string; // 阶段颜色（用于UI）
}

// 补给点类型
export type AidStationType = 'water' | 'energy';

export interface AidStation {
  distance: number; // 距离（单位：与unit一致）
  type: AidStationType;
}

// 补给点配置（支持预设赛事）
export interface AidStationConfig {
  energyInterval: number; // 能量补给站间距（单位：km或mi）
  waterInterval: number; // 饮水站间距（单位：km或mi）
}

// 预设赛事补给点配置（以km为单位）
export const COURSE_AID_STATIONS: Record<string, AidStationConfig> = {
  default: {
    energyInterval: 5, // 每5km
    waterInterval: 2.5, // 每2.5km
  },
  boston: {
    energyInterval: 1.60934, // 每1英里
    waterInterval: 1.60934, // 每1英里
  },
  beijing: {
    energyInterval: 5,
    waterInterval: 2.5,
  },
  shanghai: {
    energyInterval: 5,
    waterInterval: 2.5,
  },
};

// 计算分段配速
export interface SplitData {
  splitNumber: number;
  pacePerSplit: string;
  cumulativeTime: string;
  // 从起点到当前分段末尾的累计距离（单位：与当前 unit 一致）
  distanceFromStart?: number;
  // Race Phase 信息
  phase?: RacePhase;
  // 补给点信息
  aidStations?: AidStation[];
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
 * 基于"倍率模型"的分段配速计算（支持Race Phases + 策略微调）：
 * - 给每一段一个倍率 m_i
 * - 基准配速 p0 = T / Σ(d_i * m_i)
 * - 每段配速 p_i = p0 * m_i
 * - 每段用时 t_i = p_i * d_i
 * 
 * Race Phases 与策略的兼容性：
 * - 如果是马拉松距离（42.195km），自动应用 Race Phases 作为基础框架
 * - 用户可以通过 Pacing Strategy（even/negative/slightPositive/tenTenTen/custom）进行微调
 * - 策略微调以 50% 的强度叠加在 Race Phases 基础上，保持阶段特征的同时允许个性化调整
 * - 高级微调（fineTunePercent）在最后应用，提供更精细的控制
 */
export function calculateStrategySplits(
  totalDistance: number,
  totalTimeSeconds: number,
  options: SplitStrategyOptions,
  courseId?: string
): SplitData[] {
  if (totalDistance <= 0 || totalTimeSeconds <= 0) {
    return [];
  }

  // 检查是否是马拉松距离，应用Race Phases
  const totalDistanceKm = options.unit === 'km' ? totalDistance : convertDistance(totalDistance, 'mi', 'km');
  const phases = getRacePhases(totalDistanceKm);
  const useRacePhases = phases.length > 0;

  // 获取补给点
  const aidStations = getAidStations(totalDistance, options.unit, courseId);

  const segments = buildSegmentDistances(totalDistance);
  
  // 计算倍率：Race Phases 作为基础，策略作为微调
  let multipliers: number[];
  
  if (useRacePhases) {
    // 使用Race Phases逻辑：基于阶段调整配速（作为基础）
    const avgPace = totalTimeSeconds / totalDistance;
    const racePhaseMultipliers = segments.map((segDist, index) => {
      let cumulativeDist = 0;
      for (let j = 0; j < index; j++) {
        cumulativeDist += segments[j];
      }
      const segCenter = cumulativeDist + segDist / 2;
      const segCenterKm = options.unit === 'km' ? segCenter : convertDistance(segCenter, 'mi', 'km');
      
      // 找到当前分段所属的阶段
      const phase = getPhaseForDistance(segCenterKm, phases);
      if (phase) {
        const phaseConfig = phases.find((p) => p.phase === phase);
        if (phaseConfig) {
          // 将配速偏差转换为倍率
          const paceOffset = phaseConfig.paceOffsetSeconds;
          // 如果目标配速是avgPace，那么调整后的配速是 avgPace + paceOffset
          // 倍率 = (avgPace + paceOffset) / avgPace = 1 + paceOffset / avgPace
          return 1 + paceOffset / avgPace;
        }
      }
      return 1; // 默认倍率
    });
    
    // 计算策略调整倍率（作为微调）
    const strategyMultipliers = buildBaseMultipliers(segments.length, totalDistance, totalTimeSeconds, options);
    
    // 将 Race Phases 和策略结合：
    // 策略作为微调，应用 50% 的调整幅度，在保持 Race Phases 特征的同时允许策略调整
    // 最终倍率 = race_phase_multiplier * (1 + (strategy_multiplier - 1) * blend_factor)
    // 这样策略可以在 Race Phases 的基础上进行微调，而不完全覆盖阶段特征
    const strategyBlendFactor = 0.5; // 策略微调强度（50%），用户可以通过调整策略强度来控制
    multipliers = racePhaseMultipliers.map((raceMult, i) => {
      const strategyMult = strategyMultipliers[i] ?? 1;
      // 如果策略倍率是 1（even 或无效），不进行额外调整，保持 Race Phases 的原始倍率
      if (Math.abs(strategyMult - 1) < 0.001) {
        return raceMult;
      }
      // 将策略调整按比例应用到 Race Phases 基础上
      // 例如：Race Phases = 1.02（慢2%），策略 = 1.05（慢5%）
      // 调整 = (1.05 - 1) * 0.5 = 0.025
      // 最终 = 1.02 * (1 + 0.025) = 1.0455（在 Race Phases 基础上再慢约2.5%）
      const strategyAdjustment = (strategyMult - 1) * strategyBlendFactor;
      return raceMult * (1 + strategyAdjustment);
    });
    
    // 应用高级微调（如果有）
    multipliers = applyFineTune(multipliers, totalDistance, options.unit, options.fineTunePercent);
  } else {
    // 非马拉松距离：使用原有策略逻辑
    const baseMultipliers = buildBaseMultipliers(segments.length, totalDistance, totalTimeSeconds, options);
    multipliers = applyFineTune(baseMultipliers, totalDistance, options.unit, options.fineTunePercent);
  }

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

    // 确定当前分段的阶段
    const segCenterKm = options.unit === 'km' 
      ? cumulativeDistance 
      : convertDistance(cumulativeDistance, 'mi', 'km');
    const phase = useRacePhases ? getPhaseForDistance(segCenterKm, phases) : undefined;

    // 查找当前分段内的补给点
    const splitAidStations = aidStations.filter((station) => {
      const prevDistance = i > 0 ? cumulativeDistance - segDist : 0;
      return station.distance > prevDistance && station.distance <= cumulativeDistance;
    });

    splits.push({
      splitNumber: i + 1,
      pacePerSplit: formatPace(segPace, options.unit),
      cumulativeTime: formatTime(time.hours, time.minutes, time.seconds),
      distanceFromStart: cumulativeDistance,
      phase,
      aidStations: splitAidStations.length > 0 ? splitAidStations : undefined,
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

// Race Phases 配置（以km为单位）
export function getRacePhases(totalDistanceKm: number): RacePhaseConfig[] {
  // 仅对马拉松距离（42.195km）应用阶段系统
  const marathonDistance = 42.195;
  const epsilon = 0.1; // 容差

  if (Math.abs(totalDistanceKm - marathonDistance) > epsilon) {
    // 非马拉松距离，返回空数组
    return [];
  }

  return [
    {
      phase: 'start',
      startDistance: 0,
      endDistance: 5,
      paceOffsetSeconds: -3.5, // 平均慢3.5秒（2-5秒范围的中点）
      color: '#10b981', // 绿色 🟢
    },
    {
      phase: 'cruise',
      startDistance: 5,
      endDistance: 30,
      paceOffsetSeconds: 0, // 目标配速
      color: '#3b82f6', // 蓝色 🔵
    },
    {
      phase: 'decision',
      startDistance: 30,
      endDistance: 38,
      paceOffsetSeconds: 2, // 慢2秒
      color: '#facc15', // 黄色 🟡
    },
    {
      phase: 'final',
      startDistance: 38,
      endDistance: 42.195,
      paceOffsetSeconds: -5, // 快5秒
      color: '#ef4444', // 红色 🔴
    },
  ];
}

// 获取当前距离所属的Race Phase
export function getPhaseForDistance(distanceKm: number, phases: RacePhaseConfig[]): RacePhase | undefined {
  for (const phase of phases) {
    if (distanceKm >= phase.startDistance && distanceKm < phase.endDistance) {
      return phase.phase;
    }
  }
  // 如果距离刚好等于最后一个阶段的结束距离
  if (phases.length > 0) {
    const lastPhase = phases[phases.length - 1];
    if (Math.abs(distanceKm - lastPhase.endDistance) < 0.01) {
      return lastPhase.phase;
    }
  }
  return undefined;
}

// 获取补给点
export function getAidStations(
  totalDistance: number,
  unit: 'km' | 'mi',
  courseId: string = 'default'
): AidStation[] {
  const config = COURSE_AID_STATIONS[courseId] || COURSE_AID_STATIONS.default;
  
  // 将配置转换为当前单位
  const energyInterval = unit === 'km' 
    ? config.energyInterval 
    : convertDistance(config.energyInterval, 'km', 'mi');
  const waterInterval = unit === 'km'
    ? config.waterInterval
    : convertDistance(config.waterInterval, 'km', 'mi');

  const stations: AidStation[] = [];
  const epsilon = 0.01; // 容差

  // 生成能量补给站（每energyInterval）
  for (let dist = energyInterval; dist <= totalDistance + epsilon; dist += energyInterval) {
    if (dist <= totalDistance + epsilon) {
      stations.push({
        distance: Math.min(dist, totalDistance),
        type: 'energy',
      });
    }
  }

  // 生成饮水站（每waterInterval）
  for (let dist = waterInterval; dist <= totalDistance + epsilon; dist += waterInterval) {
    if (dist <= totalDistance + epsilon) {
      // 避免与能量补给站重复
      const isDuplicate = stations.some(
        (s) => Math.abs(s.distance - dist) < epsilon && s.type === 'energy'
      );
      if (!isDuplicate) {
        stations.push({
          distance: Math.min(dist, totalDistance),
          type: 'water',
        });
      }
    }
  }

  // 按距离排序
  stations.sort((a, b) => a.distance - b.distance);

  return stations;
}

// RPE 映射：将 Race Phase 映射到 RPE、呼吸状态和颜色
export function getRPEInfo(phase: RacePhase | undefined): RPEInfo | null {
  if (!phase) return null;

  const mapping: Record<RacePhase, RPEInfo> = {
    start: {
      rpe: '2-3',
      breathing: 'fullSentences',
      color: '#10b981', // 绿色
      intensityPercent: 50, // 50-60% 最大心率
      hrZone: 'Zone 2',
    },
    cruise: {
      rpe: '4-6',
      breathing: 'shortPhrases',
      color: '#3b82f6', // 蓝色
      intensityPercent: 70, // 70-80% 最大心率
      hrZone: 'Zone 3',
    },
    decision: {
      rpe: '7-8',
      breathing: 'fewWords',
      color: '#facc15', // 黄色
      intensityPercent: 85, // 85-90% 最大心率
      hrZone: 'Zone 4',
    },
    final: {
      rpe: '9-10',
      breathing: 'gasping',
      color: '#ef4444', // 红色
      intensityPercent: 95, // 95-100% 最大心率
      hrZone: 'Zone 5',
    },
  };

  return mapping[phase] || null;
}

// 使用 Karvonen 公式计算目标心率
// TargetHR = ((MaxHR - RestHR) × %Intensity) + RestHR
// 标准5区心率区间：
// Zone 1: 50-60% HRR, Zone 2: 60-70% HRR, Zone 3: 70-80% HRR, 
// Zone 4: 80-90% HRR, Zone 5: 90-100% HRR
export function calculateTargetHeartRate(
  maxHR: number,
  restHR: number,
  intensityPercent: number
): { min: number; max: number; zone?: string } {
  const hrReserve = maxHR - restHR;
  const targetHR = restHR + hrReserve * (intensityPercent / 100);
  
  // 计算心率区间范围（±3 bpm）
  const min = Math.round(targetHR - 3);
  const max = Math.round(targetHR + 3);

  // 确定心率区间（基于HRR百分比）
  let zone: string | undefined;
  const hrPercent = intensityPercent;
  
  if (hrPercent < 60) {
    zone = 'Zone 1-2';
  } else if (hrPercent < 70) {
    zone = 'Zone 2';
  } else if (hrPercent < 80) {
    zone = 'Zone 3';
  } else if (hrPercent < 90) {
    zone = 'Zone 4';
  } else {
    zone = 'Zone 5';
  }

  return { min, max, zone };
}
