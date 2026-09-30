import { useState, useRef, useEffect } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'

const PRIORITY = {
  low:  { label: 'ต่ำ',  cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  med:  { label: 'กลาง', cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  high: { label: 'สูง',  cls: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-500' },
}
const ORDER = ['low', 'med', 'high']

const TABS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]

const EMPTY_TEXT = {
  all: 'ยังไม่มีงาน เพิ่มงานแรกของคุณได้เลย',
  active: 'ไม่มีงานที่ค้างอยู่ 🎉',
  done: 'ยังไม่มีงานที่เสร็จ',
}

function TodoItem({ todo, onToggle, onDelete, onEdit, onCyclePriority }) {
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

  return (
    <li className={`item card rounded-xl mb-2 px-3 py-3 flex items-center gap-3 ${todo.removing ? 'out' : ''}`}>
      <button
        onClick={() => onToggle(todo.id)}
        aria-label="ทำเครื่องหมายว่าเสร็จ"
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          todo.done
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
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
  const [todos, setTodos] = useState([
    { id: 1, text: 'ตัวอย่าง: ดับเบิลคลิกเพื่อแก้ไขงานนี้', done: false, pri: 'med' },
    { id: 2, text: 'ตัวอย่าง: งานที่เสร็จแล้ว', done: true, pri: 'low' },
  ])
  const [text, setText] = useState('')
  const [pri, setPri] = useState('med')
  const [filter, setFilter] = useState('all')
  const nextId = useRef(3)

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((ts) => [{ id: nextId.current++, text: v, done: false, pri }, ...ts])
    setText('')
  }

  const toggle = (id) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const edit = (id, v) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, text: v } : t)))

  const cyclePriority = (id) =>
    setTodos((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, pri: ORDER[(ORDER.indexOf(t.pri) + 1) % ORDER.length] } : t
      )
    )

  const remove = (id) => {
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, removing: true } : t)))
    setTimeout(() => setTodos((ts) => ts.filter((t) => t.id !== id)), 250)
  }

  const clearDone = () => {
    setTodos((ts) => ts.map((t) => (t.done ? { ...t, removing: true } : t)))
    setTimeout(() => setTodos((ts) => ts.filter((t) => !t.done)), 250)
  }

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.filter((t) => t.done).length
  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  )

  return (
    <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6">รายการงานของฉัน</h1>

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
          {ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setPri(k)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-colors ${
                pri === k
                  ? `${PRIORITY[k].cls} border-transparent font-medium`
                  : 'line muted hover:opacity-80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PRIORITY[k].dot}`} />
              {PRIORITY[k].label}
            </button>
          ))}
        </div>
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
              onToggle={toggle}
              onDelete={remove}
              onEdit={edit}
              onCyclePriority={cyclePriority}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center muted py-12">{EMPTY_TEXT[filter]}</div>
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
        ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญเพื่อเปลี่ยนระดับ
      </p>
    </main>
  )
}
