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
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'Подними правую руку.', round: 1, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Подними левую руку', detail: 'Теперь левую руку.', round: 1, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'Подними правую руку.', round: 2, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Подними левую руку', detail: 'Теперь левую руку.', round: 2, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'Снова правую руку.', round: 2, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Подними левую руку', detail: 'Подними левую руку.', round: 3, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'Теперь правую руку.', round: 3, roundCount: 3 },
          { pose: 'left-arm', prompt: 'Подними левую руку', detail: 'Снова левую руку.', round: 3, roundCount: 3 },
          { pose: 'right-arm', prompt: 'Подними правую руку', detail: 'И ещё раз правую.', round: 3, roundCount: 3 },
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
    id: 'balance',
    number: '02',
    title: 'Факультет равновесия',
    course: 'Равновесие',
    kicker: 'КУРС 2 · РАВНОВЕСИЕ',
    symbol: '♧',
    summary: 'Три уровня: самолёт, одна нога и сложный баланс.',
    lessons: [
      {
        id: 'balance-plane',
        title: 'Самолёт',
        sub: 'Руки в стороны',
        icon: '1',
        minutes: '1 минута',
        mode: 'balance',
        voice: null,
        animation: null,
        steps: [
          {
            pose: 'airplane',
            prompt: 'Встань ровно и разведи руки в стороны. Держи позу 6 секунд.',
            detail: '',
          },
        ],
      },
      {
        id: 'balance-one-leg',
        title: 'Одна нога',
        sub: 'Сначала правая, потом левая',
        icon: '2',
        minutes: '2 минуты',
        mode: 'balance',
        voice: null,
        animation: null,
        steps: [
          {
            pose: 'one-leg-right',
            prompt: 'Левую ногу подними, руки держи в стороны. Удержись 6 секунд.',
            detail: '',
          },
          {
            pose: 'one-leg-left',
            prompt: 'Правую ногу подними, руки держи в стороны. Удержись 6 секунд.',
            detail: '',
          },
        ],
      },
      {
        id: 'balance-hard',
        title: 'Сложный баланс',
        sub: 'Одна рука вверх, другая в сторону',
        icon: '🏆',
        minutes: '2 минуты',
        mode: 'balance',
        voice: null,
        animation: null,
        steps: [
          {
            pose: 'balance-right',
            prompt: 'Стой на правой ноге.\nЛевую руку подними вверх, правую руку отведи в сторону.',
            detail: 'Держи 6 секунд.',
          },
          {
            pose: 'balance-left',
            prompt: 'Стой на левой ноге.\nПравую руку подними вверх, левую руку отведи в сторону.',
            detail: 'Держи 6 секунд.',
          },
        ],
      },
    ],
  },
  {
    id: 'reaction',
    number: '03',
    title: 'Факультет реакции',
    course: 'Арена реакции',
    kicker: 'КУРС 3 · РЕАКЦИЯ',
    symbol: '⚡',
    sealed: true,
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
    number: '04',
    title: 'Факультет памяти',
    course: 'Библиотека памяти',
    kicker: 'КУРС 4 · ПАМЯТЬ',
    symbol: '⌘',
    sealed: true,
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
