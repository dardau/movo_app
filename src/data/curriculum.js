export const STAR_REWARD = 20;

export const faculties = [
  {
    id: 'sides',
    number: '01',
    title: 'Факультет сторон',
    course: 'Лево и право',
    kicker: 'КУРС 1 · ОСНОВЫ ДВИЖЕНИЯ',
    symbol: '↔',
    summary: 'Три уровня: сначала стороны, потом последовательность, потом быстрый босс.',
    lessons: [
      {
        id: 'sides-intro',
        title: 'Знакомство',
        sub: 'Левая, правая и обе',
        icon: '1',
        minutes: '2 минуты',
        mode: 'intro',
        steps: [
          { pose: 'left-arm', prompt: 'Подними левую руку', detail: 'Только левая рука, выше плеча.' },
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'Только правая рука, выше плеча.' },
          { pose: 'both-arms', prompt: 'Подними обе руки', detail: 'Обе руки выше плеч.' },
        ],
      },
      {
        id: 'sides-sequence',
        title: 'Последовательность',
        sub: 'Сначала запомни, потом повтори',
        icon: '2',
        minutes: '3 минуты',
        mode: 'sequence',
        steps: [
          { pose: 'right-arm', prompt: 'Правая!', detail: 'Подними правую руку.', round: 1, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Левая!', detail: 'Теперь левую руку.', round: 1, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Правая!', detail: 'Подними правую руку.', round: 2, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Левая!', detail: 'Теперь левую руку.', round: 2, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Правая!', detail: 'Снова правую руку.', round: 2, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Левая!', detail: 'Подними левую руку.', round: 3, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Правая!', detail: 'Теперь правую руку.', round: 3, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Левая!', detail: 'Снова левую руку.', round: 3, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Правая!', detail: 'И ещё раз правую.', round: 3, roundCount: 3 },
        ],
      },
      {
        id: 'sides-boss',
        title: 'Босс',
        sub: '30 секунд на скорость',
        icon: '⚡',
        minutes: '30 секунд',
        mode: 'boss',
        steps: [
          { pose: 'left-arm', prompt: 'Лево!', detail: 'Успей показать сторону, которую видишь на экране.' },
        ],
      },
    ],
  },
  {
    id: 'coordination',
    number: '02',
    title: 'Факультет координации',
    course: 'Две стихии',
    kicker: 'КУРС 2 · КООРДИНАЦИЯ',
    symbol: '✧',
    summary: 'Научимся управлять двумя руками одновременно.',
    lessons: [
      {
        id: 'coord-both',
        title: 'Обе руки',
        sub: 'Подними обе руки',
        icon: '✧',
        minutes: '1–2 минуты',
        steps: [
          {
            pose: 'both-arms',
            prompt: 'Подними обе руки',
            detail: 'Обе руки выше плеч и почти прямые.',
          },
        ],
      },
      {
        id: 'coord-alternate',
        title: 'Чередование',
        sub: 'Левая, затем правая',
        icon: '↔',
        minutes: '2 минуты',
        steps: [
          {
            pose: 'left-arm',
            prompt: 'Подними левую руку',
            detail: 'Только левая рука.',
          },
          {
            pose: 'right-arm',
            prompt: 'Теперь правую руку',
            detail: 'Поменяй сторону.',
          },
        ],
      },
    ],
  },
  {
    id: 'balance',
    number: '03',
    title: 'Факультет равновесия',
    course: 'Башня равновесия',
    kicker: 'КУРС 3 · РАВНОВЕСИЕ',
    symbol: '♧',
    summary: 'Удержим корпус спокойно и ровно.',
    lessons: [
      {
        id: 'balance-still',
        title: 'Стойка',
        sub: 'Стой ровно',
        icon: '♧',
        minutes: '1 минута',
        steps: [
          {
            pose: null,
            prompt: 'Стой ровно и спокойно',
            detail: 'Ноги на ширине плеч, руки вдоль тела.',
          },
        ],
      },
      {
        id: 'balance-tower',
        title: 'Башня',
        sub: 'Руки в стороны',
        icon: '◇',
        minutes: '1–2 минуты',
        steps: [
          {
            pose: null,
            prompt: 'Подними руки в стороны и стой ровно',
            detail: 'Не торопись и держи равновесие.',
          },
        ],
      },
    ],
  },
  {
    id: 'reaction',
    number: '04',
    title: 'Факультет реакции',
    course: 'Арена реакции',
    kicker: 'КУРС 4 · РЕАКЦИЯ',
    symbol: '⚡',
    summary: 'Успей повторить сигнал Мово.',
    lessons: [
      {
        id: 'reaction-signal',
        title: 'Сигнал',
        sub: 'Повтори за Мово',
        icon: '⚡',
        minutes: '1–2 минуты',
        steps: [
          {
            pose: null,
            prompt: 'Хлопни в ладоши над головой',
            detail: 'Сделай движение, когда будешь готов.',
          },
        ],
      },
    ],
  },
  {
    id: 'memory',
    number: '05',
    title: 'Факультет памяти',
    course: 'Библиотека памяти',
    kicker: 'КУРС 5 · ПАМЯТЬ',
    symbol: '⌘',
    summary: 'Запомни порядок сторон и повтори его.',
    lessons: [
      {
        id: 'memory-order',
        title: 'Порядок',
        sub: 'Запомни стороны',
        icon: '⌘',
        minutes: '2 минуты',
        steps: [
          {
            pose: null,
            prompt: 'Повтори порядок: левая, правая, левая',
            detail: 'Покажи стороны руками в этом порядке.',
          },
        ],
      },
    ],
  },
];

export function facultyById(id) {
  return faculties.find((faculty) => faculty.id === id) ?? null;
}

export function lessonById(id) {
  for (const faculty of faculties) {
    const lesson = faculty.lessons.find((item) => item.id === id);
    if (lesson) return { faculty, lesson };
  }
  return null;
}
