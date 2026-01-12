'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ENVIRONMENT_FACTORS,
  ENVIRONMENT_PRESETS,
  type SurfaceType,
  type EnvironmentParams,
  getAdjustedPace,
  getPaceDifference,
} from '@/lib/environment';
import { formatPace } from '@/lib/calculations';

interface EnvironmentLabProps {
  basePaceSeconds: number; // 基准配速（秒/单位）
  totalDistance: number;   // 总距离
  unit: 'km' | 'mi';       // 单位
  onParamsChange?: (params: EnvironmentParams) => void;
}

export function EnvironmentLab({
  basePaceSeconds,
  totalDistance,
  unit,
  onParamsChange,
}: EnvironmentLabProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 环境参数状态
  const [temp, setTemp] = useState(15);
  const [wind, setWind] = useState(0);
  const [surface, setSurface] = useState<SurfaceType>('asphalt');
  const [gain, setGain] = useState(0);

  // 计算调整后的配速
  const params: EnvironmentParams = {
    temp,
    wind,
    surface,
    gain,
    totalDistance,
  };

  const adjustedPace = getAdjustedPace(basePaceSeconds, params);
  const paceDiff = getPaceDifference(basePaceSeconds, adjustedPace);

  // 通知父组件参数变化（使用 useEffect 避免在渲染中调用）
  useEffect(() => {
    if (onParamsChange) {
      onParamsChange({
        temp,
        wind,
        surface,
        gain,
        totalDistance,
      });
    }
  }, [temp, wind, surface, gain, totalDistance, onParamsChange]);

  // 应用预设
  const applyPreset = (preset: typeof ENVIRONMENT_PRESETS[number]) => {
    setTemp(preset.temp);
    setWind(preset.wind);
    setSurface(preset.surface);
    setGain(preset.gain);
  };

  // 格式化配速差异显示
  const formatPaceDiff = (diff: number): string => {
    const absDiff = Math.abs(diff);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${absDiff.toFixed(1)}s/${unit === 'km' ? 'km' : 'mi'}`;
  };

  // 获取温度颜色
  const getTempColor = (temp: number): string => {
    if (temp < 5) return 'text-cyan-400'; // 冷 - 青色
    if (temp > 25) return 'text-amber-500'; // 热 - 琥珀色
    return 'text-lime-400'; // 适宜 - 绿色
  };

  // 获取风速颜色
  const getWindColor = (wind: number): string => {
    if (wind > 10) return 'text-amber-500'; // 强风
    if (wind < -10) return 'text-cyan-400'; // 强顺风
    return 'text-lime-400'; // 微风
  };

  return (
    <div className="rounded-2xl p-4 md:p-6 shadow-xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* 标题栏 - 可点击展开/收起 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{t('environment.title')}</h3>
          {/* 实时反馈徽章 */}
          {paceDiff !== 0 && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                paceDiff > 0
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
              }`}
            >
              {t('environment.effortBadge', {
                diff: formatPaceDiff(paceDiff),
              })}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* 预设场景 - 场景化图标 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('environment.presets')}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {ENVIRONMENT_PRESETS.map((preset) => {
                const isActive = 
                  temp === preset.temp &&
                  wind === preset.wind &&
                  surface === preset.surface &&
                  gain === preset.gain;
                
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`relative px-4 py-3 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 scale-105 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                    title={t(`environment.preset.${preset.id}`)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{preset.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t(`environment.preset.${preset.id}`)}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 温度滑块 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>{t('environment.temp')}</span>
                <span className={`text-lg font-bold ${getTempColor(temp)}`}>
                  {temp}°C
                </span>
              </label>
            </div>
            <input
              type="range"
              min={-10}
              max={45}
              step={1}
              value={temp}
              onChange={(e) => setTemp(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('environment.tempRange.min')}</span>
              <span className="text-lime-500">{t('environment.tempRange.optimal')}</span>
              <span>{t('environment.tempRange.max')}</span>
            </div>
          </div>

          {/* 累计爬升滑块 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t('environment.elevation')}
              </label>
              <span className="text-lg font-bold text-purple-500">
                {gain}m
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={gain}
              onChange={(e) => setGain(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('environment.elevationRange.min')}</span>
              <span>{t('environment.elevationRange.mid')}</span>
              <span>{t('environment.elevationRange.max')}</span>
            </div>
          </div>

          {/* 风速滑块 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>{t('environment.wind')}</span>
                <span className={`text-lg font-bold ${getWindColor(wind)}`}>
                  {wind > 0 ? '+' : ''}{wind} km/h
                </span>
              </label>
            </div>
            <input
              type="range"
              min={-30}
              max={30}
              step={1}
              value={wind}
              onChange={(e) => setWind(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span className="text-cyan-400">{t('environment.windRange.tailwind')}</span>
              <span>{t('environment.windRange.neutral')}</span>
              <span className="text-amber-500">{t('environment.windRange.headwind')}</span>
            </div>
          </div>

          {/* 路面类型选择 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {t('environment.surface')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['asphalt', 'track', 'cobblestone', 'trail'] as SurfaceType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSurface(s)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    surface === s
                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {s === 'asphalt' && '🛣️'}
                    {s === 'track' && '🏟️'}
                    {s === 'cobblestone' && '🧱'}
                    {s === 'trail' && '🌲'}
                  </div>
                  <div className="text-xs font-medium">
                    {t(`environment.surfaces.${s}`)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 调整结果摘要 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>{t('environment.basePace')}</span>
                <span className="font-mono font-semibold">
                  {formatPace(basePaceSeconds, unit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('environment.adjustedPace')}</span>
                <span
                  className={`font-mono font-semibold ${
                    paceDiff > 0 ? 'text-amber-500' : paceDiff < 0 ? 'text-cyan-400' : ''
                  }`}
                >
                  {formatPace(adjustedPace, unit)}
                </span>
              </div>
              {paceDiff !== 0 && (
                <div className="text-xs pt-2 text-gray-500 dark:text-gray-500 italic">
                  {t('environment.summary', {
                    temp,
                    surface: t(`environment.surfaces.${surface}`),
                    adjustedPace: formatPace(adjustedPace, unit),
                    unit: unit === 'km' ? 'km' : 'mi',
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
