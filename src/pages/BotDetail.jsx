import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Notice from '../components/Notice.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import ApiKeysTab from './bot/ApiKeysTab.jsx'
import MonitorTab from './bot/MonitorTab.jsx'
import RoomsTab from './bot/RoomsTab.jsx'
import SettingsTab from './bot/SettingsTab.jsx'

const tabs = [
  ['rooms', 'Rooms'],
  ['monitor', 'Monitor'],
  ['api', 'API Keys'],
  ['settings', 'Settings'],
]

export default function BotDetail({ api }) {
  const { name } = useParams()
  const location = useLocation()
  const [bot, setBot] = useState(null)
  const [chats, setChats] = useState([])
  const [tab, setTab] = useState('rooms')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(() => location.state?.notice || null)

  const reload = useCallback(async () => {
    const [botData, chatData] = await Promise.all([
      api.getBot(name),
      api.getChats(name),
    ])
    setBot(botData)
    setChats(chatData)
  }, [api, name])

  useEffect(() => {
    reload()
      .catch((error) => setNotice({ type: 'error', text: error.message }))
      .finally(() => setLoading(false))
  }, [reload])

  return (
    <Layout>
      <Notice value={notice} onClose={() => setNotice(null)} />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 border-3" />
        </div>
      )}

      {!loading && bot && (
        <>
          <section className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
            {bot.pictureUrl ? (
              <img src={bot.pictureUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#e8f8ef]" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold truncate">{bot.name}</h2>
                <StatusBadge active={bot.active} />
              </div>
              <p className="text-xs text-gray-500 font-mono truncate">
                {bot.basicId || bot.botUserId}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {chats.filter((chat) => chat.registered).length}/{chats.length} registered chats
              </p>
            </div>
          </section>

          <nav className="sticky top-0 z-[9] -mx-4 px-4 py-2 bg-[#f0f0f0]/95 backdrop-blur">
            <div className="grid grid-cols-4 bg-white rounded-xl shadow-sm p-1">
              {tabs.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-lg py-2.5 text-xs font-semibold ${
                    tab === value
                      ? 'bg-[#06C755] text-white'
                      : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {tab === 'rooms' && (
            <RoomsTab api={api} bot={bot} chats={chats} reload={reload} />
          )}
          {tab === 'monitor' && <MonitorTab api={api} bot={bot} />}
          {tab === 'api' && <ApiKeysTab api={api} bot={bot} />}
          {tab === 'settings' && (
            <SettingsTab api={api} bot={bot} reload={reload} />
          )}
        </>
      )}
    </Layout>
  )
}
