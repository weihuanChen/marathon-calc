import { SITE_URL } from './site';

/**
 * 生成 Race Phases 功能的 HowTo 结构化数据
 * 符合 Schema.org 标准，用于 Google 搜索结果显示步骤
 */
export function buildRacePhasesHowToStructuredData(locale: string): object {
  const baseUrl = locale === 'en' ? SITE_URL : `${SITE_URL}/${locale}`;
  
  // 多语言步骤说明
  const stepsByLocale: Record<string, Array<{ name: string; text: string }>> = {
    en: [
      {
        name: 'Set Marathon Distance',
        text: 'Enter 42.195 km (26.2 miles) as your target distance. The Race Phases system will automatically activate for marathon distance.',
      },
      {
        name: 'Enter Target Time',
        text: 'Input your goal finish time (e.g., 3 hours 30 minutes). This will be your target pace for the entire marathon.',
      },
      {
        name: 'Review Race Phases',
        text: 'The system automatically divides your marathon into four phases: Start (0-5km, 2-5s slower), Cruise (5-30km, target pace), Decision Zone (30-38km, +2s), and Final Push (38-42.2km, -5s faster).',
      },
      {
        name: 'Adjust Pacing Strategy (Optional)',
        text: 'Use the pacing strategy dropdown to fine-tune your plan. Choose Even Split to maintain phase characteristics, or Negative Split/Slight Positive to adjust the overall pacing pattern while keeping phase structure.',
      },
      {
        name: 'Check Aid Stations',
        text: 'Review the split table to see water stations (💧) every 2.5km and energy stations (⚡) every 5km. Plan your hydration and nutrition strategy accordingly.',
      },
      {
        name: 'Review Race Day Notes',
        text: 'Scroll down to see personalized coaching advice for each phase, including pacing tips and mental strategies for each section of the marathon.',
      },
    ],
    zh: [
      {
        name: '设置马拉松距离',
        text: '输入 42.195 公里作为目标距离。系统会自动为马拉松距离激活 Race Phases（比赛阶段）功能。',
      },
      {
        name: '输入目标时间',
        text: '输入你的目标完赛时间（例如：3小时30分钟）。这将是你整个马拉松的目标配速。',
      },
      {
        name: '查看比赛阶段',
        text: '系统自动将马拉松分为四个阶段：起跑阶段（0-5km，慢2-5秒）、巡航阶段（5-30km，目标配速）、决策区（30-38km，慢2秒）和终点冲刺（38-42.2km，快5秒）。',
      },
      {
        name: '调整配速策略（可选）',
        text: '使用配速策略下拉菜单来微调你的计划。选择匀速以保持阶段特征，或选择负分段/轻微正分段来调整整体配速模式，同时保持阶段结构。',
      },
      {
        name: '查看补给点',
        text: '查看分段表，了解每2.5公里一个饮水站（💧）和每5公里一个能量补给站（⚡）。据此规划你的补水和营养策略。',
      },
      {
        name: '查看比赛日提示',
        text: '向下滚动查看每个阶段的个性化教练建议，包括配速提示和每个马拉松段落的心理策略。',
      },
    ],
    es: [
      {
        name: 'Establecer Distancia de Maratón',
        text: 'Ingrese 42.195 km (26.2 millas) como su distancia objetivo. El sistema Race Phases se activará automáticamente para la distancia de maratón.',
      },
      {
        name: 'Ingresar Tiempo Objetivo',
        text: 'Ingrese su tiempo de llegada objetivo (por ejemplo, 3 horas 30 minutos). Este será su ritmo objetivo para todo el maratón.',
      },
      {
        name: 'Revisar Fases de Carrera',
        text: 'El sistema divide automáticamente su maratón en cuatro fases: Inicio (0-5km, 2-5s más lento), Crucero (5-30km, ritmo objetivo), Zona de Decisión (30-38km, +2s), y Empuje Final (38-42.2km, -5s más rápido).',
      },
      {
        name: 'Ajustar Estrategia de Ritmo (Opcional)',
        text: 'Use el menú desplegable de estrategia de ritmo para ajustar su plan. Elija Ritmo Uniforme para mantener las características de fase, o Ritmo Negativo/Ligeramente Positivo para ajustar el patrón general de ritmo manteniendo la estructura de fase.',
      },
      {
        name: 'Verificar Estaciones de Abastecimiento',
        text: 'Revise la tabla de parciales para ver estaciones de agua (💧) cada 2.5km y estaciones de energía (⚡) cada 5km. Planifique su estrategia de hidratación y nutrición en consecuencia.',
      },
      {
        name: 'Revisar Notas del Día de Carrera',
        text: 'Desplácese hacia abajo para ver consejos de entrenamiento personalizados para cada fase, incluyendo consejos de ritmo y estrategias mentales para cada sección del maratón.',
      },
    ],
    fr: [
      {
        name: 'Définir la Distance du Marathon',
        text: 'Entrez 42.195 km (26.2 miles) comme distance cible. Le système Race Phases s\'activera automatiquement pour la distance du marathon.',
      },
      {
        name: 'Entrer le Temps Cible',
        text: 'Entrez votre temps d\'arrivée cible (par exemple, 3 heures 30 minutes). Ce sera votre allure cible pour tout le marathon.',
      },
      {
        name: 'Examiner les Phases de Course',
        text: 'Le système divise automatiquement votre marathon en quatre phases : Départ (0-5km, 2-5s plus lent), Croisière (5-30km, allure cible), Zone de Décision (30-38km, +2s), et Poussée Finale (38-42.2km, -5s plus rapide).',
      },
      {
        name: 'Ajuster la Stratégie d\'Allure (Optionnel)',
        text: 'Utilisez le menu déroulant de stratégie d\'allure pour affiner votre plan. Choisissez Allure Régulière pour maintenir les caractéristiques de phase, ou Allure Négative/Légèrement Positive pour ajuster le modèle d\'allure global tout en conservant la structure de phase.',
      },
      {
        name: 'Vérifier les Points de Ravitaillement',
        text: 'Consultez le tableau des splits pour voir les points d\'eau (💧) tous les 2.5km et les points d\'énergie (⚡) tous les 5km. Planifiez votre stratégie d\'hydratation et de nutrition en conséquence.',
      },
      {
        name: 'Examiner les Notes du Jour de Course',
        text: 'Faites défiler vers le bas pour voir les conseils d\'entraînement personnalisés pour chaque phase, y compris les conseils d\'allure et les stratégies mentales pour chaque section du marathon.',
      },
    ],
  };

  const steps = stepsByLocale[locale] || stepsByLocale.en;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: locale === 'en' 
      ? 'How to Use Race Phases for Marathon Pacing'
      : locale === 'zh'
      ? '如何使用比赛阶段进行马拉松配速'
      : locale === 'es'
      ? 'Cómo Usar las Fases de Carrera para el Ritmo de Maratón'
      : 'Comment Utiliser les Phases de Course pour l\'Allure de Marathon',
    description: locale === 'en'
      ? 'Learn how to use the Race Phases system to plan your marathon pacing strategy. The system automatically divides your 42.195km marathon into four strategic phases with intelligent pacing adjustments and aid station planning.'
      : locale === 'zh'
      ? '学习如何使用比赛阶段系统来规划你的马拉松配速策略。系统自动将你的42.195公里马拉松分为四个战略阶段，包含智能配速调整和补给点规划。'
      : locale === 'es'
      ? 'Aprende a usar el sistema Race Phases para planificar tu estrategia de ritmo de maratón. El sistema divide automáticamente tu maratón de 42.195km en cuatro fases estratégicas con ajustes inteligentes de ritmo y planificación de estaciones de abastecimiento.'
      : 'Apprenez à utiliser le système Race Phases pour planifier votre stratégie d\'allure de marathon. Le système divise automatiquement votre marathon de 42.195km en quatre phases stratégiques avec des ajustements intelligents d\'allure et une planification des points de ravitaillement.',
    image: `${SITE_URL}/og-image.png`,
    totalTime: 'PT10M', // 预计10分钟完成
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    tool: [
      {
        '@type': 'HowToTool',
        name: 'Marathon Pace Calculator',
      },
    ],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${baseUrl}#step-${index + 1}`,
    })),
    supply: [
      {
        '@type': 'HowToSupply',
        name: locale === 'en' ? 'Target marathon finish time' : locale === 'zh' ? '目标马拉松完赛时间' : locale === 'es' ? 'Tiempo de llegada objetivo del maratón' : 'Temps d\'arrivée cible du marathon',
      },
      {
        '@type': 'HowToSupply',
        name: locale === 'en' ? 'Distance: 42.195 km' : locale === 'zh' ? '距离：42.195 公里' : locale === 'es' ? 'Distancia: 42.195 km' : 'Distance : 42.195 km',
      },
    ],
    mainEntity: {
      '@type': 'WebPage',
      '@id': baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Marathon Pace Studio',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
    inLanguage: locale,
    url: baseUrl,
  };
}
