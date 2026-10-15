import { useEffect, useMemo, useRef, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import FlexMessagePreview from '../../components/FlexMessagePreview.jsx'
import Notice, { Toast } from '../../components/Notice.jsx'
import SegmentedControl from '../../components/SegmentedControl.jsx'
import { applyMessageSender, buildCompactFlexMessage } from '../../flex.js'

const typeLabel = { group: 'กลุ่ม', room: 'หลายคน', user: 'ส่วนตัว' }
const testFlexMessage = buildCompactFlexMessage({
  title: 'ข้อความทดสอบ',
  body: 'ทดสอบการส่ง Flex message จาก LINE Manager',
  actionLabel: '',
  actionUri: '',
})

const modeOptions = [
  ['text', 'Text'],
  ['flex', 'Flex'],
]

const chatLabel = (chat) => chat.lineName || chat.name || chat.sourceId

const matchesFilter = (chat, filter) => {
  if (filter === 'all') return true
  if (filter === 'registered') return Boolean(chat.registered)
  if (filter === 'unregistered') return !chat.registered
  return filter === chat.type
}

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

const buildMessages = ({ mode, message }) => {
  if (mode !== 'text') return testFlexMessage
  if (!message.trim()) throw new Error('กรุณากรอกข้อความ')
  return { type: 'text', text: message }
}

const buildPayload = ({ mode, message, avatarId, selectedAvatar, displayName, silent }) => {
  const messages = buildMessages({ mode, message })
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

const refreshNotice = (results) => {
  const failed = results.filter((result) => result.status === 'rejected').length
  if (failed) {
    return {
      type: 'error',
      text: `อัปเดตสำเร็จ ${results.length - failed}/${results.length} แชต · ล้มเหลว ${failed} แชต`,
    }
  }
  return { type: 'success', text: `อัปเดตจาก LINE แล้ว ${results.length} แชต` }
}

// Auto-dismisses success notices after three seconds.
function useAutoDismiss(notice, setNotice) {
  useEffect(() => {
    if (notice?.type !== 'success') return undefined
    const timeout = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])
}

// Hold a chat card for one second to trigger onLongPress; a short press selects it.
function useLongPress(onLongPress) {
  const pressTimer = useRef(null)
  const longPressHandled = useRef(false)

  useEffect(() => () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
  }, [])

  const cancel = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  const start = (chat) => {
    cancel()
    longPressHandled.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressHandled.current = true
      pressTimer.current = null
      onLongPress(chat)
    }, 1000)
  }

  const select = (event, onSelect) => {
    cancel()
    if (longPressHandled.current) {
      event.preventDefault()
      longPressHandled.current = false
      return
    }
    onSelect()
  }

  return { start, cancel, select }
}

function ModeSwitch({ mode, onSelect }) {
  return (
    <SegmentedControl
      options={modeOptions}
      value={mode}
      onSelect={onSelect}
      trackClassName="bg-gray-100"
    />
  )
}

function SenderFields({
  bot, displayName, onDisplayName, avatarId, onAvatarId, avatarOptions, selectedAvatar,
}) {
  return (
    <div className="grid grid-cols-[1fr_116px] gap-2 rounded-xl bg-gray-50 p-3">
      <label className="min-w-0 text-[11px] font-medium text-gray-500">
        Display name
        <input
          value={displayName}
          onChange={(event) => onDisplayName(event.target.value)}
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
            onChange={(event) => onAvatarId(event.target.value)}
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
  )
}

function MessageBody({ bot, mode, message, onMessage, displayName, selectedAvatar }) {
  if (mode === 'text') {
    return (
      <textarea
        value={message}
        onChange={(event) => onMessage(event.target.value)}
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
      />
    )
  }
  return (
    <FlexMessagePreview
      message={testFlexMessage}
      displayName={displayName || bot.name}
      avatarUrl={selectedAvatar?.previewUrl || bot.pictureUrl}
    />
  )
}

function Composer({
  bot, mode, onMode, message, onMessage, displayName, onDisplayName, avatarId, onAvatarId,
  avatarOptions, selectedAvatar, silent, onSilent, selectedCount, busy, onSend,
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Message composer</h3>
        <span className="text-xs text-gray-400">เลือกแล้ว {selectedCount}/20</span>
      </div>
      <ModeSwitch mode={mode} onSelect={onMode} />
      <SenderFields
        bot={bot}
        displayName={displayName}
        onDisplayName={onDisplayName}
        avatarId={avatarId}
        onAvatarId={onAvatarId}
        avatarOptions={avatarOptions}
        selectedAvatar={selectedAvatar}
      />
      <MessageBody
        bot={bot}
        mode={mode}
        message={message}
        onMessage={onMessage}
        displayName={displayName}
        selectedAvatar={selectedAvatar}
      />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={silent}
          onChange={(event) => onSilent(event.target.checked)}
        />
        ส่งแบบไม่แจ้งเตือน
      </label>
      <button
        type="button"
        disabled={!selectedCount || selectedCount > 20 || Boolean(busy)}
        onClick={onSend}
        className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold disabled:opacity-40"
      >
        {busy === 'bulk-test' ? 'กำลังส่ง...' : 'ส่งไปยังห้องที่เลือก'}
      </button>
    </section>
  )
}

