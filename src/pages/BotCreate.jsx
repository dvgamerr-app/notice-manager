import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { ErrorNotice } from '../components/Notice.jsx'
import Spinner from '../components/Spinner.jsx'

export default function BotCreate({ api }) {
  const nav = useNavigate()
  const [form, setForm] = useState({ service: '', name: '', access_token: '', secret: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showToken, setShowToken] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [publicBaseUrl, setPublicBaseUrl] = useState('')

  useEffect(() => {
    api.getAppConfig()
      .then((config) => setPublicBaseUrl(config.publicBaseUrl || ''))
      .catch(() => {})
  }, [api])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const webhookEndpoint = publicBaseUrl && form.service
    ? `${publicBaseUrl}/line/${encodeURIComponent(form.service.trim().toLowerCase())}`
    : ''

  const submit = async (e) => {
    e.preventDefault()
    if (!form.service || !form.access_token || !form.secret) return
    setLoading(true)
    setError(null)
    try {
      const created = await api.createBot(form)
      const webhookMessage = created.webhookActive
        ? `เพิ่มบอตและเปลี่ยน Webhook URL เป็น ${created.webhookEndpoint} แล้ว`
        : `เพิ่มบอตและเปลี่ยน Webhook URL เป็น ${created.webhookEndpoint} แล้ว กรุณาเปิด Use webhook ใน LINE Developers Console`
      nav(`/bot/${created.service}`, {
        replace: true,
        state: { notice: { type: 'success', text: webhookMessage } },
      })
    } catch (err) {
      const diagnostics = [
        err.data?.lineReason && err.data.lineReason !== err.message
          ? `LINE: ${err.data.lineReason}`
          : '',
        err.data?.requestId ? `Request ID: ${err.data.requestId}` : '',
      ].filter(Boolean)
      setError([err.message, ...diagnostics].join('\n'))
      setLoading(false)
    }
  }

  return (
    <Layout>
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNotice>{error}</ErrorNotice>}

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <Field label="Service ID *" hint="ใช้ใน webhook URL เช่น production-alert">
            <input
              value={form.service} onChange={set('service')}
              required placeholder="my-bot"
              pattern="[a-z0-9\-_]+" title="ตัวพิมพ์เล็ก ตัวเลข - _ เท่านั้น"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
            />
          </Field>

          {webhookEndpoint && (
            <div className="rounded-xl bg-[#e8f8ef] p-3">
              <p className="text-xs font-medium text-[#057a36]">Webhook URL ที่ระบบจะตั้งให้</p>
              <code className="mt-1 block break-all text-xs text-gray-700">
                {webhookEndpoint}
              </code>
              <p className="mt-1 text-xs text-gray-500">
                ระบบจะแทนที่ Webhook URL เดิมหลัง LINE ยืนยัน Channel Access Token สำเร็จ
              </p>
            </div>
          )}

          <Field label="ชื่อแสดง" hint="ชื่อสำหรับแสดงในระบบ">
            <input
              value={form.name} onChange={set('name')}
              placeholder="My LINE Bot"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
            />
          </Field>

          <Field
            label="Channel Access Token *"
            hint="คัดลอกจาก Messaging API > Channel access token (ไม่ใช่ LIFF access token)"
          >
            <SecretInput
              value={form.access_token}
              onChange={set('access_token')}
              visible={showToken}
              onToggle={() => setShowToken(v => !v)}
              name="Channel Access Token"
              placeholder="Messaging API channel access token"
            />
          </Field>

          <Field label="Channel Secret *">
            <SecretInput
              value={form.secret}
              onChange={set('secret')}
              visible={showSecret}
              onToggle={() => setShowSecret(v => !v)}
              name="Channel Secret"
              placeholder="Basic settings > Channel secret"
            />
          </Field>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          ระบบจะตรวจ token กับ Get bot info ก่อนบันทึก ส่วน Channel Secret จะใช้ตรวจ
          x-line-signature ทุกครั้งที่ LINE ส่ง webhook เข้ามา
        </div>

        <button
          type="submit" disabled={loading}
          className="flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#06C755] py-4 text-base font-semibold text-white transition-colors active:bg-[#05a344] disabled:opacity-60"
        >
          {loading
            ? <><Spinner className="h-5 w-5 border-2" colorClassName="border-white" /> กำลังเพิ่มบอตและตั้ง Webhook...</>
            : 'เพิ่ม LINE Bot และตั้ง Webhook'
          }
        </button>
      </form>
    </Layout>
  )
}

function SecretInput({ value, onChange, visible, onToggle, name, placeholder }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        required
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400"
        aria-label={`${visible ? 'ซ่อน' : 'แสดง'} ${name}`}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

function Field({ label, hint = '', children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
