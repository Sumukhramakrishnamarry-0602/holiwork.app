'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from './auth-context';

type Task = { id: string; title: string; subject: string; due: string; done: boolean; uid: string };

const starterTasks = [
  { title: 'Finish thermodynamics problem set', subject: 'Physics', due: 'Today · 6:00 PM', done: false },
  { title: 'Review Boolean algebra notes', subject: 'Digital Logic', due: 'Today · 8:30 PM', done: false },
  { title: 'Submit Java lab report', subject: 'Programming', due: 'Tomorrow · 10:00 AM', done: false },
  { title: 'Read chapter 4', subject: 'Mathematics', due: 'Wed · 5:00 PM', done: true },
];

const navItems = ['Today', 'Homework', 'Wallet', 'Focus', 'Community'];

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [active, setActive] = useState('Today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ask, setAsk] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadTasks() {
      setLoadingTasks(true);
      const snapshot = await getDocs(query(collection(db, 'tasks'), where('uid', '==', user.uid)));
      if (cancelled) return;
      if (snapshot.empty) {
        const created = await Promise.all(starterTasks.map((task) => addDoc(collection(db, 'tasks'), { ...task, uid: user.uid })));
        setTasks(created.map((item, index) => ({ id: item.id, ...starterTasks[index], uid: user.uid })));
      } else {
        setTasks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Task)));
      }
      setLoadingTasks(false);
    }
    loadTasks().catch(() => setLoadingTasks(false));
    return () => { cancelled = true; };
  }, [user]);

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  async function toggleTask(task: Task) {
    const nextDone = !task.done;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: nextDone } : item));
    try { await updateDoc(doc(db, 'tasks', task.id), { done: nextDone }); }
    catch { setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: task.done } : item)); }
  }

  async function addTask() {
    if (!newTask.trim() || !user) return;
    const data = { title: newTask.trim(), subject: 'Personal', due: 'Today', done: false, uid: user.uid };
    const created = await addDoc(collection(db, 'tasks'), data);
    setTasks((current) => [...current, { id: created.id, ...data }]);
    setNewTask(''); setShowAdd(false);
  }

  if (authLoading || !user) return <main className="authShell"><section className="authCard"><div className="brand"><span className="brandMark">H</span><span>holiwork</span></div><p>Opening your workspace…</p></section></main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">H</span><span>holiwork</span></div>
        <nav>{navItems.map((item, index) => <button key={item} className={active === item ? 'navItem active' : 'navItem'} onClick={() => setActive(item)}><span className="navIcon">{['⌂', '□', '◒', '◉', '♧'][index]}</span>{item}</button>)}</nav>
        <div className="sidebarBottom">
          <button className="navItem"><span className="navIcon">⚙</span>Settings</button>
          <div className="profile"><div className="avatar">{(user.displayName || user.email || 'S').charAt(0).toUpperCase()}</div><div><strong>{user.displayName || 'Student'}</strong><small>{user.email}</small></div><button className="logoutButton" onClick={() => signOut(auth)}>Log out</button></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar"><div><p className="eyebrow">Monday, September 7</p><h1>Good morning, {user.displayName || 'there'}.</h1></div><div className="topActions"><button className="iconButton" aria-label="Notifications">♧</button><button className="askButton" onClick={() => document.getElementById('ai-input')?.focus()}>Ask Holi <span>⌘ K</span></button></div></header>

        <div className="grid">
          <section className="hero card"><div className="heroCopy"><span className="pill">YOUR DAY</span><h2>Make today<br /><em>count.</em></h2><p>One place for your work, money, and everything in between.</p><div className="heroButtons"><button className="primary" onClick={() => setShowAdd(true)}>+ Add task</button><button className="secondary" onClick={() => setActive('Focus')}>Start focus →</button></div></div><div className="orb"><div className="orbInner">{progress}<small>% done</small></div></div></section>

          <section className="card aiCard"><div className="sectionHead"><div><span className="pill dark">HOLI AI</span><h3>Your AI sidekick.</h3></div><span className="spark">✦</span></div><p className="aiHint">Ask anything about your work, schedule, or studies.</p><div className="suggestions"><button onClick={() => setAsk('Plan my evening')}>Plan my evening</button><button onClick={() => setAsk('Explain my hardest task')}>Explain a task</button></div><div className="aiInput"><input id="ai-input" value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setAsk('')} placeholder="Ask Holi anything..." /><button onClick={() => setAsk('')}>↑</button></div></section>

          <section className="card tasksCard"><div className="sectionHead"><div><span className="pill">TASKS</span><h3>On your plate</h3></div><button className="textButton" onClick={() => setShowAdd(true)}>+ Add →</button></div><div className="taskList">{loadingTasks ? <p className="muted">Loading your tasks…</p> : tasks.map((task) => <button className={task.done ? 'task done' : 'task'} key={task.id} onClick={() => toggleTask(task)}><span className="check">{task.done ? '✓' : ''}</span><span className="taskText"><strong>{task.title}</strong><small>{task.subject} · {task.due}</small></span></button>)}</div></section>

          <section className="card moneyCard"><div className="sectionHead"><div><span className="pill">WALLET</span><h3>Money snapshot</h3></div><span className="dots">•••</span></div><div className="balance"><small>Available this week</small><strong>AED 420.00</strong></div><div className="moneyRow"><span>Spent</span><strong>AED 86.50</strong></div><div className="progress"><span style={{ width: '21%' }} /></div><p className="muted">21% of your weekly budget used</p></section>

          <section className="card scheduleCard"><div className="sectionHead"><div><span className="pill">UP NEXT</span><h3>Your schedule</h3></div><button className="textButton">Calendar →</button></div><div className="event"><div className="time">04:00<small>PM</small></div><div className="eventLine" /><div><strong>Physics lecture</strong><small>Room B-204 · 60 min</small></div></div><div className="event"><div className="time">06:00<small>PM</small></div><div className="eventLine" /><div><strong>Deep work</strong><small>Thermodynamics · 90 min</small></div></div><div className="event"><div className="time">08:30<small>PM</small></div><div className="eventLine" /><div><strong>Free time</strong><small>No plans. You earned it.</small></div></div></section>
        </div>
        <footer><span>holiwork · one workspace for your whole life</span><span>⌘ K to ask Holi</span></footer>
      </section>

      {showAdd && <div className="modalBackdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">NEW TASK</span><h3>What needs doing?</h3><input autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="e.g. Finish project outline" /><div className="modalActions"><button className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary" onClick={addTask}>Add task</button></div></div></div>}
    </main>
  );
}