function ChatListHeader({ count, filter, onFilter, busy, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-500">Chats · {count}</h3>
        <select
          value={filter}
          onChange={(event) => onFilter(event.target.value)}
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
        onClick={onRefresh}
        className="text-xs text-gray-500 disabled:opacity-40"
      >
        {busy === 'refresh-all' ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
      </button>
    </div>
  )
}

function ChatAvatar({ chat }) {
  if (chat.pictureUrl) {
    return <img src={chat.pictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#e8f8ef] text-[#05a344] flex items-center justify-center text-xs font-bold">
      {(chat.type || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function ChatRow({ chat, isSelected, busy, press, onSelect, onToggleJoined }) {
  return (
    <section
      className={`flex items-center gap-2 rounded-2xl border bg-white p-4 shadow-sm transition ${
        isSelected ? 'border-[#06C755] ring-1 ring-[#06C755]' : 'border-transparent'
      }`}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`เลือก ${chatLabel(chat)}; กดค้างหนึ่งวินาทีเพื่อคัดลอก ID`}
        title="กดเพื่อเลือก · กดค้าง 1 วินาทีเพื่อคัดลอก ID"
        onClick={(event) => press.select(event, () => onSelect(chat.id))}
        onPointerDown={() => press.start(chat)}
        onPointerUp={press.cancel}
        onPointerLeave={press.cancel}
        onPointerCancel={press.cancel}
        onContextMenu={(event) => event.preventDefault()}
        className="flex min-w-0 flex-1 touch-pan-y select-none items-start gap-3 text-left"
      >
        <span className={`mt-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
          isSelected
            ? 'border-[#06C755] bg-[#06C755] text-white'
            : 'border-gray-300 bg-white text-transparent'
        }`}>✓</span>
        <ChatAvatar chat={chat} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {typeLabel[chat.type] || chat.type}
            </span>
            <span className="truncate font-semibold text-gray-900">
              {chatLabel(chat)}
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
        onClick={() => onToggleJoined(chat)}
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
  )
}

export default function RoomsTab({ api, bot, chats, appConfig, reload }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState('flex')
  const [message, setMessage] = useState('ทดสอบจาก LINE Manager')
  const [displayName, setDisplayName] = useState('')
  const [avatarId, setAvatarId] = useState('default')
  const [silent, setSilent] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  const avatarOptions = useMemo(() => [
    {
      id: 'default',
      label: 'ค่าเริ่มต้นของบอต',
      previewUrl: bot.pictureUrl || '',
      iconUrl: null,
    },
    ...(appConfig?.avatars || []),
  ], [appConfig?.avatars, bot.pictureUrl])
  const selectedAvatar = avatarOptions.find((avatar) => avatar.id === avatarId)
    || avatarOptions[0]

  const visible = useMemo(
    () => chats.filter((chat) => matchesFilter(chat, filter)),
    [chats, filter],
  )

  useAutoDismiss(notice, setNotice)

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

  const sendBulk = async () => {
    try {
      const data = buildPayload({ mode, message, avatarId, selectedAvatar, displayName, silent })
      const result = await run(
        'bulk-test',
        () => api.bulkTestChats(bot.service, { chatIds: selected, ...data }),
        (response) => `ส่งสำเร็จ ${response.sent}/${response.attempted} ห้อง`,
      )
      if (result) setSelected([])
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  const toggleSelected = (chatId) =>
    setSelected((current) =>
      current.includes(chatId)
        ? current.filter((id) => id !== chatId)
        : [...current, chatId])

  const copyChatId = async (chat) => {
    try {
      await copyText(chat.sourceId)
      setNotice({ type: 'success', text: `คัดลอก Chat ID แล้ว · ${chat.sourceId}` })
    } catch {
      setNotice({ type: 'error', text: 'คัดลอก Chat ID ไม่สำเร็จ' })
    }
  }

  const press = useLongPress(copyChatId)

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
      setNotice(refreshNotice(results))
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

      <Composer
        bot={bot}
        mode={mode}
        onMode={setMode}
        message={message}
        onMessage={setMessage}
        displayName={displayName}
        onDisplayName={setDisplayName}
        avatarId={avatarId}
        onAvatarId={setAvatarId}
        avatarOptions={avatarOptions}
        selectedAvatar={selectedAvatar}
        silent={silent}
        onSilent={setSilent}
        selectedCount={selected.length}
        busy={busy}
        onSend={sendBulk}
      />

      <ChatListHeader
        count={visible.length}
        filter={filter}
        onFilter={setFilter}
        busy={busy}
        onRefresh={refreshAll}
      />

      {!visible.length && (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบห้องตามเงื่อนไข
        </div>
      )}

      {visible.map((chat) => (
        <ChatRow
          key={chat.id}
          chat={chat}
          isSelected={selected.includes(chat.id)}
          busy={busy}
          press={press}
          onSelect={toggleSelected}
          onToggleJoined={toggleJoined}
        />
      ))}
    </div>
  )
}
