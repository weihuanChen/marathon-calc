'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  calculatePace,
  calculateTime,
  calculateDistance,
  formatTime,
  formatPace,
  secondsToTime,
  getPresetDistance,
  PresetKey,
  getRingPercentage,
  calculateSplits,
} from '@/lib/calculations';
import { formatNumber } from '@/lib/utils';
import { DraggableActivityRing } from './DraggableActivityRing';
import { PaceIndicator } from './PaceIndicator';
import { SplitTable } from './SplitTable';
import { ConnectionLines } from './ConnectionLines';
import { Repeat } from 'lucide-react';
import { getPaceIntensity, convertPace, getPaceColor } from '@/lib/calculations';

type CalculationMode = 'pace' | 'time' | 'distance';
type Unit = 'km' | 'mi';

export function Calculator() {
  const t = useTranslations();

  // 状态管理
  const [mode, setMode] = useState<CalculationMode>('pace');
  const [unit, setUnit] = useState<Unit>('km');

  // 输入值
  const [distance, setDistance] = useState<string>('42.195');
  const [hours, setHours] = useState<string>('3');
  const [minutes, setMinutes] = useState<string>('30');
  const [seconds, setSeconds] = useState<string>('0');
  const [paceMinutes, setPaceMinutes] = useState<string>('5');
  const [paceSeconds, setPaceSeconds] = useState<string>('0');

  // 用于拖动时追踪当前值的 ref
  const currentDistanceRef = useRef<number>(42.195);
  const currentTimeSecondsRef = useRef<number>(12600);

  // 计算结果
  const [result, setResult] = useState({
    distance: 42.195,
    totalSeconds: 12600,
    paceSecondsPerUnit: 298.6,
  });

  // 计算逻辑
  useEffect(() => {
    const dist = parseFloat(distance) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const paceM = parseInt(paceMinutes) || 0;
    const paceS = parseInt(paceSeconds) || 0;
    const pace = paceM * 60 + paceS;

    let newResult;

    if (mode === 'pace' && dist > 0) {
      const paceResult = calculatePace(dist, h, m, s);
      newResult = {
        distance: dist,
        totalSeconds: h * 3600 + m * 60 + s,
        paceSecondsPerUnit: paceResult,
      };
    } else if (mode === 'time' && dist > 0 && pace > 0) {
      const timeResult = calculateTime(dist, pace);
      newResult = {
        distance: dist,
        totalSeconds: timeResult,
        paceSecondsPerUnit: pace,
      };
    } else if (mode === 'distance' && pace > 0) {
      const distanceResult = calculateDistance(h, m, s, pace);
      newResult = {
        distance: distanceResult,
        totalSeconds: h * 3600 + m * 60 + s,
        paceSecondsPerUnit: pace,
      };
    }

    if (newResult) {
      setResult(newResult);
      // 同步更新 ref
      currentDistanceRef.current = newResult.distance;
      currentTimeSecondsRef.current = newResult.totalSeconds;
      
      // 同步更新配速输入框
      const paceTime = secondsToTime(newResult.paceSecondsPerUnit);
      setPaceMinutes(paceTime.minutes.toString());
      setPaceSeconds(paceTime.seconds.toString());
    }
  }, [mode, distance, hours, minutes, seconds, paceMinutes, paceSeconds]);

  // 预设距离处理
  const handlePreset = (key: PresetKey) => {
    const presetDist = getPresetDistance(key, unit);
    setDistance(presetDist.toFixed(3));
  };

  // 单位切换
  const toggleUnit = () => {
    const newUnit: Unit = unit === 'km' ? 'mi' : 'km';
    const currentDist = parseFloat(distance) || 0;

    if (unit === 'km') {
      // km -> mi
      setDistance((currentDist * 0.621371).toFixed(3));
    } else {
      // mi -> km
      setDistance((currentDist * 1.60934).toFixed(3));
    }

    setUnit(newUnit);
  };

  // 距离拖动处理 - 根据圆环百分比计算距离
  const handleDistancePercentageChange = (percentage: number) => {
    // 距离圆环的最大值是 50km（从 getRingPercentage 中可以看出）
    const maxDistance = 50;
    const newDist = Math.max(0.001, (percentage / 100) * maxDistance);
    currentDistanceRef.current = newDist;
    setDistance(newDist.toFixed(3));
  };

  // 时间拖动处理 - 根据圆环百分比计算时间
  const handleTimePercentageChange = (percentage: number) => {
    // 时间圆环的最大值是 5 小时（从 getRingPercentage 中可以看出）
    const maxHours = 5;
    const newTotalSeconds = Math.max(0, (percentage / 100) * maxHours * 3600);
    currentTimeSecondsRef.current = newTotalSeconds;

    const timeObj = secondsToTime(newTotalSeconds);
    setHours(timeObj.hours.toString());
    setMinutes(timeObj.minutes.toString());
    setSeconds(timeObj.seconds.toString());
  };

  // 格式化显示
  const timeObj = secondsToTime(result.totalSeconds);
  const distanceDisplay = `${formatNumber(result.distance, 2)} ${unit}`;
  const timeDisplay = formatTime(timeObj.hours, timeObj.minutes, timeObj.seconds);
  const paceDisplay = formatPace(result.paceSecondsPerUnit, unit);

  // 圆环百分比
  const distancePercentage = getRingPercentage(result.distance, 50);
  const timePercentage = getRingPercentage(result.totalSeconds / 3600, 5);

  // 分段数据
  const splits = calculateSplits(result.distance, result.paceSecondsPerUnit, unit);

  // 计算配速强度和颜色（用于连接线）
  const paceSecondsPerKm = unit === 'mi' ? convertPace(result.paceSecondsPerUnit, 'mi', 'km') : result.paceSecondsPerUnit;
  const intensity = getPaceIntensity(paceSecondsPerKm);
  const colors = getPaceColor(intensity);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 p-6">
      {/* 模式选择器 */}
      <div className="flex justify-center gap-4">
        {(['pace', 'time', 'distance'] as CalculationMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              mode === m
                ? 'bg-lime-400 text-black shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {t(`modes.${m}`)}
          </button>
        ))}
      </div>

      {/* 仪表盘 - 圆环和配速指示器 */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* 连接线效果 */}
        <div className="hidden lg:block absolute inset-0 -z-10">
          <ConnectionLines color={colors.to} />
        </div>

        <DraggableActivityRing
          label={t('indicators.distance')}
          value={distanceDisplay}
          percentage={distancePercentage}
          color="#4ade80"
          disabled={mode === 'distance'}
          onPercentageChange={handleDistancePercentageChange}
        />

        <PaceIndicator
          paceSeconds={result.paceSecondsPerUnit}
          unit={unit}
          paceDisplay={paceDisplay}
        />

        <DraggableActivityRing
          label={t('indicators.time')}
          value={timeDisplay}
          percentage={timePercentage}
          color="#3b82f6"
          disabled={mode === 'time'}
          onPercentageChange={handleTimePercentageChange}
        />
      </div>

      {/* 输入区域和分段配速表格 - 并排布局 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 输入区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{t('title')}</h3>
            <button
              onClick={toggleUnit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Repeat size={18} />
              {unit === 'km' ? t('units.metric') : t('units.imperial')}
            </button>
          </div>

          {/* 距离输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('labels.distance')}</label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={mode === 'distance'}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                mode === 'distance'
                  ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
              step="0.001"
            />
          </div>

          {/* 预设距离 */}
          <div className="flex flex-wrap gap-2">
            {(['5k', '10k', 'halfMarathon', 'marathon', '50k'] as PresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-lime-400 hover:text-black transition text-sm"
              >
                {t(`presets.${key}`)}
              </button>
            ))}
          </div>

          {/* 时间输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('labels.time')}</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={mode === 'time'}
                placeholder={t('labels.hours')}
                className={`px-4 py-3 rounded-lg border-2 ${
                  mode === 'time'
                    ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                min="0"
              />
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                disabled={mode === 'time'}
                placeholder={t('labels.minutes')}
                className={`px-4 py-3 rounded-lg border-2 ${
                  mode === 'time'
                    ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                min="0"
                max="59"
              />
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                disabled={mode === 'time'}
                placeholder={t('labels.seconds')}
                className={`px-4 py-3 rounded-lg border-2 ${
                  mode === 'time'
                    ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                min="0"
                max="59"
              />
            </div>
          </div>

          {/* 配速输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('labels.pace')} ({unit === 'km' ? t('units.perKm') : t('units.perMi')})
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={paceMinutes}
                onChange={(e) => setPaceMinutes(e.target.value)}
                disabled={mode === 'pace'}
                placeholder={t('labels.minutes')}
                className={`px-4 py-3 rounded-lg border-2 ${
                  mode === 'pace'
                    ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                min="0"
              />
              <input
                type="number"
                value={paceSeconds}
                onChange={(e) => setPaceSeconds(e.target.value)}
                disabled={mode === 'pace'}
                placeholder={t('labels.seconds')}
                className={`px-4 py-3 rounded-lg border-2 ${
                  mode === 'pace'
                    ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 font-bold'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
                min="0"
                max="59"
              />
            </div>
          </div>
        </div>

        {/* 分段配速表格 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="h-96 overflow-y-auto">
            <SplitTable splits={splits} unit={unit} />
          </div>
        </div>
      </div>
    </div>
  );
}
