import { useMemo, useState } from 'react'
import Notice from '../../components/Notice.jsx'

const typeLabel = { group: 'กลุ่ม', room: 'ห้องหลายคน', user: 'แชตส่วนตัว' }
const defaultJson = JSON.stringify([
  { type: 'text', text: 'ทดสอบจาก LINE Manager' },
], null, 2)

export default function RoomsTab({ api, bot, chats, reload }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState({})
  const [mode, setMode] = useState('text')
  const [message, setMessage] = useState('ทดสอบจาก LINE Manager')
  const [json, setJson] = useState(defaultJson)
  const [silent, setSilent] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return chats.filter((chat) => {
      const matchesSearch = !needle ||
        `${chat.name} ${chat.sourceId} ${chat.type}`.toLowerCase().includes(needle)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'registered' && chat.registered) ||
        (filter === 'unregistered' && !chat.registered) ||
        filter === chat.type
      return matchesSearch && matchesFilter
    })
  }, [chats, search, filter])

  const run = async (key, job, success) => {
    setBusy(key)
    setNotice(null)
    try {
      const result = await job()
      setNotice({ type: 'success', text: success(result) })
      await reload()
      return result
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
      return null
    } finally {
      setBusy('')
    }
  }

  const payload = () => {
    if (mode === 'text') return { message, notificationDisabled: silent }
    const messages = JSON.parse(json)
    if (!Array.isArray(messages) && !messages?.type) {
      throw new Error('JSON ต้องเป็น LINE message object หรือ array')
    }
    return { messages, notificationDisabled: silent }
  }

  const sendBulk = async () => {
    let data
    try {
      data = payload()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
      return
    }
    const result = await run(
      'bulk-test',
      () => api.bulkTestChats(bot.service, { chatIds: selected, ...data }),
      (response) => `ส่งสำเร็จ ${response.sent}/${response.attempted} ห้อง`,
    )
    if (result) setSelected([])
  }

  const toggleSelected = (chatId) =>
    setSelected((current) =>
      current.includes(chatId)
        ? current.filter((id) => id !== chatId)
        : [...current, chatId])

  const saveName = (chat) => run(
    `name-${chat.id}`,
    () => api.updateChat(bot.service, chat.id, {
      name: editing[chat.id] ?? chat.name,
    }),
    () => 'บันทึกชื่อห้องแล้ว',
  )

  return (
    <div className="space-y-3">
      <Notice value={notice} onClose={() => setNotice(null)} />

      <section className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ค้นหาชื่อ, Chat ID หรือประเภท"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ['all', 'ทั้งหมด'],
            ['registered', 'Registered'],
            ['unregistered', 'ยังไม่ Register'],
            ['user', 'ส่วนตัว'],
            ['group', 'กลุ่ม'],
            ['room', 'Room'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setFilter(value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === value
                  ? 'bg-[#06C755] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Message composer</h3>
          <span className="text-xs text-gray-400">เลือกแล้ว {selected.length}/20</span>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {['text', 'json'].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                mode === value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {value === 'text' ? 'Text' : 'Flex / JSON'}
            </button>
          ))}
        </div>
        {mode === 'text' ? (
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows="3"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
        ) : (
          <textarea
            value={json}
            onChange={(event) => setJson(event.target.value)}
            rows="8"
            spellCheck="false"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-[#06C755]"
          />
        )}
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={silent}
            onChange={(event) => setSilent(event.target.checked)}
          />
          ส่งแบบไม่แจ้งเตือน
        </label>
        <button
          type="button"
          disabled={!selected.length || selected.length > 20 || Boolean(busy)}
          onClick={sendBulk}
          className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold disabled:opacity-40"
        >
          {busy === 'bulk-test' ? 'กำลังส่ง...' : 'ส่งไปยังห้องที่เลือก'}
        </button>
      </section>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-500">Chats · {visible.length}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!selected.length || Boolean(busy)}
            onClick={() => run(
              'bulk-register',
              () => api.bulkUpdateChats(bot.service, {
                chatIds: selected,
                registered: true,
              }),
              (result) => `Register ${result.updated} ห้องแล้ว`,
            )}
            className="text-xs text-[#05a344] disabled:opacity-40"
          >
            Register ที่เลือก
          </button>
          <button
            type="button"
            disabled={!selected.length || Boolean(busy)}
            onClick={() => run(
              'bulk-unregister',
              () => api.bulkUpdateChats(bot.service, {
                chatIds: selected,
                registered: false,
              }),
              (result) => `Unregister ${result.updated} ห้องแล้ว`,
            )}
            className="text-xs text-amber-600 disabled:opacity-40"
          >
            Unregister ที่เลือก
          </button>
          <button type="button" onClick={reload} className="text-xs text-gray-500">รีเฟรช</button>
        </div>
      </div>

      {!visible.length && (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบห้องตามเงื่อนไข
        </div>
      )}

      {visible.map((chat) => (
        <section key={chat.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <input
              type="checkbox"
              checked={selected.includes(chat.id)}
              onChange={() => toggleSelected(chat.id)}
              className="mt-3"
            />
            {chat.pictureUrl ? (
              <img src={chat.pictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#e8f8ef] text-[#05a344] flex items-center justify-center text-xs font-bold">
                {(chat.type || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                value={editing[chat.id] ?? chat.name}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, [chat.id]: event.target.value }))}
                className="w-full font-semibold border-b border-transparent focus:border-gray-300 outline-none"
                placeholder="ตั้งชื่อห้อง"
              />
              <div className="font-mono text-[11px] text-gray-400 truncate">{chat.sourceId}</div>
              {chat.lineName && chat.lineName !== chat.name && (
                <div className="text-[11px] text-gray-400 truncate">LINE: {chat.lineName}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {typeLabel[chat.type] || chat.type} · {chat.active ? 'online' : 'inactive'}
              </div>
            </div>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run(
                `register-${chat.id}`,
                () => api.updateChat(bot.service, chat.id, {
                  registered: !chat.registered,
                }),
                () => chat.registered ? 'ยกเลิก Register แล้ว' : 'Register ห้องแล้ว',
              )}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                chat.registered
                  ? 'bg-[#e8f8ef] text-[#05a344]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {chat.registered ? 'Registered' : 'Register'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => saveName(chat)}
              className="rounded-lg bg-gray-100 py-2 text-xs font-medium"
            >
              บันทึกชื่อ
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => run(
                `refresh-${chat.id}`,
                () => api.refreshChat(bot.service, chat.id),
                () => 'อัปเดตข้อมูลจาก LINE แล้ว',
              )}
              className="rounded-lg bg-gray-100 py-2 text-xs font-medium"
            >
              Refresh
            </button>
            <button
              type="button"
              disabled={Boolean(busy) || chat.type === 'user'}
              onClick={() => {
                if (!window.confirm(`ให้บอตออกจาก ${chat.name || chat.sourceId} หรือไม่?`)) return
                run(
                  `leave-${chat.id}`,
                  () => api.leaveChat(bot.service, chat.id),
                  () => 'บอตออกจากห้องแล้ว',
                )
              }}
              className="rounded-lg bg-red-50 text-red-600 py-2 text-xs font-medium disabled:opacity-40"
            >
              Leave
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}
