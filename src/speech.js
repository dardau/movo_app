let lastSpoken = '';
let activeRecording = null;

const RECORDINGS = [
  [/^(привет я мово|привет|запомни порядок|лево или право)/, '/audio/greeting.mp3'],
  [/^(подними левую руку|левая|лево)/, '/audio/left-hand.mp3'],
  [/^(теперь подними правую руку|подними правую руку|правая|право)/, '/audio/right-hand.mp3'],
  [/^(а теперь подними обе руки|подними обе руки|обе руки)/, '/audio/both-hands.mp3'],
  [/^(это правая рука.*нужна левая|это была другая рука|попробуй поднять левую)/, '/audio/wrong-hand-left.mp3'],
  [/^(почти получилось|давай попробуем еще раз|попробуем еще раз|опусти другую руку|это левая рука.*нужна правая|повтори)/, '/audio/try-again.mp3'],
  [/^(подними руку выше|подними руку чуть-чуть выше|держи руку ровнее|держи руки ровнее)/, '/audio/raise-higher.mp3'],
  [/^(сделай небольшой шаг назад|сделай шаг назад|шагни назад|встань в рамку|тебя не полностью видно)/, '/audio/step-back.mp3'],
  [/^(встань удобно перед камерой|когда будешь готов)/, '/audio/camera-ready.mp3'],
  [/^(правильно|ура, получилось|отлично|хорошо|молодец|вот так|держи еще немного)/, '/audio/success.mp3'],
];

function stopActiveSpeech() {
  activeRecording?.pause();
  if (activeRecording) activeRecording.currentTime = 0;
  activeRecording = null;
}

export function resetSpeech() {
  lastSpoken = '';
  stopActiveSpeech();
}

export function speakRu(text, { force = false } = {}) {
  if (typeof window === 'undefined') return;
  const line = String(text || '').replace(/\s+/g, ' ').trim();
  if (!line || (!force && line === lastSpoken)) return;
  lastSpoken = line;
  const normalized = line.toLowerCase().replace(/ё/g, 'е').replace(/[.!?,:;…]+/g, '').trim();
  const recording = RECORDINGS.find(([pattern]) => pattern.test(normalized))?.[1];
  stopActiveSpeech();
  if (!recording) return;

  const audio = new Audio(recording);
  activeRecording = audio;
  audio.play().catch(() => {
    if (activeRecording === audio) activeRecording = null;
  });
}
