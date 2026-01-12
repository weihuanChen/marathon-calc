// 环境补偿配置和计算引擎

// 1. 物理与生理折算系数 (Scientific Coefficients)
export const ENVIRONMENT_FACTORS = {
  elevation: {
    uphillK: 6.0,    // 每 1m 爬升约等效于平地 6m
    downhillK: 3.5,  // 每 1m 下坡约等效于减少平地 3.5m
  },
  temperature: {
    optimalMin: 10,  // 最佳温度下限 (°C)
    optimalMax: 15,  // 最佳温度上限 (°C)
    heatPenalty: 0.006, // 超过 15°C，每度衰减 0.6%
    coldPenalty: 0.002  // 低于 5°C，每度衰减 0.2%
  },
  wind: {
    headwindK: 0.03, // 每 10km/h 逆风衰减 3%
    tailwindK: 0.012 // 每 10km/h 顺风增益 1.2%
  },
  surface: {
    asphalt: 1.0,    // 柏油路 (基准)
    track: 0.98,     // 塑胶跑道 (收益)
    cobblestone: 1.05, // 石板路 (损耗)
    trail: 1.15      // 越野/土路 (显著损耗)
  }
} as const;

// 2. 预设场景 (Quick Presets for UX)
export const ENVIRONMENT_PRESETS = [
  { id: 'ideal', icon: '✨', temp: 12, wind: 0, surface: 'asphalt' as const, gain: 0 },
  { id: 'hot_summer', icon: '🔥', temp: 28, wind: 0, surface: 'asphalt' as const, gain: 0 },
  { id: 'windy_city', icon: '🌬️', temp: 10, wind: 15, surface: 'asphalt' as const, gain: 0 },
  { id: 'hilly_trail', icon: '⛰️', temp: 18, wind: 0, surface: 'trail' as const, gain: 300 }
] as const;

// 环境参数类型
export type SurfaceType = keyof typeof ENVIRONMENT_FACTORS.surface;

export interface EnvironmentParams {
  temp: number;        // 气温 (°C)
  wind: number;        // 风速 (km/h)，正数为逆风，负数为顺风
  surface: SurfaceType; // 路面类型
  gain: number;        // 累计爬升 (m)
  loss?: number;       // 累计下降 (m)，可选
  totalDistance: number; // 总距离 (km 或 mi，需要与 basePaceInSeconds 的单位一致)
}

/**
 * 根据环境参数调整配速
 * @param basePaceInSeconds 基准配速（秒/单位）
 * @param params 环境参数
 * @returns 调整后的配速（秒/单位）
 */
export function getAdjustedPace(
  basePaceInSeconds: number,
  params: EnvironmentParams
): number {
  let adjustedPace = basePaceInSeconds;

  // 1. 爬升影响
  if (params.gain > 0 && params.totalDistance > 0) {
    adjustedPace += (params.gain / params.totalDistance) * ENVIRONMENT_FACTORS.elevation.uphillK * basePaceInSeconds;
  }

  // 2. 下降影响
  const loss = params.loss || 0;
  if (loss > 0 && params.totalDistance > 0) {
    adjustedPace -= (loss / params.totalDistance) * ENVIRONMENT_FACTORS.elevation.downhillK * basePaceInSeconds;
    // 确保不会因为下降而变成负数
    adjustedPace = Math.max(adjustedPace, basePaceInSeconds * 0.5);
  }

  // 3. 温度影响
  const { optimalMin, optimalMax, heatPenalty, coldPenalty } = ENVIRONMENT_FACTORS.temperature;
  if (params.temp > optimalMax) {
    // 超过最佳温度上限，每度增加配速
    adjustedPace *= (1 + (params.temp - optimalMax) * heatPenalty);
  } else if (params.temp < optimalMin) {
    // 低于最佳温度下限，每度增加配速
    adjustedPace *= (1 + (optimalMin - params.temp) * coldPenalty);
  }

  // 4. 风速影响
  if (params.wind > 0) {
    // 逆风：增加配速
    adjustedPace *= (1 + (params.wind / 10) * ENVIRONMENT_FACTORS.wind.headwindK);
  } else if (params.wind < 0) {
    // 顺风：减少配速
    adjustedPace *= (1 - (Math.abs(params.wind) / 10) * ENVIRONMENT_FACTORS.wind.tailwindK);
    // 确保不会因为顺风而变成负数
    adjustedPace = Math.max(adjustedPace, basePaceInSeconds * 0.7);
  }

  // 5. 路面类型影响
  adjustedPace *= ENVIRONMENT_FACTORS.surface[params.surface];

  return adjustedPace;
}

/**
 * 计算配速差异（调整后配速 - 基准配速）
 * @param basePaceInSeconds 基准配速
 * @param adjustedPaceInSeconds 调整后配速
 * @returns 配速差异（秒/单位），正数表示变慢，负数表示变快
 */
export function getPaceDifference(
  basePaceInSeconds: number,
  adjustedPaceInSeconds: number
): number {
  return adjustedPaceInSeconds - basePaceInSeconds;
}
