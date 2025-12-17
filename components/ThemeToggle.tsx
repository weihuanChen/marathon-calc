'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

// 简单的主题切换组件，通过在 <html> 上添加/移除 `dark` class 来控制 Tailwind 暗色模式
export function ThemeToggle() {
  const t = useTranslations('theme');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const stored = window.localStorage.getItem('theme') as Theme | null;

    // 如果本地有用户偏好，就用本地；否则根据系统偏好
    const preferred: Theme =
      stored ??
      (window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');

    setTheme(preferred);
    if (preferred === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('theme', next);

    if (next === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition"
      aria-label={theme === 'dark' ? t('toggleToLight') : t('toggleToDark')}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={18} className="text-yellow-400" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('light')}</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-indigo-500" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('dark')}</span>
        </>
      )}
    </button>
  );
}

