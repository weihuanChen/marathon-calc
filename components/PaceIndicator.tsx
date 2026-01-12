'use client';

import { motion } from 'framer-motion';
import { convertPace, getPaceIntensity, getPaceColor, formatPace } from '@/lib/calculations';
import { useTranslations } from 'next-intl';
import { PaceChart } from './PaceChart';

interface PaceIndicatorProps {
  paceSeconds: number;
  unit: 'km' | 'mi';
  paceDisplay: string;
  highTempGlow?: boolean; // 高温时的橙色发光效果
  adjustedPaceSeconds?: number; // 调整后的体感配速（秒/单位）
}

export function PaceIndicator({ 
  paceSeconds, 
  unit, 
  paceDisplay, 
  highTempGlow = false,
  adjustedPaceSeconds 
}: PaceIndicatorProps) {
  const t = useTranslations('indicators');
  const tEnv = useTranslations('environment');

  // 转换到公里配速以计算强度（归一化）
  const paceSecondsPerKm = unit === 'mi' ? convertPace(paceSeconds, 'mi', 'km') : paceSeconds;
  const intensity = getPaceIntensity(paceSecondsPerKm);

  // 获取动态配色
  const colors = getPaceColor(intensity);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 大号配速显示 */}
      <motion.div
        className={`text-7xl font-bold relative ${highTempGlow ? 'px-4 py-2 rounded-2xl' : ''}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        key={paceDisplay}
      >
        {highTempGlow && (
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.6), rgba(249, 115, 22, 0.6))',
            }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        <motion.span
          className={`bg-gradient-to-br bg-clip-text text-transparent relative z-10 ${
            highTempGlow ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : ''
          }`}
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`
          }}
          transition={{ duration: 0.6 }}
        >
          {paceDisplay}
        </motion.span>
        <span className="text-3xl text-gray-500 dark:text-gray-400 ml-2 relative z-10">
          {unit === 'km' ? '/ km' : '/ mi'}
        </span>
        {/* 体感配速提示 */}
        {adjustedPaceSeconds && adjustedPaceSeconds !== paceSeconds && (
          <motion.div
            className="mt-2 text-sm opacity-60 dark:opacity-50 text-gray-600 dark:text-gray-400 font-mono"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {paceDisplay} → {formatPace(adjustedPaceSeconds, unit)} ({tEnv('effortLabel')})
          </motion.div>
        )}
      </motion.div>

      {/* 心率图表 */}
      <div className="w-full max-w-md">
        <PaceChart intensity={intensity} color={colors.to} />
      </div>

      {/* 色彩强度条 */}
      <div className="w-full max-w-md">
        <div className="relative h-10 rounded-full overflow-hidden bg-gradient-to-r from-cyan-400 via-lime-400 via-yellow-400 to-red-400">
          {/* 指示器箭头 */}
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            initial={{ left: '0%' }}
            animate={{ left: `${intensity * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white" />
          </motion.div>
        </div>

        {/* 标签 */}
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{t('easy')}</span>
          <span>{t('fast')}</span>
        </div>
      </div>
    </div>
  );
}
