import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowLeft, ArrowRight, Award, Check, ChevronRight, CircleHelp, Clock3, Flame, Footprints, Hand, Home, LockKeyhole, Menu, Play, Shield, Sparkles, Star, Target, Trophy, X } from 'lucide-react';
import './styles.css';

const lessons = [
  { id: 1, title: 'Левая рука', sub: 'Подними левую руку', state: 'current', icon: '←', commands: ['Подними левую руку', 'Покажи левую сторону ещё раз', 'Молодец! Ещё раз левая рука'] },
  { id: 2, title: 'Правая рука', sub: 'Подними правую руку', state: 'locked', icon: '→', commands: ['Подними правую руку', 'Покажи правую сторону ещё раз', 'Отлично! Ещё раз правая рука'] },
  { id: 3, title: 'Лево и право', sub: 'Выбери нужную сторону', state: 'locked', icon: '↔', commands: ['Подними левую руку', 'Теперь подними правую руку', 'Наклонись влево', 'Наклонись вправо'] },
  { id: 4, title: 'Щит', sub: 'Защити академию', state: 'locked', icon: '⬡' },
  { id: 5, title: 'Комбо', sub: 'Соедини движения', state: 'locked', icon: '✧' },
  { id: 6, title: 'Реакция', sub: 'Успей за сигналом', state: 'locked', icon: '⚡' },
  { id: 7, title: 'Испытание', sub: 'Проверь свои силы', state: 'locked', icon: '◇' },
  { id: 8, title: 'Босс', sub: 'Большое приключение', state: 'boss', icon: '★' },
];

const faculties = [
  ['01', 'Факультет сторон', 'Лево и право', 'В пути', 'active', '↔'],
  ['02', 'Факультет координации', 'Две стихии', 'Скоро откроется', 'upcoming', '✧'],
  ['03', 'Факультет равновесия', 'Башня равновесия', 'Закрыт', 'locked', '♧'],
  ['04', 'Факультет реакции', 'Арена реакции', 'Закрыт', 'locked', '⚡'],
  ['05', 'Факультет памяти', 'Библиотека памяти', 'Закрыт', 'locked', '⌘'],
];

