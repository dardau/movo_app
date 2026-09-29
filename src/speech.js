let lastSpoken = '';
let chosenVoice = null;

function scoreVoice(voice) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  if (!voice.lang.toLowerCase().startsWith('ru')) return -1;
  if (/pavel|павел|dmitr|дмитр|male|мужск/.test(name)) return -1;
  let score = 8;
  if (/irina|ирина|svetlana|светлана|katya|катя|milena|милена|dariya|дарья|female|женск/.test(name)) score += 50;
  if (/natural|neural|online/.test(name)) score += 20;
  return score;
}

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return chosenVoice;
  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);
  chosenVoice = ranked[0]?.voice || null;
  return chosenVoice;
}

export function resetSpeech() {
  lastSpoken = '';
  window.speechSynthesis?.cancel();
}

export function speakRu(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const line = String(text || '').replace(/\s+/g, ' ').trim();
  if (!line || line === lastSpoken) return;
  lastSpoken = line;
  const utter = new SpeechSynthesisUtterance(line);
  utter.lang = 'ru-RU';
  utter.rate = 1.05;
  utter.pitch = 1.38;
  utter.volume = 1;
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { pickVoice(); };
  pickVoice();
}
