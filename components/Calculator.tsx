'use client';

import { useState, useEffect, useRef, useId } from 'react';
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
  calculateStrategySplits,
  SplitStrategy,
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
  const idPrefix = useId();
  const fieldIds = {
    distance: `${idPrefix}-distance`,
    hours: `${idPrefix}-hours`,
    minutes: `${idPrefix}-minutes`,
    seconds: `${idPrefix}-seconds`,
    paceMinutes: `${idPrefix}-pace-minutes`,
    paceSeconds: `${idPrefix}-pace-seconds`,
    splitStrategy: `${idPrefix}-split-strategy`,
    splitStrength: `${idPrefix}-split-strength`,
    fineTuneAfter5k: `${idPrefix}-after-5k`,
    fineTuneAfter10k: `${idPrefix}-after-10k`,
    fineTuneAfterHalf: `${idPrefix}-after-half`,
    fineTuneAfter30k: `${idPrefix}-after-30k`,
  };

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

  // 分段策略相关
  const [splitStrategy, setSplitStrategy] = useState<SplitStrategy>('even');
  // 主滑杆：后半程比前半程快 X 秒 / 每单位
  const [splitStrengthSeconds, setSplitStrengthSeconds] = useState<number>(10);
  // 高级微调展开
  const [showAdvancedSplits, setShowAdvancedSplits] = useState<boolean>(false);
  const [fineTuneAfter5k, setFineTuneAfter5k] = useState<number>(0);
  const [fineTuneAfter10k, setFineTuneAfter10k] = useState<number>(0);
  const [fineTuneAfterHalf, setFineTuneAfterHalf] = useState<number>(0);
  const [fineTuneAfter30k, setFineTuneAfter30k] = useState<number>(0);

  // 用于拖动时追踪当前值的 ref
  const currentDistanceRef = useRef<number>(42.195);
  const currentTimeSecondsRef = useRef<number>(12600);
  const previousModeRef = useRef<CalculationMode>('pace');

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
    }
  }, [mode, distance, hours, minutes, seconds, paceMinutes, paceSeconds]);

  // 当模式改变时，同步配速输入框（仅在切换到 time 或 distance 模式时）
  useEffect(() => {
    // 仅在模式从 pace 切换到其他模式时，才更新配速输入框
    if (mode !== 'pace' && previousModeRef.current === 'pace') {
      const paceTime = secondsToTime(result.paceSecondsPerUnit);
      setPaceMinutes(paceTime.minutes.toString());
      setPaceSeconds(paceTime.seconds.toString());
    }
    previousModeRef.current = mode;
  }, [mode, result.paceSecondsPerUnit]);

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

  // 分段数据（基于策略的倍率模型）
  const splits =
    result.distance > 0 && result.totalSeconds > 0
      ? calculateStrategySplits(result.distance, result.totalSeconds, {
          strategy: splitStrategy,
          unit,
          strengthSeconds: splitStrengthSeconds,
          fineTunePercent: {
            after5k: fineTuneAfter5k || undefined,
            after10k: fineTuneAfter10k || undefined,
            afterHalf: fineTuneAfterHalf || undefined,
            after30k: fineTuneAfter30k || undefined,
          },
        })
      : [];

  // 计算配速强度和颜色（用于连接线）
  const paceSecondsPerKm = unit === 'mi' ? convertPace(result.paceSecondsPerUnit, 'mi', 'km') : result.paceSecondsPerUnit;
  const intensity = getPaceIntensity(paceSecondsPerKm);
  const colors = getPaceColor(intensity);

  return (
    <div className="w-full space-y-10 px-2 md:px-4 lg:px-6">
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

      {/* 输入区域和配速计划表格 - 并排布局（桌面端稍微给右侧更多宽度） */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
        {/* 输入区域 */}
        <div className="rounded-2xl p-4 md:p-6 shadow-xl space-y-6 border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{t('title')}</h2>
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
            <label className="block text-sm font-medium mb-2" htmlFor={fieldIds.distance}>
              {t('labels.distance')}
            </label>
            <input
              type="number"
              id={fieldIds.distance}
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
          <fieldset>
            <legend className="block text-sm font-medium mb-2">{t('labels.time')}</legend>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="sr-only" htmlFor={fieldIds.hours}>
                  {t('labels.hours')}
                </label>
                <input
                  type="number"
                  id={fieldIds.hours}
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
              </div>
              <div className="space-y-1">
                <label className="sr-only" htmlFor={fieldIds.minutes}>
                  {t('labels.minutes')}
                </label>
                <input
                  type="number"
                  id={fieldIds.minutes}
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
              </div>
              <div className="space-y-1">
                <label className="sr-only" htmlFor={fieldIds.seconds}>
                  {t('labels.seconds')}
                </label>
                <input
                  type="number"
                  id={fieldIds.seconds}
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
          </fieldset>

          {/* 配速输入 */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">
              {t('labels.pace')} ({unit === 'km' ? t('units.perKm') : t('units.perMi')})
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="sr-only" htmlFor={fieldIds.paceMinutes}>
                  {t('labels.minutes')}
                </label>
                <input
                  type="number"
                  id={fieldIds.paceMinutes}
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
              </div>
              <div className="space-y-1">
                <label className="sr-only" htmlFor={fieldIds.paceSeconds}>
                  {t('labels.seconds')}
                </label>
                <input
                  type="number"
                  id={fieldIds.paceSeconds}
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
          </fieldset>

          {/* 分段策略选择 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium flex items-center gap-1" htmlFor={fieldIds.splitStrategy}>
                <span>{t('strategy.label')}</span>
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-700 dark:text-gray-200 cursor-help"
                  title={t('strategy.help')}
                >
                  ?
                </span>
              </label>
              <select
                id={fieldIds.splitStrategy}
                value={splitStrategy}
                onChange={(e) => setSplitStrategy(e.target.value as SplitStrategy)}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
              >
                <option value="even">{t('strategy.even')}</option>
                <option value="negative">{t('strategy.negative')}</option>
                <option value="slightPositive">{t('strategy.slightPositive')}</option>
                <option value="tenTenTen">{t('strategy.tenTenTen')}</option>
                <option value="custom">{t('strategy.custom')}</option>
              </select>
            </div>

            {/* 主滑杆：后半程快 X 秒 / 每单位（对匀速模式无效） */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span id={fieldIds.splitStrength}>{t('strategy.mainSliderLabel')}</span>
                <span className="font-mono">
                  {t('strategy.mainSliderValue', {
                    value: splitStrengthSeconds,
                    unit: unit === 'km' ? t('units.perKm') : t('units.perMi'),
                  })}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={splitStrengthSeconds}
                onChange={(e) => setSplitStrengthSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-lime-400"
                disabled={splitStrategy === 'even'}
                aria-labelledby={fieldIds.splitStrength}
              />
            </div>

            {/* 高级微调 */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvancedSplits((v) => !v)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAdvancedSplits ? t('strategy.advancedHide') : t('strategy.advancedShow')}
              </button>

              {showAdvancedSplits && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1" htmlFor={fieldIds.fineTuneAfter5k}>
                      {t('strategy.after5k')}
                    </label>
                    <input
                      type="number"
                      id={fieldIds.fineTuneAfter5k}
                      value={fineTuneAfter5k}
                      onChange={(e) => setFineTuneAfter5k(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1" htmlFor={fieldIds.fineTuneAfter10k}>
                      {t('strategy.after10k')}
                    </label>
                    <input
                      type="number"
                      id={fieldIds.fineTuneAfter10k}
                      value={fineTuneAfter10k}
                      onChange={(e) => setFineTuneAfter10k(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1" htmlFor={fieldIds.fineTuneAfterHalf}>
                      {t('strategy.afterHalf')}
                    </label>
                    <input
                      type="number"
                      id={fieldIds.fineTuneAfterHalf}
                      value={fineTuneAfterHalf}
                      onChange={(e) => setFineTuneAfterHalf(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1" htmlFor={fieldIds.fineTuneAfter30k}>
                      {t('strategy.after30k')}
                    </label>
                    <input
                      type="number"
                      id={fieldIds.fineTuneAfter30k}
                      value={fineTuneAfter30k}
                      onChange={(e) => setFineTuneAfter30k(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="col-span-2 text-[10px] text-gray-500 dark:text-gray-500">
                    {t('strategy.advancedHint')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 分段配速表格（外层不滚动，由内部表格区域单独滚动） */}
        <div className="rounded-2xl p-3 md:p-4 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <SplitTable splits={splits} unit={unit} />
        </div>
      </div>
    </div>
  );
}
