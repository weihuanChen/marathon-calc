'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ActivityRingProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function ActivityRing({
  label,
  value,
  percentage,
  color,
  size = 200,
  strokeWidth = 16,
}: ActivityRingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* 背景圆环 */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-800"
          />

          {/* 进度圆环 */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: mounted ? offset : circumference,
            }}
            transition={{
              duration: 1,
              ease: 'easeInOut',
            }}
          />
        </svg>

        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-3xl font-bold"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {value}
          </motion.div>
        </div>
      </div>

      {/* 标签 */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
