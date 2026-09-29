import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  ArrowLeft, ArrowRight, Award, Check, ChevronRight, CircleHelp, Clock3, Flame,
  Footprints, LockKeyhole, Menu, Play, Shield, Sparkles, Star, Target, Trophy, X,
} from 'lucide-react';
import { faculties, STAR_REWARD } from './data/curriculum.js';
import {
  completeLesson, currentWork, facultyState, lessonState, lessonsDone, loadProgress,
  saveProgress, todayLessons,
} from './progress.js';
import { createPoseLandmarker, drawPose, evaluatePose, frameStatus, HOLD_MS } from './pose.js';
import { resetSpeech, speakRu } from './speech.js';
import './styles.css';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function minutesLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'минута' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'минуты' : 'минут';
  return `${count} ${word}`;
}

function gentleGrade(elapsed, moves) {
  const each = elapsed / Math.max(1, moves);
  if (each <= 6000) return 'Отлично';
  if (each <= 10000) return 'Хорошо';
  return 'Молодец';
}

function gentleNote(grade, elapsed) {
  const seconds = Math.max(1, Math.round(elapsed / 1000));
  if (grade === 'Отлично') return `${seconds} сек. Очень спокойно и точно.`;
  if (grade === 'Хорошо') return `${seconds} сек. Хороший темп, ты вспомнил.`;
  return `${seconds} сек. Ты вспомнил порядок. Это главное.`;
}

function formatTime(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const EXERCISE_VIDEOS = {
  greeting: '/videos/greeting.mp4',
  'left-arm': '/videos/raise-left.mp4',
  'right-arm': '/videos/raise-right.mp4',
  'both-arms': '/videos/both-hands.mp4',
  success: '/videos/celebrate.mp4',
  retry: '/videos/try-again.mp4',
};

function ExerciseVideo({ src, pose, playbackKey }) {
  return (
    <div className="exercise-video-wrap" aria-label="Демонстрация движения от Мово">
      <video
        key={`${src}-${playbackKey}`}
        className={`exercise-video${pose === 'left-arm' ? ' is-mirrored' : ''}`}
        src={src}
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}

function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState('faculties');
  const [activeTab, setActiveTab] = useState('Факультеты');
  const [facultyId, setFacultyId] = useState(faculties[0].id);
  const [lessonId, setLessonId] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [result, setResult] = useState(null);
  const mainRef = useRef(null);

  const faculty = faculties.find((item) => item.id === facultyId) ?? faculties[0];
  const lesson = faculty.lessons.find((item) => item.id === lessonId) ?? null;
  const work = currentWork(progress);
  const doneToday = todayLessons(progress);

  const showScreen = (update) => {
    flushSync(update);
    const pane = mainRef.current;
    if (pane) pane.scrollTop = 0;
  };

  const persist = (next) => {
    saveProgress(next);
    setProgress(next);
  };

  const go = (tab) => {
    showScreen(() => {
      setActiveTab(tab);
      setMobileNav(false);
      if (tab === 'Путь') {
        setFacultyId(work.faculty.id);
        setScreen('path');
      } else if (tab === 'Факультеты') setScreen('faculties');
      else if (tab === 'Задания') setScreen('tasks');
      else if (tab === 'Награды') setScreen('rewards');
      else if (tab === 'Для родителей') setScreen('parents');
    });
  };

  const openFaculty = (nextFaculty) => {
    const index = faculties.findIndex((item) => item.id === nextFaculty.id);
    if (facultyState(progress, index) === 'locked') return;
    showScreen(() => {
      setFacultyId(nextFaculty.id);
      setActiveTab('Путь');
      setScreen('path');
    });
  };

  const openLesson = (nextFaculty, nextLesson) => {
    const facultyIndex = faculties.findIndex((item) => item.id === nextFaculty.id);
    const lessonIndex = nextFaculty.lessons.findIndex((item) => item.id === nextLesson.id);
    if (lessonState(progress, nextFaculty, lessonIndex) === 'locked' || facultyState(progress, facultyIndex) === 'locked') return;
    showScreen(() => {
      setFacultyId(nextFaculty.id);
      setLessonId(nextLesson.id);
      setActiveTab('Путь');
      setScreen('lesson');
    });
  };

  const finishLesson = (stats) => {
    if (!lesson) return;
    const already = progress.completedLessonIds.includes(lesson.id);
    const next = completeLesson(progress, lesson.id, STAR_REWARD);
    persist(next);
    showScreen(() => {
      setResult({
        lesson,
        faculty,
        moves: stats.moves,
        seconds: stats.seconds,
        stars: already ? 0 : STAR_REWARD,
        boss: Boolean(stats.boss),
        correct: stats.correct ?? stats.moves,
        grades: Array.isArray(stats.grades) ? stats.grades : null,
      });
      setScreen('result');
    });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Открыть меню"><Menu size={22} /></button>
        <button className="brand" onClick={() => go('Факультеты')}><img src="/assets/logo.png" alt="" /><span className="brand-name">Movo</span><span className="brand-caption">Академия движения</span></button>
        <div className="top-spacer" />
        <div className="top-pill"><Flame size={18} fill="#ffd450" stroke="#ffd450" /><span>{progress.streak} дней</span></div>
        <div className="top-pill"><Star size={18} fill="#5bd0f5" stroke="#5bd0f5" /><span>{progress.stars}</span></div>
        <button className="profile" aria-label="Профиль">Л</button>
      </header>
      <div className={`layout${screen === 'lesson' ? ' lesson-focus' : ''}`}>
        <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
          <div className="side-mascot"><img src="/assets/logo.png" alt="Мово, волшебный помощник" /></div>
          <div className="mascot-name">Мово</div>
          <nav className="side-nav">
            <NavItem label="Путь" active={activeTab === 'Путь'} onClick={() => go('Путь')} icon={<Footprints />} />
            <NavItem label="Факультеты" active={activeTab === 'Факультеты'} onClick={() => go('Факультеты')} icon={<Sparkles />} />
            <NavItem label="Задания" active={activeTab === 'Задания'} onClick={() => go('Задания')} icon={<Target />} />
            <NavItem label="Награды" active={activeTab === 'Награды'} onClick={() => go('Награды')} icon={<Award />} />
          </nav>
          <div className="sidebar-bottom">
            <div className="parent-card">
              <strong>Для родителей</strong>
              <span>Прогресс и домашние занятия</span>
              <button onClick={() => go('Для родителей')}>Открыть <ArrowRight size={14} /></button>
            </div>
            <span className="sidebar-foot">Двигайся. Учись. Твори магию.</span>
          </div>
        </aside>
        <main className="main-area" ref={mainRef}>
          {screen === 'faculties' && <FacultiesScreen progress={progress} onOpen={openFaculty} />}
          {screen === 'path' && (
            <PathScreen
              faculty={faculty}
              progress={progress}
              onLesson={(item) => openLesson(faculty, item)}
              onOpenFaculty={openFaculty}
            />
          )}
          {screen === 'tasks' && <TasksScreen progress={progress} onOpen={openLesson} />}
          {screen === 'lesson' && lesson && (
            <LessonScreen
              key={lesson.id}
              faculty={faculty}
              lesson={lesson}
              onBack={() => showScreen(() => { setScreen('path'); setActiveTab('Путь'); })}
              onFinish={finishLesson}
            />
          )}
          {screen === 'result' && result && (
            <ResultScreen
              result={result}
              onContinue={() => showScreen(() => { setFacultyId(result.faculty.id); setScreen('path'); setActiveTab('Путь'); })}
            />
          )}
          {screen === 'rewards' && <RewardsScreen stars={progress.stars} />}
          {screen === 'parents' && <ParentsScreen doneToday={doneToday} streak={progress.streak} stars={progress.stars} />}
        </main>
        <RightRail
          progress={progress}
          doneToday={doneToday}
          quest={work}
          onQuest={() => openLesson(work.faculty, work.lesson)}
        />
      </div>
      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Закрыть меню" />}
    </div>
  );
}

function NavItem({ label, active, onClick, icon }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
      {active && <ChevronRight size={16} className="nav-chevron" />}
    </button>
  );
}

