import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const typeLabel = { group: 'กลุ่ม', room: 'ห้อง', user: 'ผู้ใช้' }
const typeIcon = {
  group: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  room: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
}
const BASE_URL = import.meta.env.VITE_API_URL || ''

export default function BotDetail({ api }) {
  const { name } = useParams()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.getRooms(name)
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [name])

  const copyUrl = (room) => {
    const url = `${BASE_URL}/line/${name}/${room.name || room.room_id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(room.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <Layout title={name} back>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Rooms · {rooms.length}
      </h2>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-[#06C755] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="font-semibold text-gray-700">ยังไม่มีห้อง</p>
          <p className="text-sm text-gray-500">เพิ่ม bot เข้ากลุ่มใน LINE แล้วพิมพ์ <code className="bg-gray-100 px-1 rounded">/join</code></p>
        </div>
      )}

      {rooms.map(room => (
        <div key={room.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-start gap-4 p-4">
            <div className="w-11 h-11 rounded-full bg-[#e8f8ef] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="1.5">
                <path d={typeIcon[room.type] || typeIcon.user} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{room.name || '(ไม่มีชื่อ)'}</div>
              <div className="text-xs text-gray-500 truncate font-mono mt-0.5">{room.room_id}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge active={room.active} />
                <span className="text-xs text-gray-400">{typeLabel[room.type] || room.type}</span>
              </div>
            </div>
          </div>

          {room.name && room.active && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500 mb-2">API Endpoint</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <code className="flex-1 text-xs text-gray-700 truncate font-mono">
                  PUT {BASE_URL}/line/{name}/{room.name}
                </code>
                <button
                  onClick={() => copyUrl(room)}
                  className="shrink-0 p-1.5 rounded-lg active:bg-gray-200 transition-colors"
                  aria-label="คัดลอก URL"
                >
                  {copied === room.id
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Layout>
  )
}
