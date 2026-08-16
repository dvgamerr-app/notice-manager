import { useEffect, useMemo, useState } from 'react'
import Notice from '../../components/Notice.jsx'

const PAGE_SIZE = 25
const formatDate = (value) =>
  value ? new Date(value).toLocaleString('th-TH') : '-'

function MonitorRecord({ summary, value, children = null }) {
  return (
    <details className="px-1 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-3">
        {summary}
      </summary>
      <pre className="mt-3 overflow-auto whitespace-pre-wrap border-l-2 border-gray-200 pl-3 text-[11px] text-gray-600">
        {JSON.stringify(value, null, 2)}
      </pre>
      {children}
    </details>
  )
}

export default function MonitorTab({ api, bot, chats }) {
  const [view, setView] = useState('deliveries')
  const [records, setRecords] = useState({
    deliveries: [],
    events: [],
    audits: [],
  })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [notice, setNotice] = useState(null)
  const chatLookup = useMemo(() => {
    const lookup = new Map()
    for (const chat of chats || []) {
      lookup.set(chat.id, chat)
      lookup.set(chat.sourceId, chat)
    }
    return lookup
  }, [chats])

  const chatDisplayName = (...identifiers) => {
    const chat = identifiers.map((id) => chatLookup.get(id)).find(Boolean)
    return chat?.lineName || chat?.name || identifiers.find(Boolean) || 'ไม่ทราบแชต'
  }

  const fetchPage = async ({ append = false } = {}) => {
    const current = records[view]
    const query = {
      limit: PAGE_SIZE,
      offset: append ? current.length : 0,
      ...(view === 'deliveries' && filter !== 'all' ? { status: filter } : {}),
      ...(view === 'events' && filter !== 'all' ? { type: filter } : {}),
    }
    if (append) setLoadingMore(true)
    else setLoading(true)
    setNotice(null)
    try {
      const rows = view === 'deliveries'
        ? await api.getDeliveries(bot.service, query)
        : view === 'events'
          ? await api.getWebhookEvents(bot.service, query)
          : await api.getAuditLogs(bot.service, query)
      setRecords((value) => ({
        ...value,
        [view]: append ? [...value[view], ...rows] : rows,
      }))
      setHasMore(rows.length === PAGE_SIZE)
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPage()
  }, [bot.service, view, filter])

  const rows = records[view]

  return (
    <div className="space-y-3">
      <Notice value={notice} onClose={() => setNotice(null)} />
      <div className="flex rounded-xl bg-gray-200 p-1">
        {[
          ['deliveries', 'Deliveries'],
          ['events', 'Webhooks'],
          ['audits', 'Audit'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => {
              setView(value)
              setFilter('all')
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              view === value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view !== 'audits' && (
        <div className="flex gap-2 overflow-x-auto">
          {(view === 'deliveries'
            ? ['all', 'sent', 'failed', 'pending']
            : ['all', 'message', 'follow', 'join', 'leave', 'unfollow']
          ).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                filter === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between px-1">
        <span className="text-xs text-gray-500">{rows.length} records</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => fetchPage()}
          className="text-xs text-[#05a344] disabled:opacity-40"
        >
          รีเฟรช
        </button>
      </div>

      {loading && <div className="text-center py-12 text-sm text-gray-500">กำลังโหลด...</div>}
      {!loading && !rows.length && (
        <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500">
          ยังไม่มีข้อมูล
        </div>
      )}

      {!loading && view === 'deliveries' && rows.length > 0 && (
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {rows.map((row) => (
            <MonitorRecord
              key={row.id}
              value={row.messages}
              summary={(
                <>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    row.status === 'sent' ? 'bg-[#06C755]' :
                    row.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">
                      {chatDisplayName(row.chatId, row.recipientId)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500">{row.status}</div>
                  </div>
                  <time className="shrink-0 text-right text-[11px] text-gray-400">
                    {formatDate(row.createdAt)}
                  </time>
                </>
              )}
            >
              <p className="mt-2 border-l-2 border-gray-200 pl-3 font-mono text-[10px] text-gray-400">
                Chat ID: {row.recipientId}
              </p>
              {row.requestId && (
                <p className="mt-1 border-l-2 border-gray-200 pl-3 text-xs text-gray-500">
                  Request ID: {row.requestId}
                </p>
              )}
              {row.error && (
                <p className="mt-1 border-l-2 border-red-200 pl-3 text-xs text-red-600">
                  {row.error}
                </p>
              )}
            </MonitorRecord>
          ))}
        </div>
      )}

      {!loading && view === 'events' && rows.length > 0 && (
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {rows.map((row) => (
            <MonitorRecord
              key={row.id}
              value={row.payload}
              summary={(
                <>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
                    {row.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">
                      {chatDisplayName(row.sourceId)}
                    </div>
                    <div className={`mt-0.5 truncate text-xs ${
                      row.processingStatus === 'failed' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {row.processingStatus}
                      {row.attemptCount > 1 ? ` · ${row.attemptCount} attempts` : ''}
                      {row.redelivery ? ' · redelivery' : ''}
                    </div>
                  </div>
                  <time className="shrink-0 text-right text-[11px] text-gray-400">
                    {formatDate(row.receivedAt)}
                  </time>
                </>
              )}
            >
              <p className="mt-2 border-l-2 border-gray-200 pl-3 font-mono text-[10px] text-gray-400">
                Chat ID: {row.sourceId || '-'}
              </p>
              {row.processingError && (
                <p className="mt-1 border-l-2 border-red-200 pl-3 text-xs text-red-600">
                  {row.processingError}
                </p>
              )}
            </MonitorRecord>
          ))}
        </div>
      )}

      {!loading && view === 'audits' && rows.length > 0 && (
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {rows.map((row) => (
            <MonitorRecord
              key={row.id}
              value={row.metadata}
              summary={(
                <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-800">{row.action}</div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {row.actorType} · {row.entityType}
                    {row.entityType === 'chat' ? ` · ${chatDisplayName(row.entityId)}` : ''}
                  </div>
                </div>
                <time className="shrink-0 text-right text-[11px] text-gray-400">
                  {formatDate(row.createdAt)}
                </time>
                </>
              )}
            />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => fetchPage({ append: true })}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-gray-600 shadow-sm disabled:opacity-50"
        >
          {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
        </button>
      )}
    </div>
  )
}
