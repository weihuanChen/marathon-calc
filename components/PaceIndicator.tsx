'use client';

import { motion } from 'framer-motion';
import { convertPace, getPaceIntensity, getPaceColor } from '@/lib/calculations';
import { useTranslations } from 'next-intl';
import { PaceChart } from './PaceChart';

interface PaceIndicatorProps {
  paceSeconds: number;
  unit: 'km' | 'mi';
  paceDisplay: string;
}

export function PaceIndicator({ paceSeconds, unit, paceDisplay }: PaceIndicatorProps) {
  const t = useTranslations('indicators');

  // 转换到公里配速以计算强度（归一化）
  const paceSecondsPerKm = unit === 'mi' ? convertPace(paceSeconds, 'mi', 'km') : paceSeconds;
  const intensity = getPaceIntensity(paceSecondsPerKm);

  // 获取动态配色
  const colors = getPaceColor(intensity);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 大号配速显示 */}
      <motion.div
        className="text-7xl font-bold"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        key={paceDisplay}
      >
        <motion.span
          className="bg-gradient-to-br bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`
          }}
          animate={{
            backgroundImage: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`
          }}
          transition={{ duration: 0.6 }}
        >
          {paceDisplay}
        </motion.span>
        <span className="text-3xl text-gray-500 dark:text-gray-400 ml-2">
          {unit === 'km' ? '/ km' : '/ mi'}
        </span>
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
