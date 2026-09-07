'use client';

import { useMemo, useState } from 'react';

type Task = { id: number; title: string; subject: string; due: string; done: boolean };

const initialTasks: Task[] = [
  { id: 1, title: 'Finish thermodynamics problem set', subject: 'Physics', due: 'Today · 6:00 PM', done: false },
  { id: 2, title: 'Review Boolean algebra notes', subject: 'Digital Logic', due: 'Today · 8:30 PM', done: false },
  { id: 3, title: 'Submit Java lab report', subject: 'Programming', due: 'Tomorrow · 10:00 AM', done: false },
  { id: 4, title: 'Read chapter 4', subject: 'Mathematics', due: 'Wed · 5:00 PM', done: true },
];

const navItems = ['Today', 'Homework', 'Wallet', 'Focus', 'Community'];

export default function Home() {
  const [active, setActive] = useState('Today');
  const [tasks, setTasks] = useState(initialTasks);
  const [ask, setAsk] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState('');

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks((current) => [...current, { id: Date.now(), title: newTask.trim(), subject: 'Personal', due: 'Today', done: false }]);
    setNewTask('');
    setShowAdd(false);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">H</span><span>holiwork</span></div>
        <nav>
          {navItems.map((item, index) => (
            <button key={item} className={active === item ? 'navItem active' : 'navItem'} onClick={() => setActive(item)}>
              <span className="navIcon">{['⌂', '□', '◒', '◉', '♧'][index]}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebarBottom">
          <button className="navItem"><span className="navIcon">⚙</span>Settings</button>
          <div className="profile"><div className="avatar">S</div><div><strong>Student</strong><small>Personal workspace</small></div><span>•••</span></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">Monday, September 7</p><h1>Good morning, Sumukh.</h1></div>
          <div className="topActions"><button className="iconButton" aria-label="Notifications">♧</button><button className="askButton" onClick={() => document.getElementById('ai-input')?.focus()}>Ask Holi <span>⌘ K</span></button></div>
        </header>

        <div className="grid">
          <section className="hero card">
            <div className="heroCopy"><span className="pill">YOUR DAY</span><h2>Make today<br /><em>count.</em></h2><p>One place for your work, money, and everything in between.</p><div className="heroButtons"><button className="primary" onClick={() => setShowAdd(true)}>+ Add task</button><button className="secondary" onClick={() => setActive('Focus')}>Start focus →</button></div></div>
            <div className="orb"><div className="orbInner">{progress}<small>% done</small></div></div>
          </section>

          <section className="card aiCard">
            <div className="sectionHead"><div><span className="pill dark">HOLI AI</span><h3>Your AI sidekick.</h3></div><span className="spark">✦</span></div>
            <p className="aiHint">Ask anything about your work, schedule, or studies.</p>
            <div className="suggestions"><button onClick={() => setAsk('Plan my evening')}>Plan my evening</button><button onClick={() => setAsk('Explain my hardest task')}>Explain a task</button></div>
            <div className="aiInput"><input id="ai-input" value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setAsk('')} placeholder="Ask Holi anything..." /><button onClick={() => setAsk('')}>↑</button></div>
          </section>

          <section className="card tasksCard">
            <div className="sectionHead"><div><span className="pill">TASKS</span><h3>On your plate</h3></div><button className="textButton" onClick={() => setShowAdd(true)}>View all →</button></div>
            <div className="taskList">
              {tasks.map((task) => <button className={task.done ? 'task done' : 'task'} key={task.id} onClick={() => toggleTask(task.id)}><span className="check">{task.done ? '✓' : ''}</span><span className="taskText"><strong>{task.title}</strong><small>{task.subject} · {task.due}</small></span></button>)}
            </div>
          </section>

          <section className="card moneyCard">
            <div className="sectionHead"><div><span className="pill">WALLET</span><h3>Money snapshot</h3></div><span className="dots">•••</span></div>
            <div className="balance"><small>Available this week</small><strong>AED 420.00</strong></div>
            <div className="moneyRow"><span>Spent</span><strong>AED 86.50</strong></div><div className="progress"><span style={{ width: '21%' }} /></div><p className="muted">21% of your weekly budget used</p>
          </section>

          <section className="card scheduleCard">
            <div className="sectionHead"><div><span className="pill">UP NEXT</span><h3>Your schedule</h3></div><button className="textButton">Calendar →</button></div>
            <div className="event"><div className="time">04:00<small>PM</small></div><div className="eventLine" /><div><strong>Physics lecture</strong><small>Room B-204 · 60 min</small></div></div>
            <div className="event"><div className="time">06:00<small>PM</small></div><div className="eventLine" /><div><strong>Deep work</strong><small>Thermodynamics · 90 min</small></div></div>
            <div className="event"><div className="time">08:30<small>PM</small></div><div className="eventLine" /><div><strong>Free time</strong><small>No plans. You earned it.</small></div></div>
          </section>
        </div>

        <footer><span>holiwork · one workspace for your whole life</span><span>⌘ K to ask Holi</span></footer>
      </section>

      {showAdd && <div className="modalBackdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">NEW TASK</span><h3>What needs doing?</h3><input autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="e.g. Finish project outline" /><div className="modalActions"><button className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary" onClick={addTask}>Add task</button></div></div></div>}
    </main>
  );
}
