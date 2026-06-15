import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

export default function BotCreate({ api }) {
  const nav = useNavigate()
  const [form, setForm] = useState({ service: '', name: '', access_token: '', secret: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.service || !form.access_token || !form.secret) return
    setLoading(true)
    setError(null)
    try {
      await api.createBot(form)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <Layout title="เพิ่ม LINE Bot" back>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm flex gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <Field label="Service ID *" hint="ตัวพิมพ์เล็ก ไม่มีช่องว่าง เช่น my-bot">
            <input
              value={form.service} onChange={set('service')}
              required placeholder="my-bot"
              pattern="[a-z0-9\-_]+" title="ตัวพิมพ์เล็ก ตัวเลข - _ เท่านั้น"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
            />
          </Field>

          <Field label="ชื่อแสดง" hint="ชื่อสำหรับแสดงในระบบ">
            <input
              value={form.name} onChange={set('name')}
              placeholder="My LINE Bot"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
            />
          </Field>

          <Field label="Channel Access Token *">
            <div className="relative">
              <input
                value={form.access_token} onChange={set('access_token')}
                required type={showToken ? 'text' : 'password'}
                placeholder="จาก LINE Developer Console"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              />
              <button type="button" onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                {showToken
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </Field>

          <Field label="Channel Secret *">
            <div className="relative">
              <input
                value={form.secret} onChange={set('secret')}
                required type={showSecret ? 'text' : 'password'}
                placeholder="จาก LINE Developer Console"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              />
              <button type="button" onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                {showSecret
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </Field>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-[#06C755] text-white font-semibold py-4 rounded-2xl min-h-14 active:bg-[#05a344] disabled:opacity-60 transition-colors text-base"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังสร้าง...</span>
            : 'สร้าง LINE Bot'
          }
        </button>
      </form>
    </Layout>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
