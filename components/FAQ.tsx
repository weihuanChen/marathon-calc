'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, HelpCircle, BookOpen } from 'lucide-react';

export function FAQ() {
  const t = useTranslations('faq');
  const locale = useLocale();
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
      <section className="rounded-2xl p-8 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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

      {/* SEO 说明文案 + Pace 策略说明（英文版本） */}
      {locale === 'en' && (
        <>
          <section className="rounded-2xl p-8 shadow-xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Marathon Pace Calculator &amp; Split Strategy Planner
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              <p>
                This Marathon Pace Calculator helps runners calculate accurate pacing plans based on a target finish time,
                average pace, or race distance.
              </p>
              <p>
                Instead of showing a single average pace, the calculator generates a clear, structured split strategy,
                allowing runners to manage effort more effectively throughout the race while keeping the total finish time
                unchanged.
              </p>
              <p>
                This tool is designed for full marathons, half marathons, and long-distance running events.
              </p>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Pace Strategy Options
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Even Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Even Split Pace
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Maintain a consistent pace from start to finish. This is the simplest and most reliable pacing method,
                  ideal for first-time marathon runners or those focused on steady execution.
                </p>
              </div>

              {/* Negative Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Negative Split Pace
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Run the first half slightly slower and gradually increase pace in the second half. Commonly used by
                  experienced runners aiming for better late-race performance and improved consistency.
                </p>
              </div>

              {/* Slight Positive Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Slight Positive Split Pace
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Start slightly faster and allow a controlled pace decrease later in the race. This strategy reflects
                  the reality of many recreational runners and can be easier to execute under race conditions.
                </p>
              </div>

              {/* Segmented Pace Strategy */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Segmented Pace Strategy
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Divide the race into multiple sections, each with its own pacing target. This approach reduces mental
                  load and helps runners focus on executing one stage at a time.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              How the Split Pace Is Calculated
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>All strategies are calculated using the same target finish time.</li>
              <li>Different strategies only adjust how pace is distributed across the race.</li>
              <li>Split results can be displayed per kilometer, per 5 km, or by key race checkpoints.</li>
              <li>All pacing data is theoretical and should be adjusted based on fitness and conditions.</li>
            </ul>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Why Use a Split-Based Pace Calculator?
            </h2>
            <div className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                A well-planned pacing strategy improves energy management, reduces late-race fatigue, and increases the
                chance of finishing strong.
              </p>
              <p>
                By focusing on split execution instead of average pace alone, runners can race more consistently and
                confidently.
              </p>
            </div>
          </section>
        </>
      )}

      {/* SEO 说明文案 + Pace 策略说明（中文版本） */}
      {locale === 'zh' && (
        <>
          <section className="rounded-2xl p-8 shadow-xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              马拉松配速计算器 &amp; 分段配速策略规划
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              <p>
                本马拉松配速计算器可以根据目标完赛时间、平均配速或比赛距离，生成精确的配速方案。
              </p>
              <p>
                与只给出一个平均配速不同，本工具会生成结构清晰的分段配速策略，在总完赛时间不变的前提下，帮助你更好地管理整场比赛中的体力分配。
              </p>
              <p>
                适用于全程马拉松、半程马拉松以及其他中长距离路跑赛事。
              </p>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              配速策略选项
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Even Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  匀速配速（Even Split Pace）
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  从起跑到冲线始终保持相对稳定的配速。此策略简单易执行、容错率高，非常适合首马选手或希望稳稳完赛的跑者。
                </p>
              </div>

              {/* Negative Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  负分段配速（Negative Split Pace）
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  前半程略微保守，后半程逐步提速。常见于有经验、希望在后程发力并提升整体稳定性的进阶跑者。
                </p>
              </div>

              {/* Slight Positive Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  轻微正分段配速（Slight Positive Split Pace）
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  开始阶段略快一些，后程允许在可控范围内小幅掉速。该策略更贴近大部分大众跑者在比赛中的真实节奏，也更容易在比赛环境中执行。
                </p>
              </div>

              {/* Segmented Pace Strategy */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  分段区块配速策略（Segmented Pace Strategy）
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  将整场比赛拆分为多个关键区段，每个区段设置独立的配速目标。这种方式能有效降低心理压力，让你一次只专注完成当前阶段。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              分段配速是如何计算的？
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>所有配速策略都基于相同的目标完赛时间进行计算。</li>
              <li>不同策略只是在总时间不变的前提下，调整全程中各阶段配速的分布方式。</li>
              <li>分段结果可以按每公里、每 5 公里，或按关键比赛节点（如 5K / 10K / 半程 / 30K 等）展示。</li>
              <li>所有配速数据均为理论参考值，应结合个人体能状态、赛道起伏和天气情况进行调整。</li>
            </ul>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              为什么要使用分段配速计算器？
            </h2>
            <div className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                一套经过规划的配速策略，有助于更好地管理能量输出、减轻后半程疲劳感，并显著提升稳稳跑完全程甚至“逆袭冲线”的概率。
              </p>
              <p>
                相比只盯着一个平均配速，专注于每一段的执行情况，可以让你全程跑得更从容、更可控，也更有信心调整节奏应对临场变化。
              </p>
            </div>
          </section>
        </>
      )}

      {/* SEO 说明文案 + Pace 策略说明（法语版本） */}
      {locale === 'fr' && (
        <>
          <section className="rounded-2xl p-8 shadow-xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Calculateur d’allure marathon &amp; plan de stratégie de passages
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              <p>
                Ce calculateur d’allure pour marathon vous aide à bâtir un vrai plan de course à partir d’un temps
                d’arrivée visé, d’une allure moyenne ou d’une distance de course que vous connaissez déjà.
              </p>
              <p>
                Au lieu d’afficher seulement une allure moyenne unique, l’outil génère une stratégie de passages claire
                et structurée, pour mieux répartir l’effort tout au long de la course sans changer l’objectif chrono.
              </p>
              <p>
                Il est pensé pour le marathon, le semi-marathon et les courses longue distance sur route (10 km, 20 km,
                etc.).
              </p>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Options de stratégie d’allure
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Even Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Allure régulière (Even Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Garder une allure aussi stable que possible du départ à l’arrivée. C’est la méthode la plus simple
                  et la plus sûre, idéale pour un premier marathon ou pour les coureurs qui veulent surtout courir “propre”
                  sans se mettre dans le rouge.
                </p>
              </div>

              {/* Negative Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Allure en negative split (Negative Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Passer la première moitié un peu plus lentement que l’allure cible, puis accélérer progressivement
                  sur la seconde moitié. C’est une approche très utilisée par les coureurs expérimentés qui veulent
                  garder du jus pour “remonter du monde” en fin de course.
                </p>
              </div>

              {/* Slight Positive Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Léger positive split (Slight Positive Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Partir légèrement plus vite au début, puis accepter une petite baisse de rythme contrôlée sur la fin.
                  Cette stratégie colle à la réalité de beaucoup de coureurs loisir et peut être plus simple à gérer
                  le jour J, surtout sur des parcours populaires.
                </p>
              </div>

              {/* Segmented Pace Strategy */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Stratégie par segments (Segmented Pace Strategy)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Découper la course en plusieurs sections (ex. 0–10 km, 10–21 km, 21–30 km, etc.), chacune avec une
                  allure cible. Cette approche allège la charge mentale et permet de se concentrer sur “un bloc après
                  l’autre” plutôt que sur l’intégralité des 42 km.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Comment sont calculées les allures par segment ?
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>
                Toutes les stratégies partent du même temps d’arrivée cible : seul le profil d’allure change, pas le chrono visé.
              </li>
              <li>
                Les différentes options modifient uniquement la façon dont l’allure est répartie tout au long du
                parcours (plus prudent au début, plus appuyé à la fin, etc.).
              </li>
              <li>
                Les résultats peuvent être affichés par kilomètre, tous les 5 km ou aux points clés de la course
                (5 km, 10 km, semi, 30 km, etc.).
              </li>
              <li>
                Toutes les allures restent théoriques et doivent être adaptées à votre forme du moment, au dénivelé,
                à la météo et à votre expérience en course.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Pourquoi utiliser un calculateur d’allure basé sur les splits ?
            </h2>
            <div className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Une stratégie de pacing bien construite aide à gérer l’énergie plus finement, à limiter le fameux
                “mur” en fin de course et à augmenter vos chances de finir en ayant encore de la relance.
              </p>
              <p>
                En vous concentrant sur les passages (splits) plutôt que sur une simple allure moyenne affichée sur la
                montre, vous courez plus régulier, plus serein, et vous savez mieux où vous en êtes à chaque portion du tracé.
              </p>
            </div>
          </section>
        </>
      )}

      {/* SEO 说明文案 + Pace 策略说明（西班牙语版本） */}
      {locale === 'es' && (
        <>
          <section className="rounded-2xl p-8 shadow-xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Calculadora de ritmo para maratón y plan de estrategia por parciales
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
              <p>
                Esta calculadora de ritmo para maratón te ayuda a construir un plan de carrera sólido a partir de un
                tiempo objetivo, un ritmo medio o una distancia de competición que ya tengas en mente.
              </p>
              <p>
                En vez de mostrar solo un ritmo medio, la herramienta genera una estrategia de parciales clara y
                estructurada, para repartir mejor el esfuerzo durante toda la prueba sin cambiar el tiempo final
                que buscas.
              </p>
              <p>
                Está pensada para maratón, media maratón y otras pruebas de fondo en ruta (10K, 15K, 21K, etc.).
              </p>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-lime-100 bg-gradient-to-br from-white via-white to-lime-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              Opciones de estrategia de ritmo
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Even Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Ritmo constante (Even Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Mantener un ritmo lo más estable posible de salida a meta. Es la estrategia más sencilla y segura,
                  ideal para tu primer maratón o si tu objetivo es “hacer tu carrera” sin pasarte de rosca.
                </p>
              </div>

              {/* Negative Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Ritmo en negative split (Negative Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Correr la primera mitad ligeramente por encima del tiempo por kilómetro objetivo y apretar poco a poco
                  en la segunda mitad. Es una opción muy usada por corredores con experiencia que quieren llegar con
                  fuerza al final y “remontar” en los últimos kilómetros.
                </p>
              </div>

              {/* Slight Positive Split Pace */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Ligero positive split (Slight Positive Split Pace)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Salir un poco más alegre al principio y aceptar una pequeña bajada de ritmo controlada al final.
                  Esta estrategia se parece mucho a lo que pasa en la realidad para muchos corredores populares y
                  puede ser más fácil de llevar el día de la carrera.
                </p>
              </div>

              {/* Segmented Pace Strategy */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Estrategia por bloques (Segmented Pace Strategy)
                </h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Dividir la prueba en varios bloques (por ejemplo 0–10K, 10–21K, 21–30K, etc.), cada uno con un
                  objetivo de ritmo. Así reduces la carga mental y te centras en ir cumpliendo tramo a tramo en lugar
                  de pensar todo el tiempo en los 42 kilómetros.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              ¿Cómo se calculan los ritmos por parcial?
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>
                Todas las estrategias parten del mismo tiempo objetivo en meta: lo que cambia es el perfil de ritmo, no
                el crono que persigues.
              </li>
              <li>
                Cada opción solo ajusta cómo se reparte el esfuerzo y el ritmo a lo largo del recorrido (más conservador
                al principio, más fuerte al final, etc.).
              </li>
              <li>
                Los parciales se pueden mostrar por kilómetro, cada 5 km o en puntos clave de la carrera (5K, 10K,
                media maratón, 30K, etc.).
              </li>
              <li>
                Todos los ritmos son orientativos y deben adaptarse a tu estado de forma, al perfil del circuito, al
                calor, al viento y a tu experiencia en competición.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl p-8 shadow-xl border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-blue-500 bg-clip-text text-transparent">
              ¿Por qué usar una calculadora de ritmo basada en parciales?
            </h2>
            <div className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                Una buena estrategia de ritmo te ayuda a gestionar mejor la energía, a evitar “reventar” en los últimos
                kilómetros y a aumentar las opciones de llegar fuerte a meta.
              </p>
              <p>
                Si te centras en ejecutar bien cada parcial en vez de mirar solo el ritmo medio del reloj, correrás de
                forma más constante, con más cabeza y con mucha más confianza en cada tramo del recorrido.
              </p>
            </div>
          </section>
        </>
      )}

      {/* FAQ */}
      <section className="rounded-2xl p-8 shadow-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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
