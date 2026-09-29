import { faculties } from './data/curriculum.js';

export const PROGRESS_KEY = 'movo.progress.v1';

export function emptyProgress() {
  return {
    completedLessonIds: [],
    stars: 0,
    streak: 0,
    lastSessionDate: null,
    todayCount: 0,
    todayDate: null,
  };
}

export function todayStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function loadProgress() {
  try {
    if (typeof localStorage === 'undefined') return emptyProgress();
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw);
    return {
      ...emptyProgress(),
      ...data,
      completedLessonIds: Array.isArray(data.completedLessonIds) ? data.completedLessonIds : [],
      stars: Number.isFinite(data.stars) ? data.stars : 0,
      streak: Number.isFinite(data.streak) ? data.streak : 0,
      todayCount: Number.isFinite(data.todayCount) ? data.todayCount : 0,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function isFacultyUnlocked(progress, index) {
  if (index <= 0) return true;
  const previous = faculties[index - 1];
  if (!previous) return false;
  return previous.lessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));
}

export function isLessonUnlocked(progress, faculty, lessonIndex) {
  const facultyIndex = faculties.findIndex((item) => item.id === faculty.id);
  if (!isFacultyUnlocked(progress, facultyIndex)) return false;
  if (lessonIndex <= 0) return true;
  const previous = faculty.lessons[lessonIndex - 1];
  return progress.completedLessonIds.includes(previous.id);
}

export function facultyState(progress, index) {
  if (!isFacultyUnlocked(progress, index)) return 'locked';
  const faculty = faculties[index];
  const done = faculty.lessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));
  return done ? 'done' : 'active';
}

export function lessonState(progress, faculty, lessonIndex) {
  const lesson = faculty.lessons[lessonIndex];
  if (progress.completedLessonIds.includes(lesson.id)) return 'done';
  if (!isLessonUnlocked(progress, faculty, lessonIndex)) return 'locked';
  return 'current';
}

export function lessonsDone(progress, faculty) {
  return faculty.lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
}

export function todayLessons(progress, now = new Date()) {
  return progress.todayDate === todayStamp(now) ? progress.todayCount : 0;
}

export function completeLesson(progress, lessonId, starReward = 20, now = new Date()) {
  const today = todayStamp(now);
  const already = progress.completedLessonIds.includes(lessonId);
  const sameDay = progress.todayDate === today;
  const todayCount = sameDay ? progress.todayCount : 0;
  let streak = progress.streak || 0;
  if (progress.lastSessionDate === today) {
    streak = Math.max(streak, 1);
  } else if (progress.lastSessionDate === todayStamp(shiftDays(now, -1))) {
    streak += 1;
  } else {
    streak = 1;
  }

  return {
    ...progress,
    completedLessonIds: already ? progress.completedLessonIds : [...progress.completedLessonIds, lessonId],
    stars: progress.stars + (already ? 0 : starReward),
    streak,
    lastSessionDate: today,
    todayDate: today,
    todayCount: already ? todayCount : todayCount + 1,
  };
}

export function currentWork(progress) {
  for (let index = 0; index < faculties.length; index += 1) {
    if (facultyState(progress, index) !== 'active') continue;
    const faculty = faculties[index];
    const lesson = faculty.lessons.find((_, lessonIndex) => lessonState(progress, faculty, lessonIndex) === 'current')
      ?? faculty.lessons[0];
    return { faculty, lesson };
  }
  const last = faculties[faculties.length - 1];
  return { faculty: last, lesson: last.lessons[0] };
}
