'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';

interface DraggableActivityRingProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  disabled?: boolean;
  onPercentageChange?: (percentage: number) => void;
}

export function DraggableActivityRing({
  label,
  value,
  percentage,
  color,
  size = 200,
  strokeWidth = 16,
  disabled = false,
  onPercentageChange,
}: DraggableActivityRingProps) {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // 计算鼠标位置对应的百分比（圆环从顶部-90度开始）
  const getPercentageFromMouse = useCallback((clientX: number, clientY: number): number => {
    if (!containerRef.current) return 0;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // 计算角度（-180 到 180）
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // 转换为从顶部开始的角度（0-360）
    // SVG 圆环从-90度开始，所以加90度
    let normalizedAngle = angle + 90;
    if (normalizedAngle < 0) normalizedAngle += 360;

    // 转换为百分比
    const percentage = (normalizedAngle / 360) * 100;

    // 限制在0-100范围内
    return Math.max(0, Math.min(100, percentage));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || !onPercentageChange) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    // 立即更新到鼠标位置
    const newPercentage = getPercentageFromMouse(e.clientX, e.clientY);
    onPercentageChange(newPercentage);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!onPercentageChange) return;

    e.preventDefault();

    // 实时计算并更新百分比
    const newPercentage = getPercentageFromMouse(e.clientX, e.clientY);
    onPercentageChange(newPercentage);
  }, [onPercentageChange, getPercentageFromMouse]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      // 阻止默认的滚动和选择行为
      const preventDefaults = (e: Event) => {
        e.preventDefault();
      };

      document.body.style.userSelect = 'none';
      document.body.style.overflow = 'hidden';

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('scroll', preventDefaults, { passive: false });
      window.addEventListener('touchmove', preventDefaults, { passive: false });

      return () => {
        document.body.style.userSelect = '';
        document.body.style.overflow = '';

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('scroll', preventDefaults);
        window.removeEventListener('touchmove', preventDefaults);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !onPercentageChange) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    const touch = e.touches[0];
    const newPercentage = getPercentageFromMouse(touch.clientX, touch.clientY);
    onPercentageChange(newPercentage);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!onPercentageChange) return;

    e.preventDefault();

    const touch = e.touches[0];
    const newPercentage = getPercentageFromMouse(touch.clientX, touch.clientY);
    onPercentageChange(newPercentage);
  }, [onPercentageChange, getPercentageFromMouse]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const preventDefaults = (e: Event) => {
        e.preventDefault();
      };

      document.body.style.userSelect = 'none';
      document.body.style.overflow = 'hidden';

      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('scroll', preventDefaults, { passive: false });

      return () => {
        document.body.style.userSelect = '';
        document.body.style.overflow = '';

        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('scroll', preventDefaults);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className={`relative ${
          !disabled && onPercentageChange
            ? isDragging
              ? 'cursor-grabbing scale-105'
              : 'cursor-grab hover:scale-105'
            : 'cursor-default'
        } transition-transform duration-200`}
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className="text-3xl font-bold"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {value}
          </motion.div>
        </div>

        {/* 拖动提示 */}
        {!disabled && onPercentageChange && !isDragging && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
              拖动调整
            </div>
          </div>
        )}
      </div>

      {/* 标签 */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