function App() {
  const [screen, setScreen] = useState('path');
  const [activeTab, setActiveTab] = useState('Путь');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [modal, setModal] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [doneToday, setDoneToday] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [streak, setStreak] = useState(7);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const lesson = lessons[lessonIndex];
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  };
  useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);
  useEffect(() => { if (cameraOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [cameraOn]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraOn(false); setModal(true); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
    } catch { setCameraOn(false); setModal(true); }
  };

  const launchLesson = (index = lessonIndex) => { setLessonIndex(index); setScreen('lesson'); setActiveTab('Путь'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const finishLesson = () => {
    stopCamera();
    setDoneToday(n => Math.min(n + 1, 2));
    setCompletedLessons(n => Math.min(n + 1, 3));
    setLessonIndex(i => Math.min(i + 1, 2));
    setScreen('result');
  };
  const go = (tab) => {
    setActiveTab(tab); setMobileNav(false);
    if (tab === 'Путь') setScreen('path');
    else if (tab === 'Факультеты') setScreen('faculties');
    else if (tab === 'Задания') setScreen('tasks');
    else if (tab === 'Награды') setScreen('rewards');
    else if (tab === 'Для родителей') setScreen('parents');
  };

  return <div className="app-shell">
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Открыть меню"><Menu size={22}/></button>
      <button className="brand" onClick={() => go('Путь')}><img src="/assets/logo.png" alt=""/><span className="brand-name">Movo</span><span className="brand-caption">академия движения</span></button>
      <div className="top-spacer"/>
      <div className="top-pill"><Flame size={18} fill="#ffd450" stroke="#ffd450"/><span>{streak} дней</span></div>
      <div className="top-pill"><Star size={18} fill="#5bd0f5" stroke="#5bd0f5"/><span>{320 + (doneToday - 1) * 20}</span></div>
      <button className="profile" aria-label="Профиль">Л</button>
    </header>
    <div className="layout">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="side-mascot"><img src="/assets/logo.png" alt="Мово, волшебный помощник"/></div>
        <div className="mascot-name">Мово</div>
        <nav className="side-nav">
          <NavItem label="Путь" active={activeTab === 'Путь'} onClick={() => go('Путь')} icon={<Footprints/>}/>
          <NavItem label="Факультеты" active={activeTab === 'Факультеты'} onClick={() => go('Факультеты')} icon={<Sparkles/>}/>
          <NavItem label="Задания" active={activeTab === 'Задания'} onClick={() => go('Задания')} icon={<Target/>}/>
          <NavItem label="Награды" active={activeTab === 'Награды'} onClick={() => go('Награды')} icon={<Award/>}/>
        </nav>
        <div className="sidebar-bottom"><div className="parent-card"><strong>Для родителей</strong><span>Прогресс и домашние занятия</span><button onClick={() => go('Для родителей')}>Открыть <ArrowRight size={14}/></button></div><span className="sidebar-foot">Двигайся. Учись. Твори магию.</span></div>
      </aside>
      <main className="main-area">
        {screen === 'path' && <PathScreen onStart={() => launchLesson(Math.min(completedLessons, 2))} onLesson={launchLesson} doneToday={doneToday} completedLessons={completedLessons}/>}
        {screen === 'lesson' && <LessonScreen lesson={lesson} lessonIndex={lessonIndex} cameraOn={cameraOn} videoRef={videoRef} onStartCamera={startCamera} onStopCamera={stopCamera} onFinish={finishLesson} onBack={() => { stopCamera(); setScreen('path'); }}/>} 
        {screen === 'result' && <ResultScreen onContinue={() => setScreen('path')} lesson={lessons[Math.max(0, lessonIndex - 1)]}/>}
        {screen === 'faculties' && <FacultiesScreen onStart={() => launchLesson(Math.min(completedLessons, 2))}/>}
        {screen === 'tasks' && <TasksScreen onStart={() => launchLesson(Math.min(completedLessons, 2))} doneToday={doneToday}/>}
        {screen === 'rewards' && <RewardsScreen/>}
        {screen === 'parents' && <ParentsScreen doneToday={doneToday} streak={streak}/>}
      </main>
      {(screen === 'path' || screen === 'faculties') && <RightRail doneToday={doneToday} onQuest={() => launchLesson(Math.min(completedLessons, 2))}/>}
    </div>
    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button><div className="modal-icon"><CircleHelp/></div><h3>Камера пока недоступна</h3><p>Разреши доступ к камере в настройках браузера. А пока можешь пройти урок в демо-режиме.</p><button className="primary-button" onClick={() => { setModal(false); }}>Хорошо, понятно</button></div></div>}
    {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Закрыть меню"/>}
  </div>;
}

function NavItem({ label, active, onClick, icon }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span>{active && <ChevronRight size={16} className="nav-chevron"/>}</button>; }

function PathScreen({ onStart, onLesson, doneToday, completedLessons }) {
  const progress = completedLessons;
  return <div className="path-layout">
    <section className="path-column">
      <div className="eyebrow"><Sparkles size={15}/> ФАКУЛЬТЕТ СТОРОН</div>
      <div className="heading-row"><div><h1>Твой путь движения</h1><p className="page-subtitle">Короткие уроки помогают различать лево и право,<br className="desktop-only"/> двигаться точнее и увереннее.</p></div><div className="level-chip"><span>УРОВЕНЬ 1</span><b>✨</b></div></div>
      <div className="course-hero">
        <div className="course-badge"><img src="/assets/badge.svg" alt=""/><span>↔</span></div>
        <div className="course-info"><span className="course-kicker">КУРС 1 · ОСНОВЫ ДВИЖЕНИЯ</span><h2>Лево и право</h2><p>{progress} из 3 упражнений · осталось {Math.max(2, (3-progress)*2)} минуты</p><div className="course-progress"><span style={{width:`${(progress/3)*100}%`}}/></div></div>
        <button className="continue-button" onClick={onStart}><Play size={16} fill="currentColor"/> Продолжить</button>
      </div>
      <div className="lesson-map-wrap"><div className="map-caption"><span><span className="live-dot"/> ТВОЙ МАРШРУТ</span><span>{completedLessons} из 3 упражнений пройдено</span></div>
        <div className="lesson-map">
          <svg className="map-path" viewBox="0 0 520 835" preserveAspectRatio="none" aria-hidden="true"><path d="M222 32 C190 64 118 86 114 132 C107 179 245 202 257 263 C267 321 173 336 153 397 C135 452 265 481 275 543 C285 599 177 617 166 675 C155 727 264 744 286 811" fill="none" stroke="#b8dfc7" strokeWidth="12" strokeLinecap="round" strokeDasharray="1 0"/></svg>
          <div className="path-start"><span>✦</span><b>Курс начинается здесь</b><small>Каждый шаг — новое движение</small></div>
          {lessons.map((l, i) => { const available = i < completedLessons || i === completedLessons && i < 3; const completed = i < completedLessons; const state = completed ? 'done' : available ? 'current' : l.state === 'boss' ? 'boss' : 'locked'; return <button key={l.id} onClick={() => available && onLesson(i)} className={`lesson-stop stop-${i+1} ${state}`} aria-label={`${l.id}. ${l.title}${!available ? ', закрыто' : ''}`}><span className="stop-core">{completed ? <Check/> : state === 'locked' ? <LockKeyhole/> : l.icon}</span><span className="stop-label"><b>{i < 3 ? `УПРАЖНЕНИЕ ${i+1}` : l.id === 8 ? 'ФИНАЛЬНОЕ ИСПЫТАНИЕ' : `${l.id} · ${l.title}`}</b><small>{l.title}</small></span></button>; })}
          <div className="map-reward"><div className="chest">🎁</div><div><b>Сундук академии</b><small>Открой после испытания</small></div><LockKeyhole size={16}/></div>
        </div>
      </div>
      <section className="next-faculty"><div><span className="eyebrow">СЛЕДУЮЩАЯ ОСТАНОВКА</span><h3>Факультет координации</h3><p>Научимся управлять двумя руками одновременно.</p></div><div className="faculty-glyph">✧</div><span className="coming-soon">ОТКРОЕТСЯ ПОСЛЕ КУРСА</span></section>
    </section>
  </div>;
}

function RightRail({ doneToday, onQuest }) {
  return <aside className="right-rail">
    <section className="rail-card goal-card"><div className="rail-heading"><div><span className="rail-overline">ТВОЯ ЦЕЛЬ</span><h3>Маленький шаг<br/>каждый день</h3></div><div className="goal-icon"><Target size={20}/></div></div><p className="rail-muted">{doneToday} из 2 уроков завершено</p><div className="rail-progress"><span style={{width:`${doneToday*50}%`}}/></div><div className="quest-card"><div><span>ЕЖЕДНЕВНОЕ ЗАДАНИЕ</span><b>Пройди урок<br/>«Наклоны»</b></div><div className="reward-token">+20</div><button onClick={onQuest} aria-label="Начать ежедневное задание"><ChevronRight/></button></div></section>
    <section className="rail-card streak-card"><div className="section-title"><h3>Серия занятий</h3><span className="streak-count"><Flame size={14} fill="currentColor"/> 7</span></div><div className="week-dots">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((day,i)=><div className="day" key={day}><span className={i<4?'hit':i===4?'today':''}>{i<4?<Check size={14}/>:i===4?<Flame size={13} fill="currentColor"/>:''}</span><small>{day}</small></div>)}</div></section>
    <section className="rail-card skills-card"><div className="section-title"><div><span className="rail-overline">ТВОИ УСПЕХИ</span><h3>Навыки недели</h3></div><button className="dots-button" aria-label="Подробнее">•••</button></div><Skill name="Лево / право" value="82%" progress={82} color="green"/><Skill name="Реакция" value="1,4 с" progress={67} color="blue"/><Skill name="Точность" value="76%" progress={76} color="yellow"/><div className="coach-tip"><span>💡</span><p><b>Совет Мово</b>Занимайся по 5 минут каждый день — так навык становится увереннее.</p></div></section>
    <div className="privacy-note"><Shield size={15}/><span>Камера нужна только во время урока</span></div>
  </aside>;
}
function Skill({name,value,progress,color}) { return <div className={`skill-row ${color}`}><span className="skill-dot"/><div className="skill-content"><div><b>{name}</b><strong>{value}</strong></div><div className="skill-track"><span style={{width:`${progress}%`}}/></div></div></div>; }

function LessonScreen({ lesson, lessonIndex, cameraOn, videoRef, onStartCamera, onStopCamera, onFinish, onBack }) {
  const [prompt, setPrompt] = useState(0);
  const [count, setCount] = useState(0);
  const [wait, setWait] = useState(true);
  useEffect(() => { if (cameraOn) { setWait(true); const id = setTimeout(() => setWait(false), 2300); return () => clearTimeout(id); } }, [cameraOn, prompt]);
  const commands = lesson.commands || ['Подними левую руку', 'Теперь подними правую руку', 'Подними обе руки'];
  const targetReps = commands.length;
  const doMove = () => { if (count >= targetReps) { onFinish(); return; } if (cameraOn && wait) return; setCount(c => c + 1); setWait(true); setPrompt(p => Math.min(p + 1, targetReps - 1)); };
  return <section className="lesson-page"><button className="back-link" onClick={onBack}><ArrowLeft size={17}/> Вернуться на дорожку</button><div className="lesson-topline"><span className="eyebrow"><Sparkles size={15}/> ФАКУЛЬТЕТ СТОРОН</span><span className="lesson-number">УПРАЖНЕНИЕ {lesson.id} ИЗ 3</span></div><div className="lesson-title-row"><div><h1>{lesson.title}</h1><p className="page-subtitle">Посмотри на Мово и повторяй движения в своём темпе.</p></div><div className="timer-pill"><Clock3 size={16}/> 2–3 минуты</div></div><div className="lesson-progress"><span style={{width:`${Math.max(22, (count/targetReps)*100)}%`}}/></div><div className="practice-grid"><div className={`camera-stage ${cameraOn?'camera-on':''}`}>{cameraOn?<video ref={videoRef} autoPlay playsInline muted/>:<div className="camera-placeholder"><div className="camera-orbit orbit-one"/><div className="camera-orbit orbit-two"/><div className="camera-person"><div className="person-head"/><div className="person-body"/><div className="person-arm left-arm"/><div className="person-arm right-arm"/></div><div className="camera-mascot"><img src="/assets/logo.png" alt="Мово"/></div></div>}<div className="camera-label"><span className={cameraOn?'cam-live':''}/>{cameraOn?'КАМЕРА ВКЛЮЧЕНА':'ПРЕДПРОСМОТР УРОКА'}</div><div className="camera-controls"><button className="camera-control" onClick={cameraOn?onStopCamera:onStartCamera}>{cameraOn?'Выключить камеру':'Включить камеру'}</button><span>Изображение остаётся на устройстве</span></div></div><div className="coach-panel"><div className="coach-person"><img src="/assets/logo.png" alt="Мово"/><span>Мово · твой помощник</span></div><div className="coach-bubble"><span className="bubble-kicker">ДВИЖЕНИЕ {Math.min(count+1,targetReps)} ИЗ {targetReps}</span><h2>{commands[Math.min(prompt,targetReps-1)]}</h2><p>{wait&&cameraOn?'Хорошо! Приготовься к следующей команде.':'Встань так, чтобы тебя было хорошо видно целиком.'}</p></div><div className="hint-card"><Sparkles size={16}/><p><b>Подсказка</b>Смотри на цветную подсветку нужной стороны. Не торопись!</p></div><div className="practice-meta"><span><Target size={15}/> Выполнено: <b>{count} / {targetReps}</b></span><span><Star size={15}/> <b>+20 звёзд</b></span></div><button className="primary-button practice-button" onClick={doMove}>{count >= targetReps ? 'Завершить упражнение' : 'Я готов(а)!'}<ArrowRight size={17}/></button><span className="practice-disclaimer">Это игровое упражнение, двигайся комфортно.</span></div></div></section>;
}

function ResultScreen({ onContinue, lesson }) { return <section className="result-page"><div className="result-confetti">✦</div><div className="result-trophy"><Trophy size={52}/></div><span className="eyebrow"><Sparkles size={15}/> ОТЛИЧНАЯ РАБОТА!</span><h1>Ты прошёл урок!</h1><p className="page-subtitle">Мово гордится тобой. Каждый урок помогает двигаться увереннее.</p><div className="result-stats"><div><span className="stat-icon green"><Target/></span><b>3 / 3</b><small>движения</small></div><div><span className="stat-icon yellow"><Star/></span><b>+20</b><small>звёзд</small></div><div><span className="stat-icon blue"><Clock3/></span><b>2:34</b><small>время</small></div></div><div className="result-quote"><img src="/assets/logo.png" alt=""/><p>«У тебя здорово получается! Готов к следующему приключению?»<b>— Мово</b></p></div><button className="primary-button result-button" onClick={onContinue}>Вернуться на дорожку <ArrowRight size={17}/></button></section>; }

function FacultiesScreen({ onStart }) { return <section className="content-page"><div className="eyebrow"><Sparkles size={15}/> МИР MOVO</div><h1>Факультеты академии</h1><p className="page-subtitle">Каждый факультет открывает новый навык. Проходи уроки, чтобы двигаться всё увереннее.</p><div className="faculty-grid">{faculties.map((f,i)=><article key={f[0]} className={`faculty-card ${f[4]}`}><div className="faculty-card-top"><span className="faculty-number">{f[0]}</span><span className="faculty-symbol">{f[5]}</span></div><span className="faculty-card-kicker">{f[1]}</span><h3>{f[2]}</h3><div className="faculty-card-bottom"><span className={`faculty-state ${f[4]}`}>{f[4]==='active'?<><span className="live-dot"/> В процессе</>:f[4]==='upcoming'?'Скоро откроется':<><LockKeyhole size={13}/> Закрыт</>}</span>{i===0&&<button onClick={onStart}>Продолжить <ArrowRight size={15}/></button>}</div></article>)}</div><div className="feature-note"><Shield size={19}/><div><b>Твой комфорт — главное</b><span>Все упражнения можно выполнять в удобном для тебя темпе.</span></div></div></section>; }

function TasksScreen({ onStart, doneToday }) { return <section className="content-page"><div className="eyebrow"><Target size={15}/> МАЛЕНЬКИЕ ШАГИ К БОЛЬШИМ ПОБЕДАМ</div><h1>Задания на сегодня</h1><p className="page-subtitle">Короткие занятия помогают навыкам расти понемногу каждый день.</p><div className="daily-progress-card"><div><span className="rail-overline">ТВОЯ ДНЕВНАЯ ЦЕЛЬ</span><h2>{doneToday} из 2 заданий готово</h2><div className="rail-progress"><span style={{width:`${doneToday*50}%`}}/></div></div><div className="goal-icon"><Target/></div></div><div className="task-list"><TaskRow done={doneToday>0} label="Урок «Лево и право»" detail="3–5 минут · Факультет сторон" reward="+20" onClick={onStart}/><TaskRow done={doneToday>1} label="Урок «Наклоны»" detail="3–5 минут · Факультет сторон" reward="+20" onClick={onStart}/><TaskRow done={false} label="Свободная тренировка" detail="Повтори любимые движения" reward="+10" onClick={onStart}/></div></section>; }
function TaskRow({done,label,detail,reward,onClick}) { return <article className={`task-row ${done?'completed':''}`}><span className="task-check">{done?<Check size={18}/>:<Play size={16}/>}</span><div><b>{label}</b><small>{detail}</small></div><span className="task-reward"><Star size={14} fill="currentColor"/> {reward}</span><button onClick={onClick}>{done?'Повторить':'Начать'} <ChevronRight size={15}/></button></article>; }

function RewardsScreen() { const badges=[['🌟','Первый шаг','Первый завершённый урок','earned'],['🔥','Серия 3','Три дня движения подряд','earned'],['🧭','Следопыт','Пройди пять уроков','locked'],['🏆','Герой факультета','Заверши испытание курса','locked'],['💫','Суперсерия','Семь дней занятий','earned'],['🎓','Выпускник','Открой следующий факультет','locked']]; return <section className="content-page"><div className="eyebrow"><Award size={15}/> ТВОИ ДОСТИЖЕНИЯ</div><h1>Зал наград</h1><p className="page-subtitle">Каждая награда напоминает, как далеко ты уже продвинулся.</p><div className="reward-summary"><span className="summary-icon"><Star fill="currentColor"/></span><div><b>320 звёзд</b><small>Ты уже собрал целое созвездие!</small></div><div className="summary-progress"><span style={{width:'42%'}}/></div></div><div className="badge-grid">{badges.map(b=><article key={b[1]} className={`badge-card ${b[3]}`}><div>{b[3]==='earned'?b[0]:<LockKeyhole size={24}/>}</div><b>{b[1]}</b><small>{b[2]}</small><span>{b[3]==='earned'?'ОТКРЫТО':'ВПЕРЕДИ'}</span></article>)}</div></section>; }

function ParentsScreen({ doneToday, streak }) { return <section className="content-page"><div className="eyebrow"><Shield size={15}/> ПРОГРЕСС СЕМЬИ</div><h1>Родительский уголок</h1><p className="page-subtitle">Здесь собраны успехи и занятия ребёнка — спокойно и без сравнений.</p><div className="parent-welcome"><img src="/assets/logo.png" alt="Мово"/><div><b>Привет! Я Мово 👋</b><span>Я помогу сделать домашние занятия понятными, короткими и интересными.</span></div></div><div className="parent-metrics"><Metric icon={<Check/>} value={`${doneToday}`} label="уроков сегодня"/><Metric icon={<Flame/>} value={`${streak} дней`} label="серия занятий"/><Metric icon={<Star/>} value="82%" label="точность движений"/></div><article className="parent-report"><div className="report-header"><div><span className="rail-overline">ПОСЛЕДНИЕ 7 ДНЕЙ</span><h3>Занятия и навыки</h3></div><button className="filter-button">Эта неделя <ChevronRight size={14}/></button></div><div className="report-bars">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d,i)=><div key={d}><span style={{height:`${[62,38,78,55,70,28,48][i]}%`}} className={i===6?'current':''}/><small>{d}</small></div>)}</div><div className="report-tip"><Sparkles size={17}/><span><b>Сильная сторона — лево и право</b>Попробуйте на следующей неделе добавить короткие упражнения на координацию.</span></div><p className="privacy-note inline"><Shield size={15}/> Magic Motion показывает ход упражнений и не ставит диагнозы.</p></article></section>; }
function Metric({icon,value,label}) { return <div className="parent-metric"><span>{icon}</span><b>{value}</b><small>{label}</small></div>; }

createRoot(document.getElementById('root')).render(<App/>);
