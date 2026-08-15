import { useEffect, useMemo, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import Notice, { Toast } from '../../components/Notice.jsx'
import { buildCompactFlexMessage } from '../../flex.js'

const typeLabel = { group: 'กลุ่ม', room: 'ห้องหลายคน', user: 'แชตส่วนตัว' }
const defaultJson = JSON.stringify(buildCompactFlexMessage({
  title: 'แจ้งเตือน',
  body: 'รายละเอียดแจ้งเตือนจาก LINE Manager',
  actionLabel: 'เปิดดู',
  actionUri: '',
}), null, 2)

export default function RoomsTab({ api, bot, chats, reload }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState('json')
  const [message, setMessage] = useState('ทดสอบจาก LINE Manager')
  const [json, setJson] = useState(defaultJson)
  const [silent, setSilent] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  const visible = useMemo(() => {
    return chats.filter((chat) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'registered' && chat.registered) ||
        (filter === 'unregistered' && !chat.registered) ||
        filter === chat.type
      return matchesFilter
    })
  }, [chats, filter])

  useEffect(() => {
    if (notice?.type !== 'success') return undefined
    const timeout = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])

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

  const toggleJoined = async (chat) => {
    const joining = !chat.registered
    const result = await run(
      `${joining ? 'join' : 'leave'}-${chat.id}`,
      () => api.updateChat(bot.service, chat.id, { registered: joining }),
      () => joining ? 'Rejoin ห้องแล้ว' : 'Leave ห้องแล้ว',
    )
    if (result && !joining) {
      setSelected((current) => current.filter((id) => id !== chat.id))
    }
  }

  const refreshAll = async () => {
    setBusy('refresh-all')
    setNotice(null)
    try {
      const results = await Promise.allSettled(
        chats.map((chat) => api.refreshChat(bot.service, chat.id)),
      )
      await reload()
      const failed = results.filter((result) => result.status === 'rejected').length
      if (failed) {
        setNotice({
          type: 'error',
          text: `อัปเดตสำเร็จ ${results.length - failed}/${results.length} แชต · ล้มเหลว ${failed} แชต`,
        })
      } else {
        setNotice({ type: 'success', text: `อัปเดตจาก LINE แล้ว ${results.length} แชต` })
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-3">
      <Toast
        value={notice?.type === 'success' ? notice : null}
        onClose={() => setNotice(null)}
      />
      <Notice
        value={notice?.type === 'error' ? notice : null}
        onClose={() => setNotice(null)}
      />

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Message composer</h3>
          <span className="text-xs text-gray-400">เลือกแล้ว {selected.length}/20</span>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            ['text', 'Text'],
            ['json', 'JSON'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                mode === value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {label}
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
            rows="12"
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

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-500">Chats · {visible.length}</h3>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="กรองห้อง"
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-[#06C755]"
          >
            <option value="all">ทั้งหมด</option>
            <option value="registered">Joined</option>
            <option value="unregistered">Left</option>
            <option value="user">ส่วนตัว</option>
            <option value="group">กลุ่ม</option>
            <option value="room">Room</option>
          </select>
        </div>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={refreshAll}
          className="text-xs text-gray-500 disabled:opacity-40"
        >
          {busy === 'refresh-all' ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
        </button>
      </div>

      {!visible.length && (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบห้องตามเงื่อนไข
        </div>
      )}

      {visible.map((chat) => (
        <section
          key={chat.id}
          className={`flex items-center gap-2 rounded-2xl border bg-white p-4 shadow-sm transition ${
            selected.includes(chat.id) ? 'border-[#06C755] ring-1 ring-[#06C755]' : 'border-transparent'
          }`}
        >
          <button
            type="button"
            aria-pressed={selected.includes(chat.id)}
            onClick={() => toggleSelected(chat.id)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <span className={`mt-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
              selected.includes(chat.id)
                ? 'border-[#06C755] bg-[#06C755] text-white'
                : 'border-gray-300 bg-white text-transparent'
            }`}>✓</span>
            {chat.pictureUrl ? (
              <img src={chat.pictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#e8f8ef] text-[#05a344] flex items-center justify-center text-xs font-bold">
                {(chat.type || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-gray-900">
                {chat.lineName || chat.name || typeLabel[chat.type] || chat.sourceId}
              </div>
              <div className="font-mono text-[11px] text-gray-400 truncate">{chat.sourceId}</div>
              <div className="text-xs text-gray-500 mt-1">
                {typeLabel[chat.type] || chat.type} · {chat.active ? 'online' : 'inactive'}
              </div>
            </div>
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => toggleJoined(chat)}
            aria-label={chat.registered ? 'Leave chat' : 'Rejoin chat'}
            title={chat.registered ? 'Leave' : 'Rejoin'}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
              chat.registered
                ? 'bg-red-50 text-red-600'
                : 'bg-[#e8f8ef] text-[#05a344]'
            }`}
          >
            {chat.registered ? (
              <LogOut size={19} strokeWidth={2} aria-hidden="true" />
            ) : (
              <LogIn size={19} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </section>
      ))}
    </div>
  )
}
