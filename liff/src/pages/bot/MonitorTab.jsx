import { useEffect, useState } from 'react'
import Notice from '../../components/Notice.jsx'

const PAGE_SIZE = 25
const formatDate = (value) =>
  value ? new Date(value).toLocaleString('th-TH') : '-'

function RecordDetails({ summary, summaryClassName = '', value, children }) {
  return (
    <details className="rounded-2xl bg-white p-4 shadow-sm">
      <summary className={`list-none cursor-pointer ${summaryClassName}`}>
        {summary}
      </summary>
      <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-[11px]">
        {JSON.stringify(value, null, 2)}
      </pre>
      {children}
    </details>
  )
}

export default function MonitorTab({ api, bot }) {
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

      {!loading && view === 'deliveries' && rows.map((row) => (
        <RecordDetails
          key={row.id}
          value={row.messages}
          summaryClassName="flex items-center gap-3"
          summary={(
            <>
              <span className={`w-2.5 h-2.5 rounded-full ${
                row.status === 'sent' ? 'bg-[#06C755]' :
                row.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{row.status}</div>
                <div className="text-xs text-gray-400 truncate">{row.recipientId}</div>
              </div>
              <time className="text-[11px] text-gray-400">{formatDate(row.createdAt)}</time>
            </>
          )}
        >
          {row.requestId && <p className="mt-2 text-xs">Request ID: {row.requestId}</p>}
          {row.error && <p className="mt-2 text-xs text-red-600">{row.error}</p>}
        </RecordDetails>
      ))}

      {!loading && view === 'events' && rows.map((row) => (
        <RecordDetails
          key={row.id}
          value={row.payload}
          summaryClassName="flex items-center gap-3"
          summary={(
            <>
              <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-1 text-xs">{row.type}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-gray-500">{row.sourceId || '-'}</span>
              {row.redelivery && <span className="text-[10px] text-amber-600">redelivery</span>}
            </>
          )}
        >
          <p className="mt-2 text-[11px] text-gray-400">{formatDate(row.receivedAt)}</p>
        </RecordDetails>
      ))}

      {!loading && view === 'audits' && rows.map((row) => (
        <RecordDetails
          key={row.id}
          value={row.metadata}
          summary={(
            <>
              <div className="font-semibold text-sm">{row.action}</div>
              <div className="text-xs text-gray-500 mt-1">
                {row.actorType} · {row.entityType}
              </div>
              <div className="text-[11px] text-gray-400 mt-2">{formatDate(row.createdAt)}</div>
            </>
          )}
        />
      ))}

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
