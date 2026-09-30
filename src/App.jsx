import { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Check, Trash2, Search, X, Calendar } from 'lucide-react'

const PRIORITY = {
  low:  { label: 'ต่ำ',  cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  med:  { label: 'กลาง', cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  high: { label: 'สูง',  cls: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-500' },
}
const P_ORDER = ['low', 'med', 'high']

const CATEGORIES = {
  work:     { label: 'งาน',      cls: 'bg-sky-100 text-sky-700',      dot: 'bg-sky-500' },
  personal: { label: 'ส่วนตัว',  cls: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  shopping: { label: 'ช้อปปิ้ง', cls: 'bg-pink-100 text-pink-700',    dot: 'bg-pink-500' },
  health:   { label: 'สุขภาพ',   cls: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500' },
}
const C_ORDER = Object.keys(CATEGORIES)

const TABS = [['all', 'ทั้งหมด'], ['active', 'ยังไม่เสร็จ'], ['done', 'เสร็จแล้ว']]

const pad = (n) => String(n).padStart(2, '0')
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = () => toStr(new Date())
const offsetStr = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toStr(d)
}
const fmtDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// Status of a todo: 'done' | 'overdue' | 'active'
const statusOf = (t, today) => (t.done ? 'done' : t.due && t.due < today ? 'overdue' : 'active')

function dueBadge(t, today) {
  if (!t.due) return null
  if (t.done) return { cls: 'bg-gray-100 text-gray-500', text: fmtDate(t.due) }
  if (t.due < today) return { cls: 'bg-red-100 text-red-700', text: `เลยกำหนด · ${fmtDate(t.due)}` }
  if (t.due === today) return { cls: 'bg-yellow-100 text-yellow-700', text: 'วันนี้' }
  return { cls: 'bg-gray-100 text-gray-600', text: fmtDate(t.due) }
}

function Donut({ done, active, overdue }) {
  const total = done + active + overdue
  const segs = [
    [done, '#10b981'],
    [active, '#6366f1'],
    [overdue, '#ef4444'],
  ]
  let offset = 25 // start at 12 o'clock
  return (
    <svg viewBox="0 0 36 36" className="w-24 h-24 shrink-0" role="img" aria-label="สัดส่วนสถานะงาน">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--line)" strokeWidth="4" />
      {total > 0 &&
        segs.map(([n, color], i) => {
          if (!n) return null
          const len = (n / total) * 100
          const el = (
            <circle
              key={i}
              cx="18" cy="18" r="15.9155" fill="none"
              stroke={color} strokeWidth="4"
              strokeDasharray={`${len} ${100 - len}`}
              strokeDashoffset={offset}
            />
          )
          offset -= len
          return el
        })}
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="currentColor" fontWeight="600">
        {total ? Math.round((done / total) * 100) : 0}%
      </text>
    </svg>
  )
}

function Stats({ todos, today }) {
  const counts = { done: 0, active: 0, overdue: 0 }
  todos.forEach((t) => counts[statusOf(t, today)]++)
  const total = todos.length
  const pct = total ? Math.round((counts.done / total) * 100) : 0
  const legend = [
    ['เสร็จแล้ว', counts.done, 'bg-emerald-500'],
    ['กำลังทำ', counts.active, 'bg-indigo-500'],
    ['เลยกำหนด', counts.overdue, 'bg-red-500'],
  ]
  return (
    <section className="card rounded-2xl p-4 mb-4 flex items-center gap-4 sm:gap-6 flex-wrap">
      <Donut {...counts} />
      <div className="flex gap-6">
        <div>
          <div className="text-2xl font-semibold">{total}</div>
          <div className="text-sm muted">งานทั้งหมด</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">{pct}%</div>
          <div className="text-sm muted">เสร็จแล้ว</div>
        </div>
      </div>
      <ul className="text-sm space-y-1 sm:ml-auto">
        {legend.map(([label, n, dot]) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span className="muted">{label}</span>
            <span className="font-medium">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TodoItem({ todo, today, onToggle, onDelete, onEdit, onCyclePriority, onCycleCategory }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(todo.text)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    const v = value.trim()
    if (v) onEdit(todo.id, v)
    else setValue(todo.text)
    setEditing(false)
  }

  const p = PRIORITY[todo.pri]
  const c = CATEGORIES[todo.cat]
  const due = dueBadge(todo, today)

  return (
    <li className={`item card rounded-xl mb-2 px-3 py-3 flex items-start gap-3 ${todo.removing ? 'out' : ''}`}>
      <button
        onClick={() => onToggle(todo.id)}
        aria-label="ทำเครื่องหมายว่าเสร็จ"
        className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          todo.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {todo.done && <Check size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') {
                setValue(todo.text)
                setEditing(false)
              }
            }}
            className="w-full bg-transparent border-b-2 border-indigo-400 outline-none py-0.5"
          />
        ) : (
          <span
            onDoubleClick={() => {
              setValue(todo.text)
              setEditing(true)
            }}
            title="ดับเบิลคลิกเพื่อแก้ไข"
            className={`block break-words cursor-text select-none ${todo.done ? 'line-through muted' : ''}`}
          >
            {todo.text}
          </span>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          <button
            onClick={() => onCycleCategory(todo.id)}
            title="แตะเพื่อเปลี่ยนหมวดหมู่"
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.cls}`}
          >
            {c.label}
          </button>
          {due && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${due.cls}`}>
              <Calendar size={11} />
              {due.text}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onCyclePriority(todo.id)}
        title="แตะเพื่อเปลี่ยนระดับความสำคัญ"
        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${p.cls}`}
      >
        {p.label}
      </button>

      <button
        onClick={() => onDelete(todo.id)}
        aria-label="ลบ"
        className="shrink-0 p-1.5 rounded-lg muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </li>
  )
}

export default function App() {
  const today = todayStr()
  const [todos, setTodos] = useState([
    { id: 1, text: 'ส่งรายงานประจำสัปดาห์', done: false, pri: 'high', cat: 'work', due: offsetStr(-2) },
    { id: 2, text: 'ประชุมทีมตอนบ่าย', done: false, pri: 'med', cat: 'work', due: today },
    { id: 3, text: 'ซื้อผักและผลไม้', done: false, pri: 'low', cat: 'shopping', due: offsetStr(2) },
    { id: 4, text: 'วิ่งสวนสาธารณะ 30 นาที', done: true, pri: 'low', cat: 'health', due: '' },
    { id: 5, text: 'โทรหาที่บ้าน', done: false, pri: 'med', cat: 'personal', due: '' },
  ])
  const [text, setText] = useState('')
  const [pri, setPri] = useState('med')
  const [cat, setCat] = useState('personal')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const nextId = useRef(6)

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((ts) => [{ id: nextId.current++, text: v, done: false, pri, cat, due }, ...ts])
    setText('')
    setDue('')
  }
  const patch = (id, fn) => setTodos((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))
  const toggle = (id) => patch(id, (t) => ({ ...t, done: !t.done }))
  const edit = (id, v) => patch(id, (t) => ({ ...t, text: v }))
  const cyclePriority = (id) =>
    patch(id, (t) => ({ ...t, pri: P_ORDER[(P_ORDER.indexOf(t.pri) + 1) % P_ORDER.length] }))
  const cycleCategory = (id) =>
    patch(id, (t) => ({ ...t, cat: C_ORDER[(C_ORDER.indexOf(t.cat) + 1) % C_ORDER.length] }))

  const remove = (id) => {
    patch(id, (t) => ({ ...t, removing: true }))
    setTimeout(() => setTodos((ts) => ts.filter((t) => t.id !== id)), 250)
  }
  const clearDone = () => {
    setTodos((ts) => ts.map((t) => (t.done ? { ...t, removing: true } : t)))
    setTimeout(() => setTodos((ts) => ts.filter((t) => !t.done)), 250)
  }

  const catCounts = useMemo(() => {
    const m = { all: todos.length }
    C_ORDER.forEach((k) => (m[k] = todos.filter((t) => t.cat === k).length))
    return m
  }, [todos])

  const q = query.trim().toLowerCase()
  const shown = todos.filter(
    (t) =>
      (filter === 'all' ? true : filter === 'active' ? !t.done : t.done) &&
      (catFilter === 'all' || t.cat === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  )

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.filter((t) => t.done).length
  const emptyText = q
    ? 'ไม่พบงานที่ค้นหา'
    : filter === 'done'
    ? 'ยังไม่มีงานที่เสร็จ'
    : filter === 'active'
    ? 'ไม่มีงานที่ค้างอยู่ 🎉'
    : 'ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย'

  const sideItems = [['all', 'ทั้งหมด', 'bg-gray-400'], ...C_ORDER.map((k) => [k, CATEGORIES[k].label, CATEGORIES[k].dot])]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6">รายการงานของฉัน</h1>

      <Stats todos={todos} today={today} />

      <div className="md:grid md:grid-cols-[200px_1fr] md:gap-6">
        <aside className="mb-4 md:mb-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {sideItems.map(([k, label, dot]) => (
              <button
                key={k}
                onClick={() => setCatFilter(k)}
                className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  catFilter === k ? 'card font-medium ring-2 ring-indigo-400' : 'card muted hover:opacity-80'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-xs muted">{catCounts[k]}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="card rounded-2xl p-3 sm:p-4 mb-4">
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="เพิ่มงานใหม่..."
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 rounded-xl border line outline-none focus:border-indigo-400"
              />
              <button
                onClick={add}
                className="shrink-0 flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 rounded-xl transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">เพิ่ม</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm muted">ความสำคัญ:</span>
              {P_ORDER.map((k) => (
                <button
                  key={k}
                  onClick={() => setPri(k)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-colors ${
                    pri === k ? `${PRIORITY[k].cls} border-transparent font-medium` : 'line muted hover:opacity-80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${PRIORITY[k].dot}`} />
                  {PRIORITY[k].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm muted">
                กำหนดส่ง
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="bg-transparent border line rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400"
                  style={{ color: 'var(--text)' }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm muted">
                หมวดหมู่
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="bg-transparent border line rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400"
                  style={{ color: 'var(--text)' }}
                >
                  {C_ORDER.map((k) => (
                    <option key={k} value={k}>{CATEGORIES[k].label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหางาน..."
              className="w-full card rounded-xl pl-9 pr-9 py-2.5 bg-transparent outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="ล้างการค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 muted hover:opacity-70"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-1 mb-4 p-1 rounded-xl card">
            {TABS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
                  filter === k ? 'bg-indigo-500 text-white font-medium' : 'muted hover:opacity-80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {shown.length ? (
            <ul>
              {shown.map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  today={today}
                  onToggle={toggle}
                  onDelete={remove}
                  onEdit={edit}
                  onCyclePriority={cyclePriority}
                  onCycleCategory={cycleCategory}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center muted py-12">{emptyText}</div>
          )}

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="muted">เหลืออีก {remaining} งาน</span>
            <button
              onClick={clearDone}
              disabled={!doneCount}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                doneCount ? 'text-rose-500 hover:bg-rose-50' : 'muted opacity-50 cursor-not-allowed'
              }`}
            >
              ล้างที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
            </button>
          </div>

          <p className="text-center text-xs muted mt-8">
            ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายหมวดหมู่หรือความสำคัญเพื่อเปลี่ยน
          </p>
        </div>
      </div>
    </main>
  )
}
