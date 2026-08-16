import { useEffect, useMemo, useRef, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import FlexMessagePreview from '../../components/FlexMessagePreview.jsx'
import Notice, { Toast } from '../../components/Notice.jsx'
import { applyMessageSender, buildCompactFlexMessage } from '../../flex.js'

const typeLabel = { group: 'กลุ่ม', room: 'หลายคน', user: 'ส่วนตัว' }
const defaultJson = JSON.stringify(buildCompactFlexMessage({
  title: 'แจ้งเตือน',
  body: 'รายละเอียดแจ้งเตือนจาก LINE Manager',
  actionLabel: 'เปิดดู',
  actionUri: '',
}), null, 2)

export default function RoomsTab({ api, bot, chats, appConfig, reload }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState('flex')
  const [message, setMessage] = useState('ทดสอบจาก LINE Manager')
  const [flexJson, setFlexJson] = useState(defaultJson)
  const [displayName, setDisplayName] = useState('')
  const [avatarId, setAvatarId] = useState('default')
  const [silent, setSilent] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)
  const pressTimer = useRef(null)
  const longPressHandled = useRef(false)

  const avatarOptions = useMemo(() => [
    {
      id: 'default',
      label: 'รูปโปรไฟล์บอต',
      previewUrl: bot.pictureUrl || '',
      iconUrl: null,
    },
    ...(appConfig?.avatars || []),
  ], [appConfig?.avatars, bot.pictureUrl])
  const selectedAvatar = avatarOptions.find((avatar) => avatar.id === avatarId)
    || avatarOptions[0]

  const parsedFlex = useMemo(() => {
    try {
      const value = JSON.parse(flexJson)
      const messages = Array.isArray(value) ? value : [value]
      if (!messages.length || messages.some((item) => item?.type !== 'flex')) {
        throw new Error('Flex JSON ต้องเป็น Flex message object หรือ array')
      }
      return { value, error: '' }
    } catch (error) {
      return { value: null, error: error.message }
    }
  }, [flexJson])

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

  useEffect(() => () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
  }, [])

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
    let messages
    if (mode === 'text') {
      if (!message.trim()) throw new Error('กรุณากรอกข้อความ')
      messages = { type: 'text', text: message }
    } else {
      if (parsedFlex.error) throw new Error(parsedFlex.error)
      messages = parsedFlex.value
    }
    if (avatarId !== 'default' && !selectedAvatar?.iconUrl) {
      throw new Error('ตั้งค่า PUBLIC_BASE_URL แบบ HTTPS ก่อนใช้ avatar ตัวอย่างส่งเข้า LINE')
    }
    return {
      messages: applyMessageSender(messages, {
        name: displayName,
        iconUrl: selectedAvatar?.iconUrl || '',
      }),
      notificationDisabled: silent,
    }
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

  const copyChatId = async (chat) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(chat.sourceId)
      } else {
        const input = document.createElement('textarea')
        input.value = chat.sourceId
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
      }
      setNotice({ type: 'success', text: `คัดลอก Chat ID แล้ว · ${chat.sourceId}` })
    } catch {
      setNotice({ type: 'error', text: 'คัดลอก Chat ID ไม่สำเร็จ' })
    }
  }

  const cancelLongPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  const startLongPress = (chat) => {
    cancelLongPress()
    longPressHandled.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressHandled.current = true
      pressTimer.current = null
      copyChatId(chat)
    }, 1000)
  }

  const selectChat = (event, chatId) => {
    cancelLongPress()
    if (longPressHandled.current) {
      event.preventDefault()
      longPressHandled.current = false
      return
    }
    toggleSelected(chatId)
  }

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
            ['flex', 'Flex'],
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

        <div className="grid grid-cols-[1fr_116px] gap-2 rounded-xl bg-gray-50 p-3">
          <label className="min-w-0 text-[11px] font-medium text-gray-500">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={20}
              placeholder={bot.name}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-[#06C755]"
            />
          </label>
          <label className="text-[11px] font-medium text-gray-500">
            Avatar
            <div className="mt-1 flex items-center gap-1.5">
              {selectedAvatar?.previewUrl ? (
                <img
                  src={selectedAvatar.previewUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#06C755]" />
              )}
              <select
                value={avatarId}
                onChange={(event) => setAvatarId(event.target.value)}
                aria-label="เลือก avatar ผู้ส่ง"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-1.5 py-2 text-[11px] text-gray-700 outline-none focus:border-[#06C755]"
              >
                {avatarOptions.map((avatar) => (
                  <option key={avatar.id} value={avatar.id}>{avatar.label}</option>
                ))}
              </select>
            </div>
          </label>
        </div>
        {mode === 'text' ? (
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
        ) : (
          <div className="space-y-2">
            <textarea
              value={flexJson}
              onChange={(event) => setFlexJson(event.target.value)}
              rows={9}
              spellCheck={false}
              aria-label="Flex message JSON"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:border-[#06C755]"
            />
            {parsedFlex.error ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                {parsedFlex.error}
              </div>
            ) : (
              <FlexMessagePreview
                message={parsedFlex.value}
                displayName={displayName || bot.name}
                avatarUrl={selectedAvatar?.previewUrl || bot.pictureUrl}
              />
            )}
          </div>
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
            aria-label={`เลือก ${chat.lineName || chat.name || chat.sourceId}; กดค้างหนึ่งวินาทีเพื่อคัดลอก ID`}
            title="กดเพื่อเลือก · กดค้าง 1 วินาทีเพื่อคัดลอก ID"
            onClick={(event) => selectChat(event, chat.id)}
            onPointerDown={() => startLongPress(chat)}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(event) => event.preventDefault()}
            className="flex min-w-0 flex-1 touch-pan-y select-none items-start gap-3 text-left"
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
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                  {typeLabel[chat.type] || chat.type}
                </span>
                <span className="truncate font-semibold text-gray-900">
                  {chat.lineName || chat.name || chat.sourceId}
                </span>
                {!chat.active && (
                  <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-600">
                    inactive
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-gray-400 truncate">{chat.sourceId}</div>
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
