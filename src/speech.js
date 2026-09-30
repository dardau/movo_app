let lastSpoken = '';
let activeRecording = null;
let commandEndsAt = 0;
let hintLockedUntil = 0;

const RECORDINGS = [
  [/^доброе утро.*разбудим наше тело/, '/audio/morning-greeting.mp3'],
  [/^зарядка закончена.*заряд энергии/, '/audio/morning-complete.mp3'],
  [/^последовательность раунд 1$/, '/audio/sequence-round-1.mp3'],
  [/^последовательность раунд 2$/, '/audio/sequence-round-2.mp3'],
  [/^последовательность раунд 3$/, '/audio/sequence-round-3.mp3'],
  [/^лево$/, '/audio/boss-left.mp3'],
  [/^право$/, '/audio/boss-right.mp3'],
  [/^начинаем урок равновесия/, '/audio/balance-intro.mp3'],
  [/^встань ровно и разведи руки в стороны/, '/audio/airplane.mp3'],
  [/^левую ногу подними/, '/audio/lift-left-leg.mp3'],
  [/^правую ногу подними/, '/audio/lift-right-leg.mp3'],
  [/^стой на правой ноге/, '/audio/balance-right.mp3'],
  [/^стой на левой ноге/, '/audio/balance-left.mp3'],
  [/^разведи руки в стороны/, '/audio/arms-out.mp3'],
  [/^держи руки ровнее/, '/audio/arms-straight.mp3'],
  [/^постарайся не шататься/, '/audio/dont-sway.mp3'],
  [/^подними ногу немного выше/, '/audio/lift-foot-higher.mp3'],
  [/^вот так держи положение еще немного/, '/audio/balance-hold.mp3'],
  [/^(начинаем испытание|лево или право)/, '/audio/challenge-start.mp3'],
  [/^(урок пройден|ты отлично справился)/, '/audio/lesson-complete.mp3'],
  [/^(я тебя не вижу целиком|отойди чуть дальше)/, '/audio/not-visible.mp3'],
  [/^(не получилось включить камеру|позови взрослого помочь)/, '/audio/camera-error.mp3'],
  [/^(отлично а теперь следующее движение|а теперь следующее движение)/, '/audio/next-move.mp3'],
  [/^(привет я мово|привет)/, '/audio/greeting.mp3'],
  [/^(подними левую руку|левая|лево)/, '/audio/left-hand.mp3'],
  [/^(теперь подними правую руку|подними правую руку|правая|право)/, '/audio/right-hand.mp3'],
  [/^(а теперь подними обе руки|подними обе руки|обе руки)/, '/audio/both-hands.mp3'],
  [/^(это правая рука.*нужна левая|это была другая рука|попробуй поднять левую)/, '/audio/wrong-hand-left.mp3'],
  [/^это левая рука.*нужна правая/, '/audio/wrong-hand-right.mp3'],
  [/^опусти другую руку/, '/audio/lower-other-hand.mp3'],
  [/^вот так держи еще немного/, '/audio/hold-position.mp3'],
  [/^(почти получилось|давай попробуем еще раз|попробуем еще раз|повтори)/, '/audio/try-again.mp3'],
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

export function instructionSettled() {
  return Date.now() >= commandEndsAt;
}

export function hintLocked() {
  return Date.now() < hintLockedUntil;
}

function nagHint(line) {
  return /подними руку выше|подними руку чуть-чуть выше|держи руку ровнее|держи руки ровнее/.test(line);
}

export function speakRu(text, { force = false, hint = false } = {}) {
  if (typeof window === 'undefined') return;
  const line = String(text || '').replace(/\s+/g, ' ').trim();
  if (!line || (!force && line === lastSpoken)) return;
  const normalized = line.toLowerCase().replace(/ё/g, 'е').replace(/[.!?,:;…]+/g, '').trim();
  if (hint && (!instructionSettled() || (nagHint(normalized) && hintLocked()))) return;
  lastSpoken = line;
  const recording = RECORDINGS.find(([pattern]) => pattern.test(normalized))?.[1];
  stopActiveSpeech();
  if (!recording) return;

  const audio = new Audio(recording);
  activeRecording = audio;
  const protectsHint = hint && !nagHint(normalized);
  if (protectsHint) hintLockedUntil = Date.now() + 4500;
  if (!hint) commandEndsAt = Date.now() + 5000;
  audio.addEventListener('loadedmetadata', () => {
    if (activeRecording !== audio) return;
    const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : 2000;
    if (!hint) commandEndsAt = Date.now() + durationMs + 3000;
    if (protectsHint) hintLockedUntil = Date.now() + durationMs + 2500;
  }, { once: true });
  audio.addEventListener('ended', () => {
    if (activeRecording === audio) activeRecording = null;
  }, { once: true });
  audio.play().catch(() => {
    if (activeRecording === audio) activeRecording = null;
  });
}
