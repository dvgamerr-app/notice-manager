import { HashRouter, Routes, Route } from 'react-router-dom'
import { useLiff } from './useLiff.js'
import { createApi } from './api.js'
import BotList from './pages/BotList.jsx'
import BotDetail from './pages/BotDetail.jsx'
import BotCreate from './pages/BotCreate.jsx'
import Close from './pages/Close.jsx'

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-10 h-10 border-3 border-[#06C755] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">กำลังโหลด...</p>
    </div>
  )
}

function LiffError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <p className="font-semibold text-gray-700">เกิดข้อผิดพลาด</p>
      <p className="text-sm text-red-500">{message}</p>
    </div>
  )
}

export default function App() {
  const { profile, error, ready } = useLiff()

  if (!ready) return <Loading />
  if (error) return <LiffError message={error} />

  const api = createApi(profile?.userId)

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BotList api={api} profile={profile} />} />
        <Route path="/bot/new" element={<BotCreate api={api} />} />
        <Route path="/bot/:name" element={<BotDetail api={api} />} />
        <Route path="/close" element={<Close />} />
      </Routes>
    </HashRouter>
  )
}
