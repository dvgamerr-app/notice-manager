import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { ErrorNotice } from '../components/Notice.jsx'
import Spinner from '../components/Spinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function BotList({ api }) {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.getBots()
      .then(setBots)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [api])

  return (
    <Layout>
      <div className="flex min-h-11 items-center justify-between px-1">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-gray-500">LINE Bots</h1>
        <button
          type="button"
          onClick={() => nav('/bot/new')}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#06C755] text-white shadow-sm active:bg-[#05a344]"
          aria-label="เพิ่ม LINE Bot"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 border-3" />
        </div>
      )}

      {error && <ErrorNotice>{error}</ErrorNotice>}

      {!loading && !error && bots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e8f8ef] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="1.5">
              <path d="M8 10h8M8 14h5M12 2C6.48 2 2 6.48 2 12c0 1.54.35 3 .97 4.29L2 22l5.71-.97C9 21.65 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-700">ยังไม่มี LINE Bot</p>
            <p className="text-sm text-gray-500 mt-1">กดปุ่ม + เพื่อเพิ่ม bot แรก</p>
          </div>
          <button
            onClick={() => nav('/bot/new')}
            className="mt-2 bg-[#06C755] text-white font-semibold px-6 py-3 rounded-full min-h-11 active:bg-[#05a344] transition-colors"
          >
            เพิ่ม LINE Bot
          </button>
        </div>
      )}

      {bots.map(bot => (
        <button
          key={bot.id}
          onClick={() => nav(`/bot/${bot.service}`)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-full bg-[#e8f8ef] flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="1.5">
              <path d="M8 10h8M8 14h5M12 2C6.48 2 2 6.48 2 12c0 1.54.35 3 .97 4.29L2 22l5.71-.97C9 21.65 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{bot.name || bot.service}</div>
            <div className="text-xs text-gray-500 truncate font-mono mt-0.5">{bot.service}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge active={bot.active} />
              <span className="text-xs text-gray-400">{bot.chatCount || 0} chats</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ))}
    </Layout>
  )
}
