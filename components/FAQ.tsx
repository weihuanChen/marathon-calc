'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, HelpCircle, BookOpen } from 'lucide-react';

export function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 固定的FAQ问题数量（防止无限循环）
  const FAQ_COUNT = 7;
  const faqItems = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`questions.${i}.question`),
    answer: t(`questions.${i}.answer`),
  }));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      {/* 使用说明 */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-lime-500" size={32} />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
            {t('howToUse.title')}
          </h2>
        </div>

        <div className="space-y-6">
          {/* 步骤 */}
          {[0, 1, 2, 3].map((stepIndex) => {
            try {
              const stepTitle = t(`howToUse.steps.${stepIndex}.title`);
              const stepDescription = t(`howToUse.steps.${stepIndex}.description`);
              
              return (
                <div key={stepIndex} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {stepIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{stepTitle}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{stepDescription}</p>
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })}
        </div>

        {/* 提示 */}
        <div className="mt-8 p-4 bg-lime-50 dark:bg-lime-900/20 rounded-xl border-2 border-lime-200 dark:border-lime-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-lime-600 dark:text-lime-400">💡 {t('howToUse.tip.title')}:</span>{' '}
            {t('howToUse.tip.description')}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="text-blue-500" size={32} />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-lime-400 bg-clip-text text-transparent">
            {t('title')}
          </h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:border-lime-400 dark:hover:border-lime-500"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full flex items-center justify-between p-5 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <span className="font-semibold text-lg pr-4">{item.question}</span>
                <ChevronDown
                  className={`flex-shrink-0 text-lime-500 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  size={24}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

