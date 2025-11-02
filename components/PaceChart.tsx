'use client';

import { motion, useMotionValue, animate } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface PaceChartProps {
  intensity: number; // 0-1，用于影响曲线的起伏
  color: string; // 曲线颜色
}

// 生成平线路径（水平直线）
function generateFlatPath(width: number, height: number): string {
  const centerY = height / 2;
  return `M 0,${centerY} L ${width},${centerY}`;
}

// 生成随机心率图路径
function generateRandomHeartbeatPath(
  intensity: number,
  width: number,
  height: number
): string {
  const points: [number, number][] = [];
  const numPoints = 20; // 从 35 降低到 20，减少计算量
  const centerY = height / 2;

  // 根据强度计算波动幅度
  // 低强度（0-0.3）：±5-10px
  // 中强度（0.3-0.6）：±10-20px
  // 高强度（0.6-1.0）：±20-35px
  let amplitude: number;
  if (intensity < 0.3) {
    amplitude = 5 + intensity * 16.7; // 5-10px
  } else if (intensity < 0.6) {
    amplitude = 10 + (intensity - 0.3) * 33.3; // 10-20px
  } else {
    amplitude = 20 + (intensity - 0.6) * 37.5; // 20-35px
  }

  // 生成随机点
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * width;

    // 完全随机的 y 偏移（每次都不同）
    const randomOffset = (Math.random() - 0.5) * 2 * amplitude;

    // 添加一些"尖峰"效果，模拟心跳
    const isPeak = Math.random() < 0.15; // 15% 概率出现尖峰
    const peakMultiplier = isPeak ? 1.5 + Math.random() * 0.5 : 1;

    const y = centerY + randomOffset * peakMultiplier;

    // 限制在有效范围内
    const clampedY = Math.max(2, Math.min(height - 2, y));
    points.push([x, clampedY]);
  }

  // 使用线性插值而非三次贝塞尔曲线，提高性能
  let pathData = `M ${points[0][0]},${points[0][1]}`;

  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    pathData += ` L ${x},${y}`;
  }

  return pathData;
}

export function PaceChart({ intensity, color }: PaceChartProps) {
  const width = 200;
  const height = 50;

  // 初始为稳定直线，避免 SSR 与 CSR 随机差异导致水合不一致
  const [currentPath, setCurrentPath] = useState(() =>
    generateFlatPath(width, height)
  );
  const pathLengthValue = useMotionValue(1);
  const prevIntensity = useRef(intensity);

  useEffect(() => {
    // 只有当 intensity 真正改变时才触发动画
    if (Math.abs(intensity - prevIntensity.current) < 0.001) {
      return;
    }

    prevIntensity.current = intensity;

    // 两阶段动画序列
    const runAnimation = async () => {
      // 阶段 1: 先生成新的随机路径
      const newPath = generateRandomHeartbeatPath(intensity, width, height);
      setCurrentPath(newPath);

      // 重置 pathLength 并重新绘制
      pathLengthValue.set(0);
      await animate(pathLengthValue, 1, {
        duration: 0.8,
        ease: 'easeOut'
      });
    };

    runAnimation();
  }, [intensity, width, height, pathLengthValue]);

  return (
    <div className="flex justify-center">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 背景中心线 */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="0.5"
          className="opacity-20"
        />

        {/* 心率图曲线 */}
        <motion.path
          d={currentPath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
          style={{
            pathLength: pathLengthValue
          }}
          transition={{
            d: {
              type: 'spring',
              stiffness: 100,
              damping: 15,
              mass: 0.5
            }
          }}
        />

        {/* 发光效果 */}
        <motion.path
          d={currentPath}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20 blur-sm"
          style={{
            pathLength: pathLengthValue
          }}
          transition={{
            d: {
              type: 'spring',
              stiffness: 100,
              damping: 15,
              mass: 0.5
            }
          }}
        />
      </svg>
    </div>
  );
}
