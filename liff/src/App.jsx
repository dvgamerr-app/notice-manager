import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useLiff } from './useLiff.js'
import { createApi } from './api.js'
import BotList from './pages/BotList.jsx'
import BotDetail from './pages/BotDetail.jsx'
import BotCreate from './pages/BotCreate.jsx'
import Close from './pages/Close.jsx'
import Spinner from './components/Spinner.jsx'

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Spinner className="h-10 w-10 border-3" />
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

function TunnelRequired() {
  const [publicBaseUrl, setPublicBaseUrl] = useState('')

  useEffect(() => {
    fetch('/app/config')
      .then((response) => response.ok ? response.json() : {})
      .then((config) => setPublicBaseUrl(config.publicBaseUrl || ''))
      .catch(() => {})
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-amber-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 9v4m0 4h.01" />
            <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-800">กรุณาเปิดผ่าน HTTPS Tunnel</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          LINE LIFF ไม่สามารถ login โดยใช้ <code className="rounded bg-gray-100 px-1.5 py-0.5">http://localhost:3000</code> เป็น callback ได้
          กรุณาเปิดแอปผ่าน HTTPS tunnel ที่ตั้งเป็น LIFF Endpoint URL
        </p>
        {publicBaseUrl ? (
          <a
            href={publicBaseUrl}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#06C755] px-4 font-semibold text-white active:bg-[#05b54d]"
          >
            เปิดผ่าน Tunnel
          </a>
        ) : (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            ยังไม่ได้ตั้งค่า PUBLIC_BASE_URL สำหรับ tunnel
          </p>
        )}
        <p className="mt-4 text-xs text-gray-400">หน้านี้แสดงเฉพาะเมื่อเปิดผ่าน localhost</p>
      </section>
    </main>
  )
}

export default function App() {
  const { profile, token, error, ready, requiresTunnel, logout } = useLiff()
  const api = useMemo(() => createApi(token), [token])

  if (requiresTunnel) return <TunnelRequired />
  if (!ready) return <Loading />
  if (error) return <LiffError message={error} />

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<BotList api={api} profile={profile} logout={logout} />}
        />
        <Route path="/bot/new" element={<BotCreate api={api} />} />
        <Route path="/bot/:name" element={<BotDetail api={api} />} />
        <Route path="/close" element={<Close />} />
      </Routes>
    </HashRouter>
  )
}
