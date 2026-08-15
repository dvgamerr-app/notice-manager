import { useEffect, useState } from 'react'
import Notice from '../../components/Notice.jsx'

export default function SettingsTab({ api, bot, reload }) {
  const [name, setName] = useState(bot.name)
  const [active, setActive] = useState(bot.active)
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [quota, setQuota] = useState(null)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setName(bot.name)
    setActive(bot.active)
  }, [bot.name, bot.active])

  const run = async (key, job, message) => {
    setBusy(key)
    setNotice(null)
    try {
      const result = await job()
      setNotice({ type: 'success', text: message(result) })
      await reload()
      return result
    } catch (error) {
      setNotice({ type: 'error', text: error.data?.detail || error.message })
      return null
    } finally {
      setBusy('')
    }
  }

  const save = (event) => {
    event.preventDefault()
    run(
      'save',
      () => api.updateBot(bot.service, { name, active }),
      () => 'บันทึกการตั้งค่าบอตแล้ว',
    )
  }

  const rotate = (event) => {
    event.preventDefault()
    run(
      'rotate',
      () => api.updateBot(bot.service, {
        channelAccessToken: token,
        channelSecret: secret,
      }),
      () => {
        setToken('')
        setSecret('')
        return 'เปลี่ยน credential แล้ว'
      },
    )
  }

  return (
    <div className="space-y-3">
      <Notice value={notice} onClose={() => setNotice(null)} />

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">Webhook</h3>
        <code className="block break-all text-xs bg-gray-50 rounded-xl p-3">
          {bot.expectedWebhookEndpoint}
        </code>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run(
              'sync',
              () => api.syncWebhook(bot.service),
              (result) => `Sync แล้ว: ${result.endpoint}`,
            )}
            className="rounded-xl bg-[#06C755] text-white py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy === 'sync' ? 'กำลัง Sync...' : 'Sync webhook'}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run(
              'test',
              () => api.testWebhook(bot.service),
              (result) => result.ok
                ? 'LINE ทดสอบ webhook สำเร็จ'
                : `ไม่สำเร็จ: ${result.detail || result.reason || 'Unknown'}`,
            )}
            className="rounded-xl border border-[#06C755] text-[#05a344] py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy === 'test' ? 'กำลังทดสอบ...' : 'Test webhook'}
          </button>
        </div>
      </section>

      <form onSubmit={save} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">Bot settings</h3>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">ชื่อแสดง</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          เปิดใช้งานบอต
        </label>
        <button
          disabled={Boolean(busy)}
          className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold disabled:opacity-50"
        >
          บันทึก
        </button>
      </form>

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Message quota</h3>
          <button
            type="button"
            onClick={async () => {
              setBusy('quota')
              try {
                setQuota(await api.getQuota(bot.service))
              } catch (error) {
                setNotice({ type: 'error', text: error.message })
              } finally {
                setBusy('')
              }
            }}
            className="text-xs text-[#05a344]"
          >
            {busy === 'quota' ? 'กำลังโหลด...' : 'โหลด quota'}
          </button>
        </div>
        {quota ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Limit</p>
              <p className="text-lg font-bold">{quota.quota?.value ?? quota.quota?.type}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Used</p>
              <p className="text-lg font-bold">{quota.consumption?.totalUsage ?? '-'}</p>
            </div>
          </div>
        ) : <p className="text-xs text-gray-500">กดโหลดเพื่ออ่าน quota ปัจจุบันจาก LINE</p>}
      </section>

      <form onSubmit={rotate} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold">Rotate credentials</h3>
        <p className="text-xs text-gray-500">
          Token ใหม่ต้องเป็นของ Official Account เดิม ระบบจะตรวจสอบก่อนเปลี่ยน
        </p>
        <input
          required
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="New Channel access token"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
        />
        <input
          required
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="New Channel secret"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#06C755]"
        />
        <button
          disabled={Boolean(busy)}
          className="w-full rounded-xl bg-amber-500 text-white py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy === 'rotate' ? 'กำลังตรวจสอบ...' : 'เปลี่ยน credentials'}
        </button>
      </form>
    </div>
  )
}
