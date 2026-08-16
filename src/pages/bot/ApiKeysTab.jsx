import { useEffect, useState } from 'react'
import Notice from '../../components/Notice.jsx'

const formatDate = (value) =>
  value ? new Date(value).toLocaleString('th-TH') : 'ยังไม่เคยใช้'

export default function ApiKeysTab({ api, bot }) {
  const [keys, setKeys] = useState([])
  const [name, setName] = useState('')
  const [createdKey, setCreatedKey] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = () =>
    api.getApiKeys(bot.service)
      .then(setKeys)
      .catch((error) => setNotice({ type: 'error', text: error.message }))

  useEffect(() => { load() }, [bot.service])

  const create = async (event) => {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      const result = await api.createApiKey(bot.service, { name })
      setCreatedKey(result.key)
      setName('')
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (key) => {
    if (!window.confirm(`ยกเลิก API key "${key.name}" หรือไม่?`)) return
    setBusy(true)
    try {
      await api.revokeApiKey(bot.service, key.id)
      await load()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const apiOrigin = (import.meta.env.VITE_API_URL || window.location.origin)
    .replace(/\/+$/, '')
  const endpoint = `${apiOrigin}/v1/bots/${bot.service}/chats/{chat-id}/messages`

  return (
    <div className="space-y-3">
      <Notice value={notice} onClose={() => setNotice(null)} />
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">สร้าง External API key</h3>
        <form onSubmit={create} className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={100}
            placeholder="เช่น Production monitoring"
            className="min-w-0 flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-gray-900 text-white px-4 text-sm font-semibold disabled:opacity-50"
          >
            สร้าง
          </button>
        </form>
        <p className="text-xs text-gray-500">
          Key จำกัดสิทธิ์เฉพาะบอตนี้ และใช้ได้กับห้องที่ Joined เท่านั้น
        </p>
      </section>

      {createdKey && (
        <section className="rounded-2xl bg-amber-50 p-4 space-y-3">
          <p className="font-semibold text-amber-900">คัดลอก key ตอนนี้ — ระบบจะไม่แสดงอีก</p>
          <code className="block break-all text-xs bg-white rounded-xl p-3">{createdKey}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(createdKey)}
            className="text-sm font-semibold text-amber-800"
          >
            คัดลอก API key
          </button>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <p className="text-xs font-medium text-gray-500">External endpoint</p>
        <code className="block break-all text-xs bg-gray-50 rounded-xl p-3">
          POST {endpoint}
        </code>
        <pre className="overflow-auto text-[11px] bg-gray-900 text-gray-100 rounded-xl p-3 whitespace-pre-wrap">
{`curl -X POST '${endpoint}' \\
  -H 'X-API-Key: YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"message":"Hello from API"}'`}
        </pre>
      </section>

      <h3 className="text-sm font-semibold text-gray-500 px-1">API Keys · {keys.length}</h3>
      {keys.map((key) => (
        <div key={key.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{key.name}</div>
            <code className="text-xs text-gray-500">{key.prefix}••••••••</code>
            <p className="text-[11px] text-gray-400 mt-2">
              ใช้ล่าสุด: {formatDate(key.lastUsedAt)}
            </p>
          </div>
          <button
            type="button"
            disabled={!key.active || busy}
            onClick={() => revoke(key)}
            className="text-xs text-red-600 disabled:text-gray-300"
          >
            {key.active ? 'Revoke' : 'Revoked'}
          </button>
        </div>
      ))}
    </div>
  )
}
