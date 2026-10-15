import { useEffect, useMemo, useState } from 'react'
import Notice from '../../components/Notice.jsx'
import SegmentedControl from '../../components/SegmentedControl.jsx'

const PAGE_SIZE = 25
const formatDate = (value) =>
  value ? new Date(value).toLocaleString('th-TH') : '-'

const viewOptions = [
  ['deliveries', 'Deliveries'],
  ['events', 'Webhooks'],
  ['audits', 'Audit'],
]

const filterOptions = {
  deliveries: ['all', 'sent', 'failed', 'pending'],
  events: ['all', 'message', 'follow', 'join', 'leave', 'unfollow'],
}

const filterParam = { deliveries: 'status', events: 'type' }

const fetchers = {
  deliveries: (api, service, query) => api.getDeliveries(service, query),
  events: (api, service, query) => api.getWebhookEvents(service, query),
  audits: (api, service, query) => api.getAuditLogs(service, query),
}

const deliveryDotClass = (status) => {
  if (status === 'sent') return 'bg-[#06C755]'
  if (status === 'failed') return 'bg-red-500'
  return 'bg-amber-400'
}

const buildQuery = ({ view, filter, offset }) => ({
  limit: PAGE_SIZE,
  offset,
  ...(filterParam[view] && filter !== 'all' ? { [filterParam[view]]: filter } : {}),
})

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

function DeliveryRecord({ row, chatDisplayName }) {
  return (
    <MonitorRecord
      value={row.messages}
      summary={(
        <>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${deliveryDotClass(row.status)}`} />
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
  )
}

function EventRecord({ row, chatDisplayName }) {
  return (
    <MonitorRecord
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
  )
}

function AuditRecord({ row, chatDisplayName }) {
  return (
    <MonitorRecord
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
  )
}

const recordComponents = {
  deliveries: DeliveryRecord,
  events: EventRecord,
  audits: AuditRecord,
}

function RecordList({ view, rows, chatDisplayName }) {
  const Record = recordComponents[view]
  return (
    <div className="divide-y divide-gray-200 border-y border-gray-200">
      {rows.map((row) => (
        <Record key={row.id} row={row} chatDisplayName={chatDisplayName} />
      ))}
    </div>
  )
}

function ViewSwitch({ view, onSelect }) {
  return (
    <SegmentedControl
      options={viewOptions}
      value={view}
      onSelect={onSelect}
      trackClassName="bg-gray-200"
    />
  )
}

function FilterChips({ view, filter, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {filterOptions[view].map((value) => (
        <button
          type="button"
          key={value}
          onClick={() => onSelect(value)}
          className={`rounded-full px-3 py-1.5 text-xs ${
            filter === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function useChatDisplayName(chats) {
  const chatLookup = useMemo(() => {
    const lookup = new Map()
    for (const chat of chats || []) {
      lookup.set(chat.id, chat)
      lookup.set(chat.sourceId, chat)
    }
    return lookup
  }, [chats])

  return (...identifiers) => {
    const chat = identifiers.map((id) => chatLookup.get(id)).find(Boolean)
    return chat?.lineName || chat?.name || identifiers.find(Boolean) || 'ไม่ทราบแชต'
  }
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
  const chatDisplayName = useChatDisplayName(chats)

  const fetchPage = async ({ append = false } = {}) => {
    const query = buildQuery({ view, filter, offset: append ? records[view].length : 0 })
    if (append) setLoadingMore(true)
    else setLoading(true)
    setNotice(null)
    try {
      const rows = await fetchers[view](api, bot.service, query)
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
      <ViewSwitch
        view={view}
        onSelect={(value) => {
          setView(value)
          setFilter('all')
        }}
      />

      {view !== 'audits' && <FilterChips view={view} filter={filter} onSelect={setFilter} />}

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

      {!loading && rows.length > 0 && (
        <RecordList view={view} rows={rows} chatDisplayName={chatDisplayName} />
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
