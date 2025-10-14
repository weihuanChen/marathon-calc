import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 获取配速颜色（基于强度）
export function getPaceColor(intensity: number): string {
  // 从绿色（#4ade80）到橙色（#fb923c）的渐变
  const green = { r: 74, g: 222, b: 128 };
  const orange = { r: 251, g: 146, b: 60 };

  const r = Math.round(green.r + (orange.r - green.r) * intensity);
  const g = Math.round(green.g + (orange.g - green.g) * intensity);
  const b = Math.round(green.b + (orange.b - green.b) * intensity);

  return `rgb(${r}, ${g}, ${b})`;
}

// 数字格式化（保留小数位）
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

// 验证输入是否为有效数字
export function isValidNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num) && num >= 0;
}

// 限制数字范围
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
