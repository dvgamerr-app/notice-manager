import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Notice from '../components/Notice.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import BotAvatar from '../components/BotAvatar.jsx'
import ApiKeysTab from './bot/ApiKeysTab.jsx'
import ForwardsTab from './bot/ForwardsTab.jsx'
import ActivityTab from './bot/ActivityTab.jsx'
import RoomsTab from './bot/RoomsTab.jsx'
import SettingsTab from './bot/SettingsTab.jsx'

const tabs = [
  ['rooms', 'Rooms'],
  ['activity', 'Activity'],
  ['forward', 'Forward'],
  ['api', 'API Keys'],
  ['settings', 'Settings'],
]

export default function BotDetail({ api }) {
  const { name } = useParams()
  const location = useLocation()
  const [bot, setBot] = useState(null)
  const [chats, setChats] = useState([])
  const [appConfig, setAppConfig] = useState({ avatars: [] })
  const [params, setParams] = useSearchParams()
  const tab = tabs.some(([value]) => value === params.get('tab')) ? params.get('tab') : 'rooms'
  const setTab = (value) => setParams({ tab: value })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(() => location.state?.notice || null)

  const reload = useCallback(async () => {
    const [botData, chatData, configData] = await Promise.all([
      api.getBot(name),
      api.getChats(name),
      api.getAppConfig(),
    ])
    setBot(botData)
    setChats(chatData)
    setAppConfig(configData)
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
            <BotAvatar
              url={bot.pictureUrl}
              onBroken={() => api.getBot(name, { refresh: true })
                .then((fresh) => setBot((current) => (
                  current ? { ...current, pictureUrl: fresh.pictureUrl } : current
                )))
                .catch(() => {})}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold truncate">{bot.name}</h2>
                <StatusBadge active={bot.active} />
              </div>
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                <span className="truncate font-mono">{bot.basicId || bot.botUserId}</span>
                <span className="shrink-0 text-gray-400">
                  · {chats.filter((chat) => chat.registered).length}/{chats.length} registered chats
                </span>
              </p>
            </div>
          </section>

          <nav className="sticky top-0 z-[9] -mx-4 px-4 py-2 bg-[#f0f0f0]/95 backdrop-blur">
            <div className="grid grid-cols-5 bg-white rounded-xl shadow-sm p-1">
              {tabs.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-lg py-2.5 text-[11px] font-semibold ${
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
            <RoomsTab
              api={api}
              bot={bot}
              chats={chats}
              appConfig={appConfig}
              reload={reload}
            />
          )}
          {tab === 'activity' && <ActivityTab api={api} bot={bot} chats={chats} />}
          {tab === 'forward' && (
            <ForwardsTab
              api={api}
              bot={bot}
              chats={chats}
              onOpenActivity={(target) => setParams({ tab: 'activity', log: 'forward', target })}
            />
          )}
          {tab === 'api' && <ApiKeysTab api={api} bot={bot} />}
          {tab === 'settings' && (
            <SettingsTab api={api} bot={bot} reload={reload} />
          )}
        </>
      )}
    </Layout>
  )
}
