'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from './auth-context';

type Task = { id: string; title: string; subject: string; due: string; done: boolean; uid: string };
type CalendarEvent = { id: string; title: string; startAt: string; location?: string; durationMinutes?: number; uid: string };
type Reminder = { id: string; title: string; dueAt: string; notes?: string; done: boolean; uid: string };
type Transaction = { id: string; title: string; amount: number; category: string; type: 'income' | 'expense'; createdAt: string; uid: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string };

const navItems = ['Today', 'Homework', 'Calendar', 'Wallet', 'Reminders', 'Focus', 'Community', 'Settings'];

const navIconPaths: Record<string, string> = {
  Today: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
  Homework: 'M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2ZM8 8h8M8 12h8M8 16h5',
  Calendar: 'M5 4v3M19 4v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1ZM8 12h2M14 12h2M8 16h2',
  Wallet: 'M4 6.5h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12M15 12h6',
  Reminders: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  Focus: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  Community: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6',
  Settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.7-1.1 1.7 1.7 0 0 0-1.2.5l-.1.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 1.1-1.7 1.7 1.7 0 0 0-.5-1.2l-.1-.1 1.7-2.9.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.7 1.1 1.7 1.7 0 0 0 1.2-.5l.1-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1v3.4Z'
};

function NavIcon({ name }: { name: string }) {
  return <svg className="navIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={navIconPaths[name] || navIconPaths.Today} /></svg>;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [active, setActive] = useState('Today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ask, setAsk] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [appError, setAppError] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDueAt, setReminderDueAt] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseType, setExpenseType] = useState<'expense' | 'income'>('expense');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    // Keep the task owner ID explicitly typed as a string for Firestore and Task.
    const uid: string = user?.uid ?? '';
    if (uid.length === 0) {
      setLoadingTasks(false);
      setTasks([]);
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      setLoadingTasks(true);
      const [taskResult, eventResult, reminderResult, transactionResult, budgetResult] = await Promise.allSettled([
        getDocs(query(collection(db, 'tasks'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'events'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'reminders'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'transactions'), where('uid', '==', uid))),
        getDocs(query(collection(db, 'budgets'), where('uid', '==', uid))),
      ]);
      if (cancelled) return;
      if (taskResult.status === 'fulfilled') {
        setTasks(taskResult.value.docs.map((item) => ({ id: item.id, ...item.data() } as Task)));
      } else {
        setAppError('Could not load tasks. Check your connection and Firebase rules.');
      }
      if (eventResult.status === 'fulfilled') {
        setEvents(eventResult.value.docs.map((item) => ({ id: item.id, ...item.data() } as CalendarEvent)).sort((a, b) => a.startAt.localeCompare(b.startAt)));
      }
      if (reminderResult.status === 'fulfilled') {
        setReminders(reminderResult.value.docs.map((item) => ({ id: item.id, ...item.data() } as Reminder)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
      }
      if (transactionResult.status === 'fulfilled') {
        setTransactions(transactionResult.value.docs.map((item) => ({ id: item.id, ...item.data() } as Transaction)));
      }
      if (budgetResult.status === 'fulfilled') {
        const amounts = budgetResult.value.docs.map((item) => Number(item.data().weeklyAmount) || 0);
        setWeeklyBudget(amounts[0] ?? 0);
      }
      setLoadingTasks(false);
    }

    loadTasks().catch(() => {
      if (!cancelled) {
        setLoadingTasks(false);
        setAppError('Could not load your tasks. Check your connection and Firebase rules, then retry.');
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const spentThisWeek = transactions.filter((item) => item.type === 'expense' && Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 && Date.now() >= new Date(item.createdAt).getTime()).reduce((sum, item) => sum + item.amount, 0);
  const budgetProgress = weeklyBudget > 0 ? Math.min(100, (spentThisWeek / weeklyBudget) * 100) : 0;

  async function toggleTask(task: Task) {
    const nextDone = !task.done;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: nextDone } : item));
    try { await updateDoc(doc(db, 'tasks', task.id), { done: nextDone }); }
    catch {
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: task.done } : item));
      setAppError('Could not update that task. Please try again.');
    }
  }

  async function addTask() {
    if (!newTask.trim() || !user) return;
    const data = { title: newTask.trim(), subject: 'Personal', due: 'Today', done: false, uid: user.uid };
    try {
      const created = await addDoc(collection(db, 'tasks'), data);
      setTasks((current) => [...current, { id: created.id, ...data }]);
      setNewTask(''); setShowAdd(false); setAppError('');
    } catch {
      setAppError('Could not save that task. Please try again.');
    }
  }

  async function askHoli() {
    const message = ask.trim();
    if (!message || !user || aiBusy) return;
    setAiBusy(true);
    setAiReply('');
    setAppError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, history: chatHistory, tasks: tasks.map(({ title, subject, due, done }) => ({ title, subject, due, done })) }),
      });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'Holi AI could not respond right now.');
      const reply = data.reply || 'I could not generate a reply. Please try again.';
      setAiReply(reply);
      setChatHistory((current): ChatMessage[] => [...current, { role: 'user', content: message }, { role: 'assistant', content: reply }].slice(-8));
      setAsk('');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Holi AI could not respond right now.');
    } finally {
      setAiBusy(false);
    }
  }

  async function addEvent() {
    if (!eventTitle.trim() || !eventStartAt || !user) return;
    const data = { title: eventTitle.trim(), startAt: new Date(eventStartAt).toISOString(), location: eventLocation.trim(), uid: user.uid };
    try {
      const created = await addDoc(collection(db, 'events'), data);
      setEvents((current) => [...current, { id: created.id, ...data }].sort((a, b) => a.startAt.localeCompare(b.startAt)));
      setEventTitle(''); setEventStartAt(''); setEventLocation(''); setShowAddEvent(false); setAppError('');
    } catch {
      setAppError('Could not save that event. Check that the latest Firestore rules are published.');
    }
  }

  async function removeEvent(event: CalendarEvent) {
    try {
      await deleteDoc(doc(db, 'events', event.id));
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch {
      setAppError('Could not delete that event. Please try again.');
    }
  }

  async function addReminder() {
    if (!reminderTitle.trim() || !reminderDueAt || !user) return;
    const data = { title: reminderTitle.trim(), dueAt: new Date(reminderDueAt).toISOString(), done: false, uid: user.uid };
    try {
      const created = await addDoc(collection(db, 'reminders'), data);
      setReminders((current) => [...current, { id: created.id, ...data }].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
      setReminderTitle(''); setReminderDueAt(''); setShowAddReminder(false); setAppError('');
    } catch {
      setAppError('Could not save that reminder. Check that the latest Firestore rules are published.');
    }
  }

  async function toggleReminder(reminder: Reminder) {
    try {
      await updateDoc(doc(db, 'reminders', reminder.id), { done: !reminder.done });
      setReminders((current) => current.map((item) => item.id === reminder.id ? { ...item, done: !item.done } : item));
    } catch {
      setAppError('Could not update that reminder. Please try again.');
    }
  }

  async function removeReminder(reminder: Reminder) {
    try {
      await deleteDoc(doc(db, 'reminders', reminder.id));
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
    } catch {
      setAppError('Could not delete that reminder. Please try again.');
    }
  }

  async function addTransaction() {
    const amount = Number(expenseAmount);
    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0 || !user) return;
    const data = { title: expenseTitle.trim(), amount, category: expenseCategory, type: expenseType, createdAt: new Date().toISOString(), uid: user.uid };
    try {
      const created = await addDoc(collection(db, 'transactions'), data);
      setTransactions((current) => [...current, { id: created.id, ...data }]);
      setExpenseTitle(''); setExpenseAmount(''); setShowAddExpense(false); setAppError('');
    } catch {
      setAppError('Could not save that wallet entry. Check that the latest Firestore rules are published.');
    }
  }

  async function saveBudget() {
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount < 0 || !user) return;
    try {
      const existing = await getDocs(query(collection(db, 'budgets'), where('uid', '==', user.uid)));
      if (existing.empty) {
        await addDoc(collection(db, 'budgets'), { weeklyAmount: amount, uid: user.uid });
      } else {
        await updateDoc(doc(db, 'budgets', existing.docs[0].id), { weeklyAmount: amount });
      }
      setWeeklyBudget(amount); setShowBudgetEditor(false); setAppError('');
    } catch {
      setAppError('Could not save your budget. Check that the latest Firestore rules are published.');
    }
  }

  async function removeTask(task: Task) {
    try {
      await deleteDoc(doc(db, 'tasks', task.id));
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setAppError('');
    } catch {
      setAppError('Could not delete that task. Please try again.');
    }
  }

  if (authLoading || !user) return <main className="authShell"><section className="authCard"><div className="brand"><span className="brandMark">H</span><span>holiwork</span></div><p>Opening your workspace…</p></section></main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">H</span><span>holiwork</span></div>
        <nav aria-label="Main navigation">{navItems.map((item) => <button key={item} type="button" aria-current={active === item ? 'page' : undefined} className={active === item ? 'navItem active' : 'navItem'} onClick={() => setActive(item)}><NavIcon name={item} /><span className="navLabel">{item}</span></button>)}</nav>
        <div className="sidebarBottom">
          <button type="button" className={active === 'Settings' ? 'navItem active' : 'navItem'} onClick={() => setActive('Settings')}><NavIcon name="Settings" /><span className="navLabel">Settings</span></button>
          <div className="profile"><div className="avatar">{(user.displayName || user.email || 'S').charAt(0).toUpperCase()}</div><div><strong>{user.displayName || 'Student'}</strong><small>{user.email}</small></div><button className="logoutButton" onClick={() => signOut(auth)}>Log out</button></div>
        </div>
      </aside>

      <section className="content">
        {appError && <div className="appError" role="alert">{appError}<button onClick={() => setAppError('')} aria-label="Dismiss error">×</button></div>}
        <header className="topbar"><div><p className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p><h1>{active === 'Today' ? `Good day, ${user.displayName || 'there'}.` : active}</h1></div><div className="topActions"><button className="iconButton" aria-label="Notifications">♧</button><button className="askButton" onClick={() => document.getElementById('ai-input')?.focus()}>Ask Holi <span>⌘ K</span></button></div></header>

        <div className="grid">
          <section className="hero card" style={{ display: active === 'Today' ? undefined : 'none' }}><div className="heroCopy"><span className="pill">YOUR DAY</span><h2>Make today<br /><em>count.</em></h2><p>One place for your work, money, and everything in between.</p><div className="heroButtons"><button className="primary" onClick={() => setShowAdd(true)}>+ Add task</button><button className="secondary" onClick={() => setActive('Focus')}>Start focus →</button></div></div><div className="orb"><div className="orbInner">{progress}<small>% done</small></div></div></section>

          <section className="card aiCard" style={{ display: active === 'Today' || active === 'Focus' ? undefined : 'none' }}><div className="sectionHead"><div><span className="pill dark">HOLI AI</span><h3>Your AI sidekick.</h3></div><span className="spark">✦</span></div><p className="aiHint">Ask anything about your work, schedule, or studies.</p><div className="suggestions"><button onClick={() => setAsk('Plan my evening')}>Plan my evening</button><button onClick={() => setAsk('Explain my hardest task')}>Explain a task</button></div><div className="aiInput"><input id="ai-input" value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void askHoli())} placeholder="Ask Holi anything..." aria-label="Ask Holi anything" /><button onClick={() => void askHoli()} disabled={aiBusy || !ask.trim()} aria-label="Send message">{aiBusy ? '…' : '↑'}</button></div>{aiReply && <p className="aiHint" role="status">{aiReply}</p>}</section>

          <section className="card tasksCard" style={{ display: active === 'Today' || active === 'Homework' ? undefined : 'none' }}><div className="sectionHead"><div><span className="pill">TASKS</span><h3>On your plate</h3></div><button className="textButton" onClick={() => setShowAdd(true)}>+ Add →</button></div><div className="taskList">{loadingTasks ? <p className="muted">Loading your tasks…</p> : tasks.length === 0 ? <p className="muted">No tasks yet. Add one to get started.</p> : tasks.map((task) => <div className="taskRow" key={task.id}><button className={task.done ? 'task done' : 'task'} onClick={() => void toggleTask(task)}><span className="check">{task.done ? '✓' : ''}</span><span className="taskText"><strong>{task.title}</strong><small>{task.subject} · {task.due}</small></span></button><button className="taskDelete" onClick={() => void removeTask(task)} aria-label={`Delete ${task.title}`}>×</button></div>)}</div></section>

          <section className="card moneyCard" style={{ display: active === 'Today' || active === 'Wallet' ? undefined : 'none' }}>
            <div className="sectionHead"><div><span className="pill">WALLET</span><h3>Money snapshot</h3></div><button className="textButton" onClick={() => { setBudgetInput(String(weeklyBudget)); setShowBudgetEditor(true); }}>Set budget</button></div>
            <div className="balance"><small>Weekly budget</small><strong>AED {weeklyBudget.toFixed(2)}</strong></div>
            <div className="moneyRow"><span>Spent in the last 7 days</span><strong>AED {spentThisWeek.toFixed(2)}</strong></div>
            <div className="progress"><span style={{ width: `${budgetProgress}%` }} /></div>
            <p className="muted">{transactions.length ? `${transactions.length} wallet entr${transactions.length === 1 ? 'y' : 'ies'} saved` : 'No wallet entries yet. Add your first expense or income.'}</p>
            <button className="secondary" onClick={() => setShowAddExpense(true)}>+ Add entry</button>
          </section>

          <section className="card scheduleCard" style={{ display: active === 'Today' || active === 'Calendar' ? undefined : 'none' }}>
            <div className="sectionHead"><div><span className="pill">UP NEXT</span><h3>Your schedule</h3></div><button className="textButton" onClick={() => setShowAddEvent(true)}>+ Add event</button></div>
            {events.filter((event) => Number.isFinite(new Date(event.startAt).getTime()) && new Date(event.startAt).getTime() >= Date.now()).slice(0, 4).map((event) => <div className="event" key={event.id}><div className="time">{new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><div className="eventLine" /><div className="eventDetails"><strong>{event.title}</strong><small>{event.location || 'No location added'}</small></div><button className="taskDelete" onClick={() => void removeEvent(event)} aria-label={`Delete ${event.title}`}>×</button></div>)}
            {events.filter((event) => Number.isFinite(new Date(event.startAt).getTime()) && new Date(event.startAt).getTime() >= Date.now()).length === 0 && <p className="muted">Nothing scheduled yet. Add an event to see it here.</p>}
          </section>
          {active === 'Reminders' && <section className="card tasksCard"><div className="sectionHead"><div><span className="pill">REMINDERS</span><h3>Things to remember</h3></div><button className="textButton" onClick={() => setShowAddReminder(true)}>+ Add reminder</button></div><div className="taskList">{reminders.length === 0 ? <p className="muted">No reminders yet. Add one to keep something on your radar.</p> : reminders.map((reminder) => <div className="taskRow" key={reminder.id}><button className={reminder.done ? 'task done' : 'task'} onClick={() => void toggleReminder(reminder)}><span className="check">{reminder.done ? '✓' : ''}</span><span className="taskText"><strong>{reminder.title}</strong><small>{new Date(reminder.dueAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small></span></button><button className="taskDelete" onClick={() => void removeReminder(reminder)} aria-label={`Delete ${reminder.title}`}>×</button></div>)}</div></section>}
          {active === 'Focus' && <section className="card communityCard focusPage"><span className="pill">FOCUS MODE</span><h3>Make space for deep work.</h3><p className="muted">Use Holi AI to break a task into smaller steps, then start a focused work session without distractions.</p><div className="focusActions"><button className="primary" onClick={() => { setActive('Homework'); }}>Choose a task</button><button className="secondary" onClick={() => { setActive('Today'); document.getElementById('ai-input')?.focus(); }}>Plan with Holi AI</button></div><div className="focusTip"><span className="focusTipIcon"><NavIcon name="Focus" /></span><div><strong>One thing at a time</strong><p className="muted">Pick one task, define the next small step, and give it your full attention.</p></div></div></section>}
          {active === 'Community' && <section className="card communityCard"><span className="pill">COMMUNITY</span><h3>Your community space is coming next.</h3><p className="muted">The community area is being prepared. Your personal workspace features are ready to use from the sidebar.</p></section>}
          {active === 'Settings' && <section className="card communityCard"><span className="pill">PREFERENCES</span><h3>Your workspace settings</h3><p className="muted">Signed in as {user.email || 'your account'}.</p><div className="settingsRow"><div><strong>Account</strong><small>Manage your current session</small></div><button className="secondary" onClick={() => void signOut(auth).then(() => router.replace('/login'))}>Log out</button></div><div className="settingsRow"><div><strong>Personal data</strong><small>Your tasks, reminders, schedule and wallet entries are stored under your account.</small></div></div></section>}
        </div>
        <footer><span>holiwork · one workspace for your whole life</span><span>⌘ K to ask Holi</span></footer>
      </section>

      {showBudgetEditor && <div className="modalBackdrop" onClick={() => setShowBudgetEditor(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">WEEKLY BUDGET</span><h3>Set your budget</h3><label>Amount in AED<input type="number" min="0" step="0.01" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="e.g. 300" /></label><div className="modalActions"><button className="secondary" onClick={() => setShowBudgetEditor(false)}>Cancel</button><button className="primary" onClick={() => void saveBudget()}>Save budget</button></div></div></div>}
      {showAddExpense && <div className="modalBackdrop" onClick={() => setShowAddExpense(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">WALLET ENTRY</span><h3>Add income or expense</h3><label>Description<input autoFocus value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="e.g. Lunch" /></label><label>Amount in AED<input type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="e.g. 25" /></label><label>Type<select value={expenseType} onChange={(e) => setExpenseType(e.target.value as 'expense' | 'income')}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}><option>Food</option><option>Transport</option><option>Study</option><option>Shopping</option><option>Income</option><option>Other</option></select></label><div className="modalActions"><button className="secondary" onClick={() => setShowAddExpense(false)}>Cancel</button><button className="primary" onClick={() => void addTransaction()}>Save entry</button></div></div></div>}
      {showAddEvent && <div className="modalBackdrop" onClick={() => setShowAddEvent(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">CALENDAR EVENT</span><h3>Add to your schedule</h3><label>Event title<input autoFocus value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Project meeting" /></label><label>Date and time<input type="datetime-local" value={eventStartAt} onChange={(e) => setEventStartAt(e.target.value)} /></label><label>Location (optional)<input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. Library" /></label><div className="modalActions"><button className="secondary" onClick={() => setShowAddEvent(false)}>Cancel</button><button className="primary" onClick={() => void addEvent()}>Save event</button></div></div></div>}
      {showAddReminder && <div className="modalBackdrop" onClick={() => setShowAddReminder(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">NEW REMINDER</span><h3>What should you remember?</h3><label>Reminder<input autoFocus value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="e.g. Submit assignment" /></label><label>Date and time<input type="datetime-local" value={reminderDueAt} onChange={(e) => setReminderDueAt(e.target.value)} /></label><div className="modalActions"><button className="secondary" onClick={() => setShowAddReminder(false)}>Cancel</button><button className="primary" onClick={() => void addReminder()}>Save reminder</button></div></div></div>}
      {showAdd && <div className="modalBackdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><span className="pill">NEW TASK</span><h3>What needs doing?</h3><input autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="e.g. Finish project outline" /><div className="modalActions"><button className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary" onClick={addTask}>Add task</button></div></div></div>}
    </main>
  );
}
