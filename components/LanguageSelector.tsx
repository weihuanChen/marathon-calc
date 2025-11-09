'use client';

import { Languages } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { locales } from '@/i18n.config';
import { LANGUAGE_NAMES } from '@/lib/metadata';
import { useMemo } from 'react';

interface LanguageSelectorProps {
  currentLocale: string;
}

export function LanguageSelector({ currentLocale }: LanguageSelectorProps) {
  // 优化: 使用 useMemo 避免每次都遍历 locales
  const localesList = useMemo(() => {
    return locales.map((loc) => ({
      code: loc,
      name: LANGUAGE_NAMES[loc]
    }));
  }, []);

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
        <Languages size={20} />
        <span>{LANGUAGE_NAMES[currentLocale]}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {localesList.map(({ code, name }, index) => (
          <Link
            key={code}
            href="/"
            locale={code}
            className={`block px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900/30 transition ${
              code === currentLocale ? 'bg-lime-50 dark:bg-lime-900/20 font-semibold' : ''
            } ${index === 0 ? 'rounded-t-lg' : ''} ${index === localesList.length - 1 ? 'rounded-b-lg' : ''}`}
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}

