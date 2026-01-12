'use client';

import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
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
import { EnvironmentLab } from './EnvironmentLab';
import { Repeat, Share2 } from 'lucide-react';
import { getPaceIntensity, convertPace, getPaceColor, getRacePhases, RacePhase, convertDistance, KM_TO_MI } from '@/lib/calculations';
import type { EnvironmentParams } from '@/lib/environment';
import { getAdjustedPace } from '@/lib/environment';
import { ExportCenter } from './ExportCenter';
import { deserializeShareData } from '@/lib/share-serialization';
import type { ShareData } from '@/lib/share-serialization';

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

  // 环境参数
  const [environmentParams, setEnvironmentParams] = useState<EnvironmentParams | null>(null);

  // 心率参数（可选）
  const [maxHR, setMaxHR] = useState<string>('');
  const [restHR, setRestHR] = useState<string>('60');

  // 导出中心状态
  const [isExportCenterOpen, setIsExportCenterOpen] = useState<boolean>(false);

  // 根据环境参数计算颜色效果
  // 1. 高温发光：温度 >= 25°C
  const highTempGlow = environmentParams ? environmentParams.temp >= 25 : false;

  // 2. 海拔颜色：根据爬升高度从绿色渐变到深紫色
  // 0m = 绿色 (#4ade80), 1000m+ = 深紫色 (#7c3aed)
  const getElevationColor = (gain: number): string => {
    if (gain <= 0) return '#4ade80'; // 绿色 (lime-400)
    if (gain >= 1000) return '#7c3aed'; // 深紫色 (violet-600)
    
    // RGB 插值：绿色 -> 深紫色
    const ratio = Math.min(gain / 1000, 1);
    
    // 绿色 #4ade80 (74, 222, 128) -> 深紫色 #7c3aed (124, 58, 237)
    const r1 = 74, g1 = 222, b1 = 128;
    const r2 = 124, g2 = 58, b2 = 237;
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const distanceRingColor = environmentParams
    ? getElevationColor(environmentParams.gain)
    : '#4ade80'; // 默认绿色

  // 用于拖动时追踪当前值的 ref
  const currentDistanceRef = useRef<number>(42.195);
  const currentTimeSecondsRef = useRef<number>(12600);
  const previousModeRef = useRef<CalculationMode>('pace');
  
  // URL 同步相关
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isInitializingFromURL = useRef<boolean>(false);
  const hasInitializedFromURL = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 计算结果
  const [result, setResult] = useState({
    distance: 42.195,
    totalSeconds: 12600,
    paceSecondsPerUnit: 298.6,
  });

  // 计算调整后的体感配速（需要在 result 定义之后）
  const adjustedPaceSeconds = environmentParams
    ? getAdjustedPace(result.paceSecondsPerUnit, {
        ...environmentParams,
        totalDistance: result.distance,
      })
    : undefined;

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

  // 从 URL 读取参数并初始化状态（仅在首次加载时）
  useEffect(() => {
    // 如果已经初始化过，不再执行
    if (hasInitializedFromURL.current) return;
    
    // 尝试使用新的反序列化函数
    const shareData = deserializeShareData(searchParams);
    
    if (shareData) {
      isInitializingFromURL.current = true;
      hasInitializedFromURL.current = true;

      // 设置距离
      if (shareData.distance) {
        const dist = parseFloat(shareData.distance);
        if (!isNaN(dist) && dist > 0) {
          setDistance(dist.toFixed(3));
        }
      }

      // 设置配速
      if (shareData.paceMinutes || shareData.paceSeconds) {
        const paceM = parseInt(shareData.paceMinutes || '0');
        const paceS = parseInt(shareData.paceSeconds || '0');
        if (paceM > 0 || paceS > 0) {
          setPaceMinutes(paceM.toString());
          setPaceSeconds(paceS.toString());
        }
      }

      // 设置时间
      if (shareData.hours || shareData.minutes || shareData.seconds) {
        setHours(shareData.hours || '0');
        setMinutes(shareData.minutes || '0');
        setSeconds(shareData.seconds || '0');
      }

      // 设置模式
      if (shareData.mode) {
        setMode(shareData.mode);
      }

      // 设置单位
      if (shareData.unit) {
        setUnit(shareData.unit);
      }

      // 设置策略
      if (shareData.splitStrategy) {
        setSplitStrategy(shareData.splitStrategy);
      }

      // 设置策略强度
      if (shareData.splitStrengthSeconds !== undefined) {
        setSplitStrengthSeconds(shareData.splitStrengthSeconds);
      }

      // 高级微调
      if (shareData.fineTuneAfter5k !== undefined) {
        setFineTuneAfter5k(shareData.fineTuneAfter5k);
      }
      if (shareData.fineTuneAfter10k !== undefined) {
        setFineTuneAfter10k(shareData.fineTuneAfter10k);
      }
      if (shareData.fineTuneAfterHalf !== undefined) {
        setFineTuneAfterHalf(shareData.fineTuneAfterHalf);
      }
      if (shareData.fineTuneAfter30k !== undefined) {
        setFineTuneAfter30k(shareData.fineTuneAfter30k);
      }

      // 环境参数
      if (shareData.environmentParams) {
        setEnvironmentParams({
          ...shareData.environmentParams,
          totalDistance: parseFloat(shareData.distance || '42.195'),
        });
      }

      // 心率参数
      if (shareData.maxHR) {
        setMaxHR(shareData.maxHR);
      }
      if (shareData.restHR) {
        setRestHR(shareData.restHR);
      }

      // 标记初始化完成（延迟一点确保状态更新完成）
      setTimeout(() => {
        isInitializingFromURL.current = false;
      }, 500); // 增加延迟以支持动画
    } else {
      // 降级到旧的URL参数解析方式
      const distParam = searchParams.get('dist');
      const paceParam = searchParams.get('pace');
      const timeParam = searchParams.get('time');
      const modeParam = searchParams.get('mode');
      const unitParam = searchParams.get('unit');
      const strategyParam = searchParams.get('strategy');
      const strengthParam = searchParams.get('strength');

      // 只有在 URL 中有参数时才初始化
      if (distParam || paceParam || timeParam || modeParam || unitParam || strategyParam || strengthParam) {
        isInitializingFromURL.current = true;
        hasInitializedFromURL.current = true;

        // 设置距离
        if (distParam) {
          const dist = parseFloat(distParam);
          if (!isNaN(dist) && dist > 0) {
            setDistance(dist.toFixed(3));
          }
        }

        // 设置配速
        if (paceParam) {
          const paceTotal = parseInt(paceParam, 10);
          if (!isNaN(paceTotal) && paceTotal > 0) {
            const paceTime = secondsToTime(paceTotal);
            setPaceMinutes(paceTime.minutes.toString());
            setPaceSeconds(paceTime.seconds.toString());
          }
        }

        // 设置时间
        if (timeParam) {
          const timeTotal = parseInt(timeParam, 10);
          if (!isNaN(timeTotal) && timeTotal >= 0) {
            const timeObj = secondsToTime(timeTotal);
            setHours(timeObj.hours.toString());
            setMinutes(timeObj.minutes.toString());
            setSeconds(timeObj.seconds.toString());
          }
        }

        // 设置模式
        if (modeParam && ['pace', 'time', 'distance'].includes(modeParam)) {
          setMode(modeParam as CalculationMode);
        }

        // 设置单位
        if (unitParam && ['km', 'mi'].includes(unitParam)) {
          setUnit(unitParam as Unit);
        }

        // 设置策略
        if (strategyParam && ['even', 'negative', 'slightPositive', 'tenTenTen', 'custom'].includes(strategyParam)) {
          setSplitStrategy(strategyParam as SplitStrategy);
        }

        // 设置策略强度
        if (strengthParam) {
          const strength = parseInt(strengthParam, 10);
          if (!isNaN(strength) && strength >= 0 && strength <= 60) {
            setSplitStrengthSeconds(strength);
          }
        }

        // 标记初始化完成（延迟一点确保状态更新完成）
        setTimeout(() => {
          isInitializingFromURL.current = false;
        }, 200);
      }
    }
  }, [searchParams]);

  // 防抖更新 URL 的函数
  const updateURL = useCallback((params: Record<string, string | null>) => {
    // 如果正在从 URL 初始化，不更新 URL
    if (isInitializingFromURL.current) return;

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(() => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });

      const newURL = `${pathname}?${newSearchParams.toString()}`;
      router.replace(newURL, { scroll: false });
    }, 300); // 300ms 防抖
  }, [searchParams, pathname, router]);

  // 监听状态变化并更新 URL
  useEffect(() => {
    if (isInitializingFromURL.current) return;

    const paceTotal = parseInt(paceMinutes) * 60 + parseInt(paceSeconds);
    const timeTotal = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    updateURL({
      dist: distance && parseFloat(distance) > 0 ? distance : null,
      pace: paceTotal > 0 ? paceTotal.toString() : null,
      time: timeTotal >= 0 ? timeTotal.toString() : null,
      mode: mode !== 'pace' ? mode : null, // 默认模式不写入 URL
      unit: unit !== 'km' ? unit : null, // 默认单位不写入 URL
      strategy: splitStrategy !== 'even' ? splitStrategy : null, // 默认策略不写入 URL
      strength: splitStrengthSeconds !== 10 ? splitStrengthSeconds.toString() : null, // 默认强度不写入 URL
    });
  }, [distance, paceMinutes, paceSeconds, hours, minutes, seconds, mode, unit, splitStrategy, splitStrengthSeconds, updateURL]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

  // 检查是否是马拉松距离，获取Race Phases
  const totalDistanceKm = unit === 'km' ? result.distance : convertDistance(result.distance, 'mi', 'km');
  const phases = getRacePhases(totalDistanceKm);
  const hasRacePhases = phases.length > 0;

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
          color={distanceRingColor}
          disabled={mode === 'distance'}
          onPercentageChange={handleDistancePercentageChange}
        />

        <PaceIndicator
          paceSeconds={result.paceSecondsPerUnit}
          unit={unit}
          paceDisplay={paceDisplay}
          highTempGlow={highTempGlow}
          adjustedPaceSeconds={adjustedPaceSeconds}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportCenterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                title={t('export.title')}
              >
                <Share2 size={18} />
                {t('export.button')}
              </button>
              <button
                onClick={toggleUnit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Repeat size={18} />
                {unit === 'km' ? t('units.metric') : t('units.imperial')}
              </button>
            </div>
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
          <fieldset className="space-y-3">
            <legend className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('labels.time')}
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={fieldIds.hours}>
                  {t('labels.hours')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={fieldIds.hours}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    disabled={mode === 'time'}
                    placeholder="0"
                    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 text-center text-lg font-semibold transition-all ${
                      mode === 'time'
                        ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-700 dark:text-lime-300 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                    }`}
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none">
                    h
                  </span>
                </div>
              </div>
              <div className="relative space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={fieldIds.minutes}>
                  {t('labels.minutes')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={fieldIds.minutes}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    disabled={mode === 'time'}
                    placeholder="0"
                    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 text-center text-lg font-semibold transition-all ${
                      mode === 'time'
                        ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-700 dark:text-lime-300 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                    }`}
                    min="0"
                    max="59"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none">
                    m
                  </span>
                </div>
              </div>
              <div className="relative space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={fieldIds.seconds}>
                  {t('labels.seconds')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={fieldIds.seconds}
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    disabled={mode === 'time'}
                    placeholder="0"
                    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 text-center text-lg font-semibold transition-all ${
                      mode === 'time'
                        ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-700 dark:text-lime-300 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                    }`}
                    min="0"
                    max="59"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none">
                    s
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* 配速输入 */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('labels.pace')} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({unit === 'km' ? t('units.perKm') : t('units.perMi')})
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={fieldIds.paceMinutes}>
                  {t('labels.minutes')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={fieldIds.paceMinutes}
                    value={paceMinutes}
                    onChange={(e) => setPaceMinutes(e.target.value)}
                    disabled={mode === 'pace'}
                    placeholder="0"
                    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 text-center text-lg font-semibold transition-all ${
                      mode === 'pace'
                        ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-700 dark:text-lime-300 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                    }`}
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none">
                    m
                  </span>
                </div>
              </div>
              <div className="relative space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={fieldIds.paceSeconds}>
                  {t('labels.seconds')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={fieldIds.paceSeconds}
                    value={paceSeconds}
                    onChange={(e) => setPaceSeconds(e.target.value)}
                    disabled={mode === 'pace'}
                    placeholder="0"
                    className={`w-full px-4 py-3 pr-10 rounded-lg border-2 text-center text-lg font-semibold transition-all ${
                      mode === 'pace'
                        ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-400 text-lime-700 dark:text-lime-300 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                    }`}
                    min="0"
                    max="59"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none">
                    s
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* 心率输入（可选） */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('heartRate.title')} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({t('heartRate.optional')})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={`${idPrefix}-maxHR`}>
                  {t('heartRate.maxHR')}
                </label>
                <input
                  type="number"
                  id={`${idPrefix}-maxHR`}
                  value={maxHR}
                  onChange={(e) => setMaxHR(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                  min="100"
                  max="250"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor={`${idPrefix}-restHR`}>
                  {t('heartRate.restHR')}
                </label>
                <input
                  type="number"
                  id={`${idPrefix}-restHR`}
                  value={restHR}
                  onChange={(e) => setRestHR(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                  min="40"
                  max="100"
                />
              </div>
            </div>
            {maxHR && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {t('heartRate.hint')}
              </div>
            )}
          </div>

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
          <SplitTable
            splits={splits}
            unit={unit}
            maxHR={maxHR ? parseInt(maxHR, 10) : undefined}
            restHR={restHR ? parseInt(restHR, 10) : 60}
          />
        </div>
      </div>

      {/* 环境实验室 */}
      <EnvironmentLab
        basePaceSeconds={result.paceSecondsPerUnit}
        totalDistance={result.distance}
        unit={unit}
        onParamsChange={setEnvironmentParams}
      />

      {/* Race Day Notes - 根据阶段自动生成建议 */}
      {hasRacePhases && (
        <div className="rounded-2xl p-4 md:p-6 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <h3 className="text-lg font-bold mb-4">{t('raceDayNotes.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((phase) => {
              const phaseKey = phase.phase;
              return (
                <div
                  key={phaseKey}
                  className="rounded-xl p-4 border-2"
                  style={{ borderColor: phase.color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: phase.color }}
                    />
                    <h4 className="font-semibold text-sm">{t(`raceDayNotes.phases.${phaseKey}.title`)}</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(`raceDayNotes.phases.${phaseKey}.advice`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 导出中心 */}
      <ExportCenter
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        shareData={{
          distance,
          hours,
          minutes,
          seconds,
          paceMinutes,
          paceSeconds,
          mode,
          unit,
          splitStrategy,
          splitStrengthSeconds,
          fineTuneAfter5k: fineTuneAfter5k || undefined,
          fineTuneAfter10k: fineTuneAfter10k || undefined,
          fineTuneAfterHalf: fineTuneAfterHalf || undefined,
          fineTuneAfter30k: fineTuneAfter30k || undefined,
          environmentParams: environmentParams ? {
            temp: environmentParams.temp,
            wind: environmentParams.wind,
            surface: environmentParams.surface,
            gain: environmentParams.gain,
            loss: environmentParams.loss,
          } : undefined,
          maxHR: maxHR || undefined,
          restHR: restHR !== '60' ? restHR : undefined,
        }}
        result={result}
        unit={unit}
        splits={splits}
        environmentParams={environmentParams}
      />
    </div>
  );
}
