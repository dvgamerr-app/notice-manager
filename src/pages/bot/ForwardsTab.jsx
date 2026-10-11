import { useEffect, useState } from 'react'
import Notice from '../../components/Notice.jsx'

const formatDate = (value) =>
  value ? new Date(value).toLocaleString('th-TH') : '-'

const healthStyle = {
  healthy: ['bg-[#e8f8ef] text-[#05a344]', 'ปกติ'],
  degraded: ['bg-amber-100 text-amber-800', 'มี error ล่าสุด'],
  failing: ['bg-red-100 text-red-700', 'ปลายทางมีปัญหา'],
  disabled: ['bg-gray-100 text-gray-500', 'ปิดอยู่'],
  unknown: ['bg-gray-100 text-gray-500', 'ยังไม่เคยส่ง'],
}

const statusStyle = {
  succeeded: 'text-[#05a344]',
  pending: 'text-amber-700',
  sending: 'text-amber-700',
  dead: 'text-red-600',
}

function Deliveries({ api, bot, target, onChanged }) {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = () =>
    api.getForwardDeliveries(bot.service, target.id, { limit: 20 })
      .then(setRows)
      .catch((error) => setNotice({ type: 'error', text: error.message }))

  useEffect(() => { load() }, [target.id])

  const retry = async (row) => {
    setBusy(true)
    try {
      await api.retryForwardDelivery(bot.service, target.id, row.id)
      await load()
      onChanged()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 border-t border-gray-100 pt-3">
      <Notice value={notice} onClose={() => setNotice(null)} />
      {!rows.length && <p className="text-xs text-gray-400">ยังไม่มีรายการส่งต่อ</p>}
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl bg-gray-50 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${statusStyle[row.status] || ''}`}>
              {row.status}
            </span>
            <span className="text-gray-500">{row.eventType}</span>
            <span className="ml-auto text-gray-400">{formatDate(row.createdAt)}</span>
          </div>
          <p className="text-gray-500">
            ครั้งที่ส่ง {row.attemptCount}
            {row.lastHttpStatus ? ` · HTTP ${row.lastHttpStatus}` : ''}
            {row.durationMs != null ? ` · ${row.durationMs} ms` : ''}
          </p>
          {row.status === 'pending' && row.attemptCount > 0 && (
            <p className="text-gray-500">ลองใหม่: {formatDate(row.nextAttemptAt)}</p>
          )}
          {row.lastError && (
            <p className="break-words text-red-600">{row.lastError}</p>
          )}
          {row.status === 'dead' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => retry(row)}
              className="font-semibold text-gray-900 disabled:opacity-50"
            >
              ส่งใหม่
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ForwardsTab({ api, bot, chats }) {
  const [targets, setTargets] = useState([])
  const [form, setForm] = useState({ name: '', url: '', chatId: '' })
  const [created, setCreated] = useState(null)
  const [open, setOpen] = useState('')
  const [testResult, setTestResult] = useState({})
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  const load = () =>
    api.getForwards(bot.service)
      .then(setTargets)
      .catch((error) => setNotice({ type: 'error', text: error.message }))

  useEffect(() => { load() }, [bot.service])

  const chatName = (id) => {
    const chat = chats.find((item) => item.id === id)
    return chat ? chat.name || chat.lineName || chat.sourceId : id
  }

  const run = async (key, job) => {
    setBusy(key)
    setNotice(null)
    try {
      return await job()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
      return null
    } finally {
      setBusy('')
    }
  }

  const create = async (event) => {
    event.preventDefault()
    const result = await run('create', () => api.createForward(bot.service, {
      name: form.name,
      url: form.url,
      chatId: form.chatId || null,
    }))
    if (!result) return
    setCreated(result)
    setForm({ name: '', url: '', chatId: '' })
    await load()
  }

  const toggle = async (target) => {
    await run(target.id, () =>
      api.updateForward(bot.service, target.id, { enabled: !target.enabled }))
    await load()
  }

  const remove = async (target) => {
    if (!window.confirm(`ลบปลายทาง "${target.name}" และประวัติการส่งต่อทั้งหมดหรือไม่?`)) return
    await run(target.id, () => api.deleteForward(bot.service, target.id))
    await load()
  }

  const test = async (target) => {
    const result = await run(target.id, () => api.testForward(bot.service, target.id))
    if (result) setTestResult((current) => ({ ...current, [target.id]: result }))
  }

  return (
    <div className="space-y-3">
      <Notice value={notice} onClose={() => setNotice(null)} />
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">เพิ่มปลายทาง Forward webhook</h3>
        <form onSubmit={create} className="space-y-2">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            maxLength={100}
            placeholder="ชื่อ เช่น Support system"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
          <input
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            required
            type="url"
            placeholder="https://example.com/webhook"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
          <select
            value={form.chatId}
            onChange={(event) => setForm({ ...form, chatId: event.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option value="">ทุกห้องของบอตนี้</option>
            {chats.map((chat) => (
              <option key={chat.id} value={chat.id}>
                เฉพาะห้อง: {chat.name || chat.lineName || chat.sourceId}
              </option>
            ))}
          </select>
          <button
            disabled={busy === 'create'}
            className="w-full rounded-xl bg-gray-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            เพิ่มปลายทาง
          </button>
        </form>
        <p className="text-xs text-gray-500">
          ส่งต่อทุก event ที่ผ่านการตรวจ signature แล้ว ยกเว้นคำสั่ง /hi และ /id
          ที่ระบบนี้ใช้เอง รองรับเฉพาะ HTTPS สาธารณะ ปลายทางต้องตอบ 2xx ภายในเวลาที่กำหนด
          ไม่เช่นนั้นระบบจะลองส่งใหม่และแสดงสถานะที่นี่
        </p>
      </section>

      {created && (
        <section className="rounded-2xl bg-amber-50 p-4 space-y-3">
          <p className="font-semibold text-amber-900">
            คัดลอก signing secret ตอนนี้ — ระบบจะไม่แสดงอีก
          </p>
          <code className="block break-all text-xs bg-white rounded-xl p-3">{created.secret}</code>
          <p className="text-xs text-amber-900">
            ปลายทางตรวจ header <code>x-line-signature</code> = Base64(HMAC-SHA256(secret, raw body))
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(created.secret)}
            className="text-sm font-semibold text-amber-800"
          >
            คัดลอก secret
          </button>
        </section>
      )}

      <h3 className="text-sm font-semibold text-gray-500 px-1">
        ปลายทาง · {targets.length}
      </h3>
      {targets.map((target) => {
        const [badge, label] = healthStyle[target.health] || healthStyle.unknown
        const result = testResult[target.id]
        return (
          <div key={target.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate">{target.name}</h4>
              <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                {label}
              </span>
            </div>
            <code className="block break-all text-xs text-gray-500">{target.url}</code>
            <p className="text-xs text-gray-500">
              {target.chatId ? `เฉพาะห้อง ${chatName(target.chatId)}` : 'ทุกห้องของบอต'}
              {' · '}รอส่ง {target.counts.pending} · สำเร็จ {target.counts.succeeded}
              {' · '}ล้มเหลว {target.counts.dead}
            </p>
            <p className="text-[11px] text-gray-400">
              สำเร็จล่าสุด: {formatDate(target.lastSuccessAt)}
              {target.lastFailureAt ? ` · ผิดพลาดล่าสุด: ${formatDate(target.lastFailureAt)}` : ''}
            </p>
            {target.lastError && target.health !== 'healthy' && (
              <p className="break-words text-xs text-red-600">
                {target.lastError}
                {target.pausedUntil && new Date(target.pausedUntil) > new Date()
                  ? ` · พักการส่งถึง ${formatDate(target.pausedUntil)}`
                  : ''}
              </p>
            )}
            {result && (
              <p className={`text-xs ${result.ok ? 'text-[#05a344]' : 'text-red-600'}`}>
                ทดสอบ: {result.ok ? `สำเร็จ HTTP ${result.status}` : result.error} ({result.durationMs} ms)
              </p>
            )}
            <div className="flex gap-4 text-xs font-semibold pt-1">
              <button
                type="button"
                disabled={busy === target.id}
                onClick={() => test(target)}
                className="text-gray-900 disabled:opacity-50"
              >
                ทดสอบ
              </button>
              <button
                type="button"
                disabled={busy === target.id}
                onClick={() => toggle(target)}
                className="text-gray-900 disabled:opacity-50"
              >
                {target.enabled ? 'ปิด' : 'เปิด'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(open === target.id ? '' : target.id)}
                className="text-gray-900"
              >
                ประวัติ
              </button>
              <button
                type="button"
                disabled={busy === target.id}
                onClick={() => remove(target)}
                className="ml-auto text-red-600 disabled:opacity-50"
              >
                ลบ
              </button>
            </div>
            {open === target.id && (
              <Deliveries api={api} bot={bot} target={target} onChanged={load} />
            )}
          </div>
        )
      })}
    </div>
  )
}