function FacultiesScreen({ progress, onOpen }) {
  return (
    <section className="content-page">
      <div className="eyebrow"><Sparkles size={15} /> МИР MOVO</div>
      <h1>Факультеты академии</h1>
      <p className="page-subtitle">Каждый факультет открывает новый навык. Следующий откроется, когда пройдёшь предыдущий целиком.</p>
      <div className="faculty-grid">
        {faculties.map((item, index) => {
          const state = facultyState(progress, index);
          const done = lessonsDone(progress, item);
          const label = state === 'locked' ? 'Закрыт' : state === 'done' ? 'Пройден' : done > 0 ? 'В процессе' : 'Открыт';
          return (
            <article key={item.id} className={`faculty-card ${state} ${state === 'locked' ? '' : 'is-open'}`} onClick={() => onOpen(item)}>
              <div className="faculty-card-top">
                <span className="faculty-number">{item.number}</span>
                <span className="faculty-symbol">{item.symbol}</span>
              </div>
              <span className="faculty-card-kicker">{item.title}</span>
              <h3>{item.course}</h3>
              <div className="faculty-card-bottom">
                <span className={`faculty-state ${state}`}>
                  {state === 'locked' && <LockKeyhole size={13} />}
                  {state === 'done' && <Check size={13} />}
                  {state === 'active' && <span className="live-dot" />}
                  {label}
                </span>
                {state !== 'locked' && (
                  <button onClick={(event) => { event.stopPropagation(); onOpen(item); }}>
                    {state === 'done' ? 'Сыграть ещё' : 'Играть'} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="feature-note">
        <Shield size={19} />
        <div>
          <b>Твой комфорт — главное</b>
          <span>Все упражнения можно выполнять в удобном для тебя темпе. Прогресс остаётся в этом браузере.</span>
        </div>
      </div>
    </section>
  );
}

function PathScreen({ faculty, progress, onLesson, onOpenFaculty }) {
  const facultyIndex = faculties.findIndex((item) => item.id === faculty.id);
  const done = lessonsDone(progress, faculty);
  const total = faculty.lessons.length;
  const current = faculty.lessons.find((_, index) => lessonState(progress, faculty, index) === 'current');
  const nextFaculty = faculties[facultyIndex + 1];
  const nextLocked = nextFaculty ? facultyState(progress, facultyIndex + 1) === 'locked' : false;
  const spots = spotsFor(total);

  return (
    <div className="path-layout">
      <section className="path-column">
        <div className="eyebrow"><Sparkles size={15} /> {faculty.title.toUpperCase()}</div>
        <div className="heading-row">
          <div>
            <h1>Твой путь движения</h1>
            <p className="page-subtitle">{faculty.summary}</p>
          </div>
          <div className="level-chip"><span>УРОВЕНЬ {facultyIndex + 1}</span><b>✨</b></div>
        </div>
        <div className="course-hero">
          <div className="course-badge"><img src="/assets/badge.svg" alt="" /><span>{faculty.symbol}</span></div>
          <div className="course-info">
            <span className="course-kicker">{faculty.kicker}</span>
            <h2>{faculty.course}</h2>
            <p>{done} из {total} {faculty.id === 'sides' ? 'уровней' : 'упражнений'}{done === total ? ' · курс пройден' : ` · осталось ${minutesLabel((total - done) * 2)}`}</p>
            <div className="course-progress"><span style={{ width: `${(done / total) * 100}%` }} /></div>
          </div>
          <button className="continue-button" onClick={() => onLesson(current ?? faculty.lessons[0])}>
            <Play size={18} fill="currentColor" /> {current ? 'Начать урок' : 'Сыграть ещё'}
          </button>
        </div>
        <div className="lesson-map-wrap">
          <div className="map-caption">
            <span><span className="live-dot" /> ТВОЙ МАРШРУТ</span>
            <span>{done} из {total} {faculty.id === 'sides' ? 'уровней' : 'упражнений'} пройдено</span>
          </div>
          <div className={`lesson-map compact lessons-${total}`}>
            <svg className="map-path" viewBox="0 0 520 560" preserveAspectRatio="none" aria-hidden="true">
              <path d="M250 36 C170 90 110 140 160 210 C220 290 390 250 350 340 C300 440 120 430 190 520" fill="none" stroke="#b8dfc7" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <div className="path-start"><span>✦</span><b>Курс начинается здесь</b><small>Каждый шаг — новое движение</small></div>
            {faculty.lessons.map((item, index) => {
              const state = lessonState(progress, faculty, index);
              return (
                <button
                  key={item.id}
                  disabled={state === 'locked'}
                  onClick={() => onLesson(item)}
                  className={`lesson-stop ${state}`}
                  style={spots[index]}
                  aria-label={`${index + 1}. ${item.title}${state === 'locked' ? ', закрыто' : ''}`}
                >
                  <span className="stop-core">{state === 'done' ? <Check /> : state === 'locked' ? <LockKeyhole /> : item.icon}</span>
                  <span className="stop-label"><b>{faculty.id === 'sides' ? `УРОВЕНЬ ${index + 1}` : `УПРАЖНЕНИЕ ${index + 1}`}</b><small>{item.title}</small></span>
                </button>
              );
            })}
            <div className="map-reward">
              <div className="chest">🎁</div>
              <div><b>Сундук академии</b><small>{done === total ? 'Факультет пройден' : 'Откроется после курса'}</small></div>
              {done === total ? <Check size={16} /> : <LockKeyhole size={16} />}
            </div>
          </div>
        </div>
        {nextFaculty && (
          <section className="next-faculty">
            <div>
              <span className="eyebrow">СЛЕДУЮЩАЯ ОСТАНОВКА</span>
              <h3>{nextFaculty.title}</h3>
              <p>{nextFaculty.summary}</p>
            </div>
            <div className="faculty-glyph">{nextFaculty.symbol}</div>
            {nextLocked ? <span className="coming-soon">ОТКРОЕТСЯ ПОСЛЕ КУРСА</span> : (
              <button className="continue-button next-open" onClick={() => onOpenFaculty(nextFaculty)}>Открыть факультет</button>
            )}
          </section>
        )}
      </section>
    </div>
  );
}

function spotsFor(count) {
  if (count <= 1) return [{ left: '38%', top: '42%' }];
  if (count === 2) return [{ left: '16%', top: '28%' }, { left: '52%', top: '66%' }];
  return [{ left: '12%', top: '16%' }, { left: '54%', top: '42%' }, { left: '22%', top: '70%' }];
}

function RightRail({ progress, doneToday, quest, onQuest }) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const hitDays = new Set();
  for (let offset = 0; offset < Math.min(progress.streak, 7); offset += 1) {
    hitDays.add((todayIndex - offset + 7) % 7);
  }
  return (
    <aside className="right-rail">
      <section className="rail-card goal-card">
        <div className="rail-heading">
          <div>
            <span className="rail-overline">ТВОЯ ЦЕЛЬ</span>
            <h3>Маленький шаг<br />каждый день</h3>
          </div>
          <div className="goal-icon"><Target size={20} /></div>
        </div>
        <p className="rail-muted">{Math.min(doneToday, 2)} из 2 уроков завершено</p>
        <div className="rail-progress"><span style={{ width: `${Math.min(doneToday, 2) * 50}%` }} /></div>
        <div className="quest-card">
          <div>
            <span>ТЕКУЩЕЕ ЗАДАНИЕ</span>
            <b>{quest.lesson.title}</b>
          </div>
          <div className="reward-token">+{STAR_REWARD}</div>
          <button onClick={onQuest} aria-label="Начать текущее задание"><ChevronRight /></button>
        </div>
      </section>
      <section className="rail-card streak-card">
        <div className="section-title">
          <h3>Серия занятий</h3>
          <span className="streak-count"><Flame size={14} fill="currentColor" /> {progress.streak}</span>
        </div>
        <div className="week-dots">
          {DAY_LABELS.map((day, index) => (
            <div className="day" key={day}>
              <span className={index === todayIndex ? 'today' : hitDays.has(index) ? 'hit' : ''}>
                {index === todayIndex ? <Flame size={13} fill="currentColor" /> : hitDays.has(index) ? <Check size={14} /> : ''}
              </span>
              <small>{day}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="rail-card skills-card">
        <div className="section-title">
          <div>
            <span className="rail-overline">ТВОИ УСПЕХИ</span>
            <h3>Навыки недели</h3>
          </div>
        </div>
        <Skill name="Лево / право" value={`${lessonsDone(progress, faculties[0])} / ${faculties[0].lessons.length}`} progress={(lessonsDone(progress, faculties[0]) / faculties[0].lessons.length) * 100} color="green" />
        <Skill name="Координация" value={`${lessonsDone(progress, faculties[1])} / ${faculties[1].lessons.length}`} progress={(lessonsDone(progress, faculties[1]) / faculties[1].lessons.length) * 100} color="blue" />
        <Skill name="Звёзды" value={`${progress.stars}`} progress={Math.min(100, progress.stars / 2)} color="yellow" />
        <div className="coach-tip"><span>💡</span><p><b>Совет Мово</b>Занимайся по 5 минут каждый день — так навык становится увереннее.</p></div>
      </section>
      <div className="privacy-note"><Shield size={15} /><span>Камера нужна только во время урока</span></div>
    </aside>
  );
}

function Skill({ name, value, progress, color }) {
  return (
    <div className={`skill-row ${color}`}>
      <span className="skill-dot" />
      <div className="skill-content">
        <div><b>{name}</b><strong>{value}</strong></div>
        <div className="skill-track"><span style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}

function LessonScreen({ faculty, lesson, onBack, onFinish }) {
  const lessonIndex = faculty.lessons.findIndex((item) => item.id === lesson.id);
  const steps = lesson.steps;
  const [phase, setPhase] = useState('prep');
  const [stepIndex, setStepIndex] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [modal, setModal] = useState(false);
  const [live, setLive] = useState(null);
  const [hold, setHold] = useState(0);
  const [poseReady, setPoseReady] = useState(false);
  const [poseFailed, setPoseFailed] = useState(false);
  const [bossPose, setBossPose] = useState('left-arm');
  const [bossSerial, setBossSerial] = useState(0);
  const [bossLeft, setBossLeft] = useState(30000);
  const [bossScore, setBossScore] = useState(0);
  const [praising, setPraising] = useState(false);
  const [seqStage, setSeqStage] = useState('memorize');
  const [revealCount, setRevealCount] = useState(0);
  const [seqClock, setSeqClock] = useState(0);
  const [seqGrade, setSeqGrade] = useState('');
  const [stableHint, setStableHint] = useState('');
  const mode = lesson.mode || 'steps';
  const bossMode = mode === 'boss';
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const phaseRef = useRef(phase);
  const stepRef = useRef(stepIndex);
  const stepsRef = useRef(steps);
  const advanceRef = useRef(() => {});
  const hitRef = useRef(() => {});
  const engineRef = useRef({});
  const onFinishRef = useRef(onFinish);
  const startedAt = useRef(null);
  const modeRef = useRef(mode);
  const busyRef = useRef(false);
  const bossPoseRef = useRef('left-arm');
  const bossSerialRef = useRef(0);
  const bossScoreRef = useRef(0);
  const bossEndsAt = useRef(0);
  const bossTimer = useRef(0);
  const bossPace = useRef(0);
  const finishedRef = useRef(false);
  const missLatch = useRef(false);
  const seqStageRef = useRef('memorize');
  const seqClockStart = useRef(0);
  const gradesRef = useRef([]);

  phaseRef.current = phase;
  stepRef.current = bossMode ? bossSerial : stepIndex;
  stepsRef.current = steps;
  modeRef.current = mode;
  bossPoseRef.current = bossPose;
  onFinishRef.current = onFinish;
  seqStageRef.current = seqStage;
  const step = steps[stepIndex] || steps[0];

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close?.();
  }, []);

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOn, phase]);

  useEffect(() => {
    if (phase === 'practice' && !startedAt.current) startedAt.current = Date.now();
  }, [phase]);

  const advance = () => {
    const index = stepRef.current;
    const all = stepsRef.current;
    if (index + 1 >= all.length) {
      onFinish({ moves: all.length, seconds: Date.now() - (startedAt.current || Date.now()) });
      return;
    }
    setStepIndex(index + 1);
    setHold(0);
    setLive(null);
  };
  advanceRef.current = advance;

  const praiseThenAdvance = () => {
    if (busyRef.current || finishedRef.current) return;
    busyRef.current = true;
    setPraising(true);
    window.setTimeout(() => {
      busyRef.current = false;
      setPraising(false);
      advance();
    }, 2850);
  };

  const beginRecall = () => {
    seqClockStart.current = Date.now();
    setSeqClock(0);
    setSeqGrade('');
    setSeqStage('play');
    seqStageRef.current = 'play';
  };

  const onSequenceHit = () => {
    if (busyRef.current || finishedRef.current || seqStageRef.current !== 'play') return;
    busyRef.current = true;
    setPraising(true);
    const index = stepRef.current;
    const all = stepsRef.current;
    const current = all[index];
    const next = all[index + 1];
    const roundDone = !next || next.round !== current.round;
    window.setTimeout(() => {
      setPraising(false);
      setHold(0);
      setLive(null);
      if (!roundDone) {
        busyRef.current = false;
        setStepIndex(index + 1);
        return;
      }
      const elapsed = Date.now() - seqClockStart.current;
      const moves = all.filter((item) => item.round === current.round).length;
      const grade = gentleGrade(elapsed, moves);
      gradesRef.current = [...gradesRef.current, grade];
      setSeqGrade(grade);
      setSeqClock(elapsed);
      setSeqStage('mark');
      seqStageRef.current = 'mark';
      window.setTimeout(() => {
        busyRef.current = false;
        if (!next) {
          onFinishRef.current({
            moves: all.length,
            seconds: Date.now() - (startedAt.current || Date.now()),
            grades: gradesRef.current,
          });
          return;
        }
        setStepIndex(index + 1);
        setRevealCount(0);
        setSeqStage('memorize');
        seqStageRef.current = 'memorize';
      }, 3000);
    }, 700);
  };

  const armBoss = (previous) => {
    if (finishedRef.current || phaseRef.current !== 'practice') return;
    const other = previous === 'left-arm' ? 'right-arm' : 'left-arm';
    let next = Math.random() < 0.7 ? other : (previous || other);
    if (!previous) next = Math.random() < 0.5 ? 'left-arm' : 'right-arm';
    const serial = bossSerialRef.current + 1;
    bossSerialRef.current = serial;
    bossPoseRef.current = next;
    setBossSerial(serial);
    setBossPose(next);
    const windows = [1500, 1200, 1000, 800, 700];
    const wait = windows[Math.min(bossPace.current, windows.length - 1)];
    bossPace.current += 1;
    window.clearTimeout(bossTimer.current);
    bossTimer.current = window.setTimeout(() => armBoss(next), wait);
  };

  const finishBoss = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    window.clearTimeout(bossTimer.current);
    onFinishRef.current({
      moves: bossScoreRef.current,
      seconds: 30000,
      boss: true,
      correct: bossScoreRef.current,
    });
  };

  const onBossHit = () => {
    if (busyRef.current || finishedRef.current) return;
    busyRef.current = true;
    window.clearTimeout(bossTimer.current);
    const nextScore = bossScoreRef.current + 1;
    bossScoreRef.current = nextScore;
    setBossScore(nextScore);
    setPraising(true);
    window.setTimeout(() => {
      if (finishedRef.current) return;
      busyRef.current = false;
      setPraising(false);
      armBoss(bossPoseRef.current);
    }, 650);
  };

  engineRef.current.arm = armBoss;
  engineRef.current.miss = () => {
    if (busyRef.current || finishedRef.current) return;
    bossEndsAt.current = Math.max(Date.now() + 1000, bossEndsAt.current - 1000);
  };
  engineRef.current.finish = finishBoss;
  hitRef.current = () => {
    if (modeRef.current === 'boss') onBossHit();
    else if (modeRef.current === 'sequence') {
      if (seqStageRef.current === 'memorize') beginRecall();
      else if (seqStageRef.current === 'play') onSequenceHit();
    } else if (modeRef.current === 'intro') praiseThenAdvance();
    else advance();
  };

  useEffect(() => {
    if (phase !== 'practice' || lesson.mode !== 'boss') return undefined;
    finishedRef.current = false;
    busyRef.current = false;
    bossScoreRef.current = 0;
    bossPace.current = 0;
    bossSerialRef.current = 0;
    setBossScore(0);
    setBossLeft(30000);
    setPraising(false);
    bossEndsAt.current = Date.now() + 30000;
    engineRef.current.arm(null);
    const id = window.setInterval(() => {
      const left = bossEndsAt.current - Date.now();
      setBossLeft(Math.max(0, left));
      if (left <= 0) engineRef.current.finish();
    }, 200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(bossTimer.current);
    };
  }, [phase, lesson.id, lesson.mode]);

  useEffect(() => {
    if (phase !== 'practice' || lesson.mode !== 'sequence' || seqStage !== 'memorize') return undefined;
    const round = lesson.steps[stepIndex]?.round;
    const count = lesson.steps.filter((item) => item.round === round).length;
    setRevealCount(1);
    const timers = [];
    for (let index = 1; index < count; index += 1) {
      timers.push(window.setTimeout(() => setRevealCount(index + 1), index * 1900));
    }
    timers.push(window.setTimeout(() => {
      seqClockStart.current = Date.now();
      setSeqClock(0);
      setSeqStage('play');
    }, count * 1900 + 2100));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, lesson.id, lesson.mode, lesson.steps, seqStage, stepIndex]);

  useEffect(() => {
    if (seqStage !== 'play') return undefined;
    const id = window.setInterval(() => setSeqClock(Date.now() - seqClockStart.current), 200);
    return () => window.clearInterval(id);
  }, [seqStage]);

  useEffect(() => {
    if (!cameraOn) return undefined;
    let dead = false;
    let raf = 0;
    let lastUi = 0;
    let holdStart = 0;
    let lastGoodAt = 0;
    let fired = false;
    let armedStep = -1;
    let lastVideoTime = -1;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const marker = landmarkerRef.current;
      const video = videoRef.current;
      if (!marker || !video || video.readyState < 2) return;
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      const timestamp = performance.now();
      let points = null;
      try {
        points = marker.detectForVideo(video, timestamp)?.landmarks?.[0] ?? null;
      } catch {
        return;
      }

      const phaseNow = phaseRef.current;
      const index = modeRef.current === 'boss' ? bossSerialRef.current : stepRef.current;
      if (modeRef.current === 'sequence' && seqStageRef.current !== 'play') {
        drawPose(canvasRef.current, points, video, { error: false });
        return;
      }
      if (armedStep !== index) {
        armedStep = index;
        fired = false;
        holdStart = 0;
        lastGoodAt = 0;
        missLatch.current = false;
      }
      const current = modeRef.current === 'boss'
        ? { pose: bossPoseRef.current }
        : stepsRef.current[index];
      if (phaseNow === 'prep' || !current?.pose) {
        const framed = frameStatus(points);
        drawPose(canvasRef.current, points, video, { error: !framed.ok });
        if (timestamp - lastUi > 160) {
          lastUi = timestamp;
          setLive(framed);
        }
        return;
      }

      const verdict = evaluatePose(points, current.pose);
      drawPose(canvasRef.current, points, video, { error: !verdict.ok });
      if (verdict.ok) {
        if (!holdStart) holdStart = timestamp;
        lastGoodAt = timestamp;
        const holdMs = modeRef.current === 'boss' ? 280 : HOLD_MS;
        const ratio = Math.min(1, (timestamp - holdStart) / holdMs);
        if (timestamp - lastUi > 80) {
          lastUi = timestamp;
          setHold(ratio);
          setLive(verdict);
        }
        if (ratio >= 1 && !fired && !busyRef.current) {
          fired = true;
          holdStart = 0;
          hitRef.current();
        }
        return;
      }
      if (timestamp - lastGoodAt > 180) holdStart = 0;
      const wrongSide = /а нужна/.test(verdict.message || '');
      if (wrongSide && !missLatch.current && !busyRef.current && modeRef.current === 'boss') {
        missLatch.current = true;
        engineRef.current.miss?.();
      }
      if (!wrongSide) missLatch.current = false;
      if (timestamp - lastUi > 160) {
        lastUi = timestamp;
        setHold(0);
        setLive(verdict);
      }
    };

    const timer = window.setTimeout(() => {
      if (!dead && !landmarkerRef.current) setPoseFailed(true);
    }, 12000);
    createPoseLandmarker()
      .then((marker) => {
        window.clearTimeout(timer);
        if (dead) {
          marker.close?.();
          return;
        }
        landmarkerRef.current = marker;
        setPoseReady(true);
        setPoseFailed(false);
      })
      .catch(() => {
        window.clearTimeout(timer);
        if (!dead) setPoseFailed(true);
      });

    raf = requestAnimationFrame(tick);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      setPoseReady(false);
    };
  }, [cameraOn]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      speakRu('Не получилось включить камеру. Позови взрослого помочь.', { force: true });
      setModal(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setPoseFailed(false);
    } catch {
      setCameraOn(false);
      speakRu('Не получилось включить камеру. Позови взрослого помочь.', { force: true });
      setModal(true);
    }
  };

  const activePose = bossMode ? bossPose : step.pose;
  const command = bossMode ? (bossPose === 'left-arm' ? 'Лево!' : 'Право!') : step.prompt;
  const roundSteps = mode === 'sequence' ? steps.filter((item) => item.round === step.round) : [];
  const revealedSequenceStep = mode === 'sequence' && seqStage === 'memorize'
    ? roundSteps[Math.max(0, revealCount - 1)]
    : null;
  const demoPose = revealedSequenceStep?.pose || activePose;
  const indexInRound = Math.max(0, roundSteps.indexOf(step));
  const prepTask = mode === 'sequence' ? 'Запомни порядок' : mode === 'boss' ? 'Лево или право' : steps[0].prompt;
  const taskTitle = mode === 'sequence'
    ? (seqStage === 'memorize' ? 'Запомни порядок' : seqStage === 'mark' ? (seqGrade || 'Молодец') : 'Повтори')
    : command;
  const taskDetail = mode === 'sequence'
    ? (seqStage === 'memorize'
      ? 'Смотри на порядок. Через несколько секунд повторишь его по памяти.'
      : seqStage === 'mark'
        ? gentleNote(seqGrade || 'Молодец', seqClock)
        : `Движение ${indexInRound + 1} из ${roundSteps.length}. Время идёт спокойно.`)
    : step.detail;
  const manualAllowed = (!cameraOn || !activePose || poseFailed) && seqStage !== 'mark';
  const bar = bossMode
    ? Math.max(0, (bossLeft / 30000) * 100)
    : Math.max(8, ((stepIndex + (cameraOn && step.pose && !poseFailed && mode !== 'sequence' ? hold : 0)) / steps.length) * 100);
  const spoken = phase === 'prep'
    ? (bossMode ? 'Начинаем испытание! Повторяй за мной.' : prepTask)
    : mode === 'sequence'
      ? (seqStage === 'mark' ? (seqGrade || 'Молодец') : '')
      : praising
        ? (bossMode ? '' : stepIndex + 1 < steps.length ? 'Отлично! А теперь следующее движение.' : '')
        : (bossMode ? '' : step.prompt);
  const levelWord = faculty.id === 'sides' ? 'УРОВЕНЬ' : 'УПРАЖНЕНИЕ';
  const practiceLead = bossMode
    ? 'Тридцать секунд. Повторяй сторону, которую видишь на экране.'
    : mode === 'sequence'
      ? 'Сначала последовательность на экране, потом ты повторяешь её. Оценка по времени, без спешки.'
      : mode === 'intro'
        ? 'Сначала левая, потом правая, потом обе.'
        : 'Посмотри на Мово и повторяй движения в своём темпе.';
  const showHint = Boolean(stableHint) && !praising && phase === 'practice' && !(mode === 'sequence' && seqStage !== 'play');
  const demoVideo = phase === 'prep'
    ? (mode === 'boss' ? EXERCISE_VIDEOS.greeting : EXERCISE_VIDEOS[demoPose] || EXERCISE_VIDEOS.greeting)
    : praising || (mode === 'steps' && live?.ok)
      ? EXERCISE_VIDEOS.success
      : EXERCISE_VIDEOS[demoPose] || EXERCISE_VIDEOS.greeting;
  const demoPlaybackKey = `${phase}-${stepIndex}-${bossSerial}-${revealCount}-${praising ? 'success' : 'move'}`;

  useEffect(() => {
    if (praising || !live?.message || live.ok || phase !== 'practice' || (mode === 'sequence' && seqStage !== 'play')) {
      setStableHint('');
      return undefined;
    }
    const message = live.message;
    const timer = window.setTimeout(() => setStableHint(message), 420);
    return () => window.clearTimeout(timer);
  }, [live?.message, live?.ok, praising, phase, mode, seqStage]);

  useEffect(() => {
    resetSpeech();
    return () => resetSpeech();
  }, [phase, stepIndex, bossSerial]);

  useEffect(() => {
    speakRu(spoken);
  }, [spoken, phase, stepIndex, bossSerial, seqStage]);

  useEffect(() => {
    if (phase !== 'practice' || mode !== 'sequence' || seqStage !== 'memorize') return;
    const item = steps.filter((entry) => entry.round === step.round)[revealCount - 1];
    if (item) speakRu(item.prompt);
  }, [phase, mode, seqStage, revealCount, step.round, steps]);

  useEffect(() => {
    if (!showHint || !stableHint) return;
    speakRu(stableHint);
  }, [showHint, stableHint]);

  return (
    <section className="lesson-page">
      <button className="back-link" onClick={() => { stopCamera(); onBack(); }}><ArrowLeft size={17} /> Вернуться на дорожку</button>
      <div className="lesson-topline">
        <span className="eyebrow"><Sparkles size={15} /> {faculty.title.toUpperCase()}</span>
        <span className="lesson-number">{levelWord} {lessonIndex + 1} ИЗ {faculty.lessons.length}</span>
      </div>
      <div className="lesson-title-row">
        <div>
          <h1>{phase === 'prep' ? 'Приготовимся двигаться!' : lesson.title}</h1>
          <p className="page-subtitle">{phase === 'prep' ? 'Разреши камеру и встань в рамку. Видео остаётся на этом устройстве.' : practiceLead}</p>
        </div>
        <div className="timer-pill"><Clock3 size={16} /> {bossMode && phase === 'practice' ? formatTime(bossLeft) : mode === 'sequence' && phase === 'practice' && seqStage !== 'memorize' ? formatTime(seqClock) : lesson.minutes}</div>
      </div>
      {phase === 'practice' && <div className="lesson-progress"><span style={{ width: `${bar}%` }} /></div>}
      <div className="practice-grid">
        <div className={`camera-stage ${cameraOn ? 'camera-on' : ''}`}>
          {cameraOn ? <video ref={videoRef} autoPlay playsInline muted /> : (
            <div className="camera-placeholder">
              <div className="camera-orbit orbit-one" />
              <div className="camera-orbit orbit-two" />
              <div className="camera-person">
                <div className="person-head" />
                <div className="person-body" />
                <div className="person-arm left-arm" />
                <div className="person-arm right-arm" />
              </div>
              <div className="camera-mascot"><img src="/assets/logo.png" alt="Мово" /></div>
            </div>
          )}
          <canvas ref={canvasRef} className="pose-canvas" />
          <div className="frame-guide" />
          <div className="camera-label"><span className={cameraOn ? 'cam-live' : ''} />{cameraOn ? 'КАМЕРА ВКЛЮЧЕНА' : 'ПРЕДПРОСМОТР УРОКА'}</div>
          {showHint && <div className="screen-hint">{stableHint}</div>}
          {praising && phase === 'practice' && mode !== 'sequence' && <div className="screen-hint ok">Правильно!</div>}
          {phase === 'practice' && (
            <div className="camera-controls">
              <button className="camera-control" onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? 'Выключить камеру' : 'Включить камеру'}</button>
              <span>Изображение остаётся на устройстве</span>
            </div>
          )}
        </div>
        <div className="coach-panel">
          <ExerciseVideo src={demoVideo} pose={demoPose} playbackKey={demoPlaybackKey} />
          {phase === 'prep' ? (
            <>
              <div className="coach-bubble">
                <span className="bubble-kicker">ЗАДАНИЕ</span>
                <h2>{prepTask}</h2>
                <p>{mode === 'sequence' ? 'Сначала Мово покажет порядок на несколько секунд. Потом ты повторишь его по памяти.' : mode === 'boss' ? 'На экране появится сторона. Повторяй её.' : steps[0].detail}</p>
              </div>
              <ul className="prep-list">
                <li><Check size={16} /> Камера смотрит на тебя</li>
                <li><Check size={16} /> Видно всё тело до пояса</li>
                <li><Check size={16} /> Рядом есть место для рук</li>
              </ul>
              {!cameraOn && <button className="primary-button practice-button" onClick={startCamera}>Включить камеру и начать <ArrowRight size={19} /></button>}
              {cameraOn && (
                <>
                  <p className={`camera-readiness${poseReady && live?.ok ? ' is-ready' : ''}`} role="status">
                    {!poseReady ? 'Мово настраивает камеру…' : live?.ok ? 'Отлично, тебя видно целиком' : live?.message || 'Встань в рамку'}
                  </p>
                  <button
                    className="primary-button practice-button"
                    disabled={!poseReady || !live?.ok}
                    onClick={() => setPhase('practice')}
                  >
                    {!poseReady ? 'Настраиваем камеру…' : live?.ok ? 'Начать упражнение' : 'Встань в рамку'} <ArrowRight size={19} />
                  </button>
                </>
              )}
              <button className="secondary-button" onClick={() => { stopCamera(); setPhase('practice'); }}>Пройти без камеры</button>
            </>
          ) : (
            <>
              <div className="coach-bubble">
                <span className="bubble-kicker">{bossMode ? `ПРАВИЛЬНЫХ: ${bossScore}` : mode === 'sequence' && step.round ? `РАУНД ${step.round} ИЗ ${step.roundCount}` : `ДВИЖЕНИЕ ${stepIndex + 1} ИЗ ${steps.length}`}</span>
                <h2>{taskTitle}</h2>
                {mode === 'sequence' && seqStage === 'memorize' && (
                  <div className="seq-board">
                    {roundSteps.map((item, index) => (
                      <b key={`${item.prompt}-${index}`} className={index < revealCount ? 'is-on' : 'is-wait'}>{index < revealCount ? item.prompt.replace('!', '') : '···'}</b>
                    ))}
                  </div>
                )}
                {mode === 'sequence' && seqStage === 'play' && (
                  <div className="seq-pips" aria-hidden="true">
                    {roundSteps.map((item, index) => (
                      <span key={`${item.pose}-${index}`} className={index < indexInRound ? 'done' : index === indexInRound ? 'now' : ''} />
                    ))}
                  </div>
                )}
                {praising && mode !== 'sequence' && <div className="praise-chip">Правильно!</div>}
                {praising && mode === 'sequence' && <div className="praise-chip">Есть</div>}
                <p>{taskDetail}</p>
              </div>
              <div className="practice-meta">
                {bossMode ? (
                  <span><Target size={15} /> Правильных: <b>{bossScore}</b></span>
                ) : mode === 'sequence' ? (
                  <span><Target size={15} /> Раунд: <b>{step.round} / {step.roundCount}</b></span>
                ) : (
                  <span><Target size={15} /> Выполнено: <b>{stepIndex} / {steps.length}</b></span>
                )}
                <span><Star size={15} /> <b>+{STAR_REWARD} звёзд</b></span>
              </div>
              {cameraOn && activePose && !poseReady && !poseFailed && <p className="practice-disclaimer">Мово настраивает взгляд…</p>}
              {poseFailed && <p className="practice-disclaimer">Распознавание не загрузилось. Можно пройти по кнопке.</p>}
              {manualAllowed && (
                <button className="primary-button practice-button" disabled={praising} onClick={() => hitRef.current()}>
                  {mode === 'sequence' && seqStage === 'memorize' ? 'Я запомнил порядок' : mode === 'sequence' ? 'Я повторил движение' : bossMode ? 'Я выполнил!' : 'Я выполнил движение'} <ArrowRight size={19} />
                </button>
              )}
              {cameraOn && activePose && poseReady && !poseFailed && mode !== 'sequence' && <p className="practice-disclaimer">{bossMode ? 'Команда остаётся на месте. Подсказка, если нужна, появится на экране.' : 'Задание не исчезает. Подсказка, если нужна, появится красным на экране.'}</p>}
              <span className="practice-disclaimer">Это игровое упражнение, двигайся комфортно.</span>
            </>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
            <div className="modal-icon"><CircleHelp /></div>
            <h3>Камера пока недоступна</h3>
            <p>Разреши доступ к камере в настройках браузера. А пока можешь пройти урок в демо-режиме.</p>
            <button className="primary-button" onClick={() => { setModal(false); setPhase('practice'); }}>Хорошо, понятно</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultScreen({ result, onContinue }) {
  useEffect(() => {
    speakRu('Урок пройден! Ты отлично справился.', { force: true });
    return () => resetSpeech();
  }, []);

  return (
    <section className="result-page">
      <div className="result-confetti">✦</div>
      <div className="result-trophy"><Trophy size={52} /></div>
      <span className="eyebrow"><Sparkles size={15} /> {result.boss ? 'БОСС' : 'ОТЛИЧНАЯ РАБОТА!'}</span>
      <h1>{result.boss ? 'Босс побеждён!' : 'Ты прошёл урок!'}</h1>
      <p className="page-subtitle">{result.boss ? `Правильных движений: ${result.correct}` : result.grades?.length ? `Оценки: ${result.grades.join(', ')}.` : `Урок «${result.lesson.title}» засчитан. Мово гордится тобой.`}</p>
      <div className="result-stats">
        <div><span className="stat-icon green"><Target /></span><b>{result.boss ? result.correct : `${result.moves} / ${result.moves}`}</b><small>{result.boss ? 'правильных' : 'движения'}</small></div>
        <div><span className="stat-icon yellow"><Star /></span><b>{result.stars > 0 ? `+${result.stars}` : '0'}</b><small>{result.stars > 0 ? 'звёзд' : 'уже было'}</small></div>
        <div><span className="stat-icon blue"><Clock3 /></span><b>{formatTime(result.seconds)}</b><small>время</small></div>
      </div>
      <div className="result-quote">
        <img src="/assets/logo.png" alt="" />
        <p>«У тебя здорово получается! Готов к следующему приключению?»<b>— Мово</b></p>
      </div>
      <button className="primary-button result-button" onClick={onContinue}>Вернуться на дорожку <ArrowRight size={17} /></button>
    </section>
  );
}

function TasksScreen({ progress, onOpen }) {
  const rows = faculties.flatMap((faculty, facultyIndex) => {
    if (facultyState(progress, facultyIndex) === 'locked') return [];
    return faculty.lessons.map((lesson, lessonIndex) => ({
      faculty,
      lesson,
      state: lessonState(progress, faculty, lessonIndex),
    }));
  });
  const doneToday = Math.min(todayLessons(progress), 2);

  return (
    <section className="content-page">
      <div className="eyebrow"><Target size={15} /> МАЛЕНЬКИЕ ШАГИ К БОЛЬШИМ ПОБЕДАМ</div>
      <h1>Задания</h1>
      <p className="page-subtitle">Здесь только открытые факультеты. Следующее задание включается после предыдущего.</p>
      <div className="daily-progress-card">
        <div>
          <span className="rail-overline">ТВОЯ ДНЕВНАЯ ЦЕЛЬ</span>
          <h2>{doneToday} из 2 заданий готово</h2>
          <div className="rail-progress"><span style={{ width: `${doneToday * 50}%` }} /></div>
        </div>
        <div className="goal-icon"><Target /></div>
      </div>
      <div className="task-list">
        {rows.map(({ faculty, lesson, state }) => (
          <article key={lesson.id} className={`task-row ${state === 'done' ? 'completed' : ''} ${state === 'locked' ? 'locked' : ''}`}>
            <span className="task-check">{state === 'done' ? <Check size={18} /> : state === 'locked' ? <LockKeyhole size={16} /> : <Play size={16} />}</span>
            <div>
              <b>{lesson.title}</b>
              <small>{lesson.sub} · {faculty.title}</small>
            </div>
            <span className="task-reward"><Star size={14} fill="currentColor" /> {state === 'done' ? 'есть' : `+${STAR_REWARD}`}</span>
            <button disabled={state === 'locked'} onClick={() => onOpen(faculty, lesson)}>
              {state === 'done' ? 'Повторить' : state === 'locked' ? 'Закрыто' : 'Начать'} <ChevronRight size={15} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function RewardsScreen({ stars }) {
  const badges = [
    ['🌟', 'Первый шаг', 'Первый завершённый урок', stars > 0 ? 'earned' : 'locked'],
    ['🔥', 'Серия 3', 'Три дня движения подряд', 'locked'],
    ['🧭', 'Следопыт', 'Пройди пять уроков', 'locked'],
    ['🏆', 'Герой факультета', 'Заверши испытание курса', 'locked'],
    ['💫', 'Суперсерия', 'Семь дней занятий', 'locked'],
    ['🎓', 'Выпускник', 'Открой следующий факультет', 'locked'],
  ];
  return (
    <section className="content-page">
      <div className="eyebrow"><Award size={15} /> ТВОИ ДОСТИЖЕНИЯ</div>
      <h1>Зал наград</h1>
      <p className="page-subtitle">Каждая награда напоминает, как далеко ты уже продвинулся.</p>
      <div className="reward-summary">
        <span className="summary-icon"><Star fill="currentColor" /></span>
        <div><b>{stars} звёзд</b><small>{stars > 0 ? 'Ты уже собираешь созвездие.' : 'Первый урок зажжёт первую звезду.'}</small></div>
        <div className="summary-progress"><span style={{ width: `${Math.min(100, stars)}%` }} /></div>
      </div>
      <div className="badge-grid">
        {badges.map((badge) => (
          <article key={badge[1]} className={`badge-card ${badge[3]}`}>
            <div>{badge[3] === 'earned' ? badge[0] : <LockKeyhole size={24} />}</div>
            <b>{badge[1]}</b>
            <small>{badge[2]}</small>
            <span>{badge[3] === 'earned' ? 'ОТКРЫТО' : 'ВПЕРЕДИ'}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ParentsScreen({ doneToday, streak, stars }) {
  return (
    <section className="content-page">
      <div className="eyebrow"><Shield size={15} /> ПРОГРЕСС СЕМЬИ</div>
      <h1>Родительский уголок</h1>
      <p className="page-subtitle">Здесь собраны успехи и занятия ребёнка — спокойно и без сравнений.</p>
      <div className="parent-welcome">
        <img src="/assets/logo.png" alt="Мово" />
        <div>
          <b>Привет! Я Мово 👋</b>
          <span>Я помогу сделать домашние занятия понятными, короткими и интересными.</span>
        </div>
      </div>
      <div className="parent-metrics">
        <Metric icon={<Check />} value={`${doneToday}`} label="уроков сегодня" />
        <Metric icon={<Flame />} value={`${streak} дней`} label="серия занятий" />
        <Metric icon={<Star />} value={`${stars}`} label="звёзд" />
      </div>
      <article className="parent-report voice-settings">
        <div className="report-header">
          <div><span className="rail-overline">ГОЛОС MOVO</span><h3>Как звучит Мово</h3></div>
          <button className="primary-button voice-preview" onClick={() => speakRu('Привет! Я Мово. Давай попробуем вместе. У тебя всё получится!', { force: true })}>Послушать</button>
        </div>
        <p>Мово говорит голосом Каролины. Прослушай приветствие — так звучат записанные реплики в упражнениях.</p>
      </article>
      <article className="parent-report">
        <div className="report-header">
          <div>
            <span className="rail-overline">ПОСЛЕДНИЕ 7 ДНЕЙ</span>
            <h3>Занятия и навыки</h3>
          </div>
        </div>
        <div className="report-bars">
          {DAY_LABELS.map((day, index) => (
            <div key={day}><span style={{ height: `${[62, 38, 78, 55, 70, 28, 48][index]}%` }} className={index === (new Date().getDay() + 6) % 7 ? 'current' : ''} /><small>{day}</small></div>
          ))}
        </div>
        <div className="report-tip">
          <Sparkles size={17} />
          <span><b>Сильная сторона — лево и право</b>Попробуйте на следующей неделе добавить короткие упражнения на координацию.</span>
        </div>
        <p className="privacy-note inline"><Shield size={15} /> Movo показывает ход упражнений и не ставит диагнозы. Прогресс хранится только в браузере.</p>
      </article>
    </section>
  );
}

function Metric({ icon, value, label }) {
  return <div className="parent-metric"><span>{icon}</span><b>{value}</b><small>{label}</small></div>;
}

createRoot(document.getElementById('root')).render(<App />);
