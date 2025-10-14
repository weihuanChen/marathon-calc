'use client';

import { motion } from 'framer-motion';

interface ConnectionLinesProps {
  color: string; // 连接线的颜色
}

export function ConnectionLines({ color }: ConnectionLinesProps) {
  // 定义连接路径
  // 从左侧圆环中心 → 中间配速指示器 → 右侧圆环中心
  const pathData = 'M 20 50 Q 45 50, 50 50 T 80 50';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity: 0.3 }}
    >
      <defs>
        {/* 渐变定义 */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>

        {/* 流动动画渐变 */}
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0">
            <animate
              attributeName="offset"
              values="0;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor={color} stopOpacity="0.8">
            <animate
              attributeName="offset"
              values="0.5;1.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor={color} stopOpacity="0">
            <animate
              attributeName="offset"
              values="1;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>

      {/* 背景连接线（静态） */}
      <motion.path
        d={pathData}
        stroke="url(#connectionGradient)"
        strokeWidth="0.3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* 流动效果线 */}
      <motion.path
        d={pathData}
        stroke="url(#flowGradient)"
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1 }}
      />

      {/* 光晕效果 */}
      <motion.path
        d={pathData}
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        className="blur-sm"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
    </svg>
  );
}
