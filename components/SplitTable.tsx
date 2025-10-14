'use client';

import { useTranslations } from 'next-intl';
import { SplitData } from '@/lib/calculations';

interface SplitTableProps {
  splits: SplitData[];
  unit: 'km' | 'mi';
}

export function SplitTable({ splits, unit }: SplitTableProps) {
  const t = useTranslations('splits');

  if (splits.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
      <h3 className="text-2xl font-bold mb-6">{t('title')}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('splitNumber')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('pacePerSplit')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                {t('cumulativeTime')}
              </th>
            </tr>
          </thead>
          <tbody>
            {splits.map((split, index) => (
              <tr
                key={split.splitNumber}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                } hover:bg-lime-50 dark:hover:bg-lime-900/20 transition`}
              >
                <td className="px-4 py-3 font-medium">
                  {split.splitNumber} {unit}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {split.pacePerSplit}
                </td>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                  {split.cumulativeTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
