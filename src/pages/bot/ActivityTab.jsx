import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BottomSheet from '../../components/BottomSheet.jsx'
import Notice from '../../components/Notice.jsx'

const PAGE_SIZE = 30
const POLL_MS = 15_000
const DEFAULT_RANGE = '7d'

const KINDS = {
  inbound: { label: 'ข้อความเข้า', color: '#2f6fde', soft: '#e8effc', path: 'M17 7 7 17M7 9v8h8' },
  outbound: { label: 'ข้อความออก', color: '#06a64a', soft: '#e6f6ed', path: 'M7 17 17 7M9 7h8v8' },
  forward: { label: 'ส่งต่อ', color: '#8a55d6', soft: '#f1eafb', path: 'M15 5l5 5-5 5M20 10H9a5 5 0 0 0-5 5v4' },
  system: {
    label: 'ระบบ',
    color: '#5f6b66',
    soft: '#eceeed',
    path: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3',
  },
}
const KIND_KEYS = Object.keys(KINDS)

const RANGES = [['1h', '1 ชม.'], ['24h', '24 ชม.'], ['7d', '7 วัน'], ['30d', '30 วัน']]
const EVENT_TYPES = ['message', 'follow', 'unfollow', 'join', 'leave', 'postback']
const CHAT_TYPE = { user: 'ผู้ใช้', group: 'กลุ่ม', room: 'ห้อง' }
const STATUS_PILL = {
  fail: ['bg-red-50 text-red-600', 'ล้มเหลว'],
  warn: ['bg-amber-50 text-amber-700', 'ต้องดู'],
  pending: ['bg-gray-100 text-gray-500', 'รอ'],
}

const time = (value) =>
  new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
const dateTime = (value) => (value ? new Date(value).toLocaleString('th-TH') : '-')
const dayKey = (value) => new Date(value).toDateString()
const dayLabel = (value) => {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86_400_000)
  if (dayKey(date) === today.toDateString()) return 'วันนี้'
  if (dayKey(date) === yesterday.toDateString()) return 'เมื่อวาน'
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
}

const readFilters = (params) => ({
  cat: KIND_KEYS.includes(params.get('log')) ? params.get('log') : 'all',
  problem: params.get('problem') === '1',
  chat: params.get('chat') || '',
  since: RANGES.some(([value]) => value === params.get('since')) ? params.get('since') : DEFAULT_RANGE,
  etype: params.get('etype') || '',
  source: params.get('source') || '',
  target: params.get('target') || '',
  q: params.get('q') || '',
})

const writeFilters = (filters) => {
  const next = { tab: 'activity' }
  if (filters.cat !== 'all') next.log = filters.cat
  if (filters.problem) next.problem = '1'
  if (filters.chat) next.chat = filters.chat
  if (filters.since !== DEFAULT_RANGE) next.since = filters.since
  if (filters.etype) next.etype = filters.etype
  if (filters.source) next.source = filters.source
  if (filters.target) next.target = filters.target
  if (filters.q) next.q = filters.q
  return next
}

const toQuery = (filters, extra = {}) => ({
  ...(filters.cat !== 'all' ? { kinds: filters.cat } : { hideOkForwards: 1 }),
  problem: filters.problem ? 1 : '',
  chat: filters.chat,
  since: filters.since !== DEFAULT_RANGE ? filters.since : '',
  eventType: filters.etype,
  source: filters.source,
  target: filters.target,
  q: filters.q,
  ...extra,
})

function KindIcon({ kind, bad = false, size = 30 }) {
  const meta = KINDS[kind]
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-[10px]"
      style={{ width: size, height: size, background: meta.soft, color: meta.color }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={meta.path} />
      </svg>
      {bad && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </span>
  )
}

const useChatLookup = (chats) => useMemo(() => {
  const lookup = new Map()
  for (const chat of chats || []) {
    lookup.set(chat.id, chat)
    lookup.set(chat.sourceId, chat)
  }
  return (...ids) => ids.map((id) => lookup.get(id)).find(Boolean) || null
}, [chats])

const chatLabel = (chat) => chat?.lineName || chat?.name || chat?.sourceId || 'ไม่ทราบแชต'

function Row({ item, chatOf, grouped, onOpen }) {
  const chat = chatOf(item.chatId, item.chatSourceId)
  const pill = STATUS_PILL[item.status]
  const forwards = grouped && item.forwards
  const extra = item.kind === 'outbound'
    ? item.sourceLabel
    : item.kind === 'forward' && item.httpStatus ? `HTTP ${item.httpStatus}` : item.kind === 'system' ? item.actor : ''
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-2.5 px-3 py-2.5 text-left active:bg-gray-50"
    >
      <KindIcon kind={item.kind} bad={item.problem} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-gray-900">{item.title}</span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
          {chat && (
            <span className="shrink-0 rounded bg-gray-100 px-1.5 text-[9.5px] font-bold text-gray-500">
              {CHAT_TYPE[chat.type] || chat.type}
            </span>
          )}
          <span className="truncate">{[chat ? chatLabel(chat) : '', extra].filter(Boolean).join(' · ')}</span>
        </span>
        {forwards && (
          <span className={`text-[10.5px] font-semibold ${
            forwards.ok < forwards.total ? 'text-red-600' : 'text-[#8a55d6]'
          }`}>
            ↪ ส่งต่อ {forwards.ok}/{forwards.total}
          </span>
        )}
      </span>
      <span className="grid justify-items-end gap-1">
        <time className="font-mono text-[10.5px] text-gray-400">{time(item.at)}</time>
        {pill && <span className={`rounded-md px-1.5 text-[10px] font-bold ${pill[0]}`}>{pill[1]}</span>}
      </span>
    </button>
  )
}

function Timeline({ items, chatOf, grouped, onOpen }) {
  const groups = []
  for (const item of items) {
    const key = dayKey(item.at)
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({ key, at: item.at, items: [] })
    }
    groups[groups.length - 1].items.push(item)
  }
  return groups.map((group) => {
    const problems = group.items.filter((item) => item.problem).length
    return (
      <section key={group.key}>
        <div className="flex justify-between px-1 pb-1.5 pt-3 text-[11px] font-semibold text-gray-500">
          <span>{dayLabel(group.at)}</span>
          {problems > 0
            ? <span className="text-red-600">{problems} มีปัญหา</span>
            : <span>{group.items.length} รายการ</span>}
        </div>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {group.items.map((item) => (
            <Row key={`${item.kind}:${item.id}`} item={item} chatOf={chatOf} grouped={grouped} onOpen={onOpen} />
          ))}
        </div>
      </section>
    )
  })
}

function Chips({ options, value, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([optionValue, label]) => (
        <button
          type="button"
          key={optionValue || 'none'}
          onClick={() => onSelect(optionValue)}
          className={`rounded-[10px] border px-2.5 py-1.5 text-xs ${
            value === optionValue
              ? 'border-[#06C755] bg-[#e8f8ef] font-semibold text-[#05a344]'
              : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function FilterSheet({ open, draft, setDraft, chats, apiKeys, targets, count, onApply, onClose }) {
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }))
  const showFor = (...kinds) => draft.cat === 'all' || kinds.includes(draft.cat)
  const label = (text, children) => (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-gray-500">{text}</p>
      {children}
    </div>
  )
  return (
    <BottomSheet
      open={open}
      title="ตัวกรอง"
      onClose={onClose}
      action={(
        <button
          type="button"
          className="text-sm text-gray-500"
          onClick={() => setDraft((current) => ({
            ...current, chat: '', since: DEFAULT_RANGE, etype: '', source: '', target: '', q: '',
          }))}
        >
          ล้างทั้งหมด
        </button>
      )}
      footer={(
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-xl bg-[#06C755] py-2.5 text-sm font-semibold text-white"
        >
          {count == null ? 'แสดงผล' : `แสดง ${count} รายการ`}
        </button>
      )}
    >
      {label('ช่วงเวลา', <Chips options={RANGES} value={draft.since} onSelect={(value) => set('since')(value || DEFAULT_RANGE)} />)}
      {label('ห้องแชต', (
        <Chips
          options={[['', 'ทุกแชต'], ...chats.map((chat) => [chat.id, `${CHAT_TYPE[chat.type] || chat.type} · ${chatLabel(chat)}`])]}
          value={draft.chat}
          onSelect={set('chat')}
        />
      ))}
      {showFor('inbound', 'forward') && label('ชนิด event', (
        <Chips options={[['', 'ทุกชนิด'], ...EVENT_TYPES.map((type) => [type, type])]} value={draft.etype} onSelect={set('etype')} />
      ))}
      {showFor('outbound') && label('ที่มา (ข้อความออก)', (
        <Chips
          options={[['', 'ทุกที่มา'], ['liff', 'ทดสอบจาก LIFF'], ...apiKeys.map((key) => [key.id, `API key · ${key.name}`])]}
          value={draft.source}
          onSelect={set('source')}
        />
      ))}
      {showFor('forward') && label('ปลายทาง (ส่งต่อ)', (
        <Chips options={[['', 'ทุกปลายทาง'], ...targets.map((target) => [target.id, target.name])]} value={draft.target} onSelect={set('target')} />
      ))}
      <div>
        <label htmlFor="activity-q" className="mb-1.5 block text-[11px] font-semibold text-gray-500">ค้นหา</label>
        <input
          id="activity-q"
          value={draft.q}
          onChange={(event) => set('q')(event.target.value)}
          maxLength={100}
          placeholder="Request ID, Event ID หรือข้อความ"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-[#06C755]"
        />
      </div>
    </BottomSheet>
  )
}

const FIELD_LABELS = {
  eventType: 'ชนิด event',
  webhookEventId: 'Event ID',
  sourceId: 'Chat ID',
  processingStatus: 'สถานะ',
  attemptCount: 'จำนวนครั้ง',
  redelivery: 'LINE ส่งซ้ำ',
  processedAt: 'ประมวลผลเมื่อ',
  forwarded: 'ส่งต่อ',
  status: 'สถานะ',
  recipientId: 'Chat ID',
  requestId: 'LINE Request ID',
  sentAt: 'ส่งเมื่อ',
  sourceLabel: 'ที่มา',
  targetName: 'ปลายทาง',
  httpStatus: 'HTTP',
  durationMs: 'ใช้เวลา (ms)',
  lastAttemptAt: 'ลองล่าสุด',
  nextAttemptAt: 'ลองใหม่',
  deliveredAt: 'ส่งสำเร็จเมื่อ',
  action: 'Action',
  actorType: 'ผู้ทำ',
  entityType: 'ประเภท',
  entityId: 'ID',
}
const MONO_FIELDS = new Set(['webhookEventId', 'sourceId', 'recipientId', 'requestId', 'action', 'entityId'])
const TIME_FIELDS = new Set(['processedAt', 'sentAt', 'lastAttemptAt', 'nextAttemptAt', 'deliveredAt'])

const fieldValue = (key, value) => {
  if (TIME_FIELDS.has(key)) return dateTime(value)
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่'
  return String(value)
}

function DetailSheet({ api, bot, summary, chatOf, onClose, onOpenRelated, onFilterChat, onChanged }) {
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const open = Boolean(summary)

  useEffect(() => {
    setDetail(null)
    setNotice(null)
    if (!summary) return
    let cancelled = false
    api.getActivityItem(bot.service, summary.kind, summary.id)
      .then((value) => { if (!cancelled) setDetail(value) })
      .catch((error) => { if (!cancelled) setNotice({ type: 'error', text: error.message }) })
    return () => { cancelled = true }
  }, [api, bot.service, summary?.kind, summary?.id])

  const chat = detail ? chatOf(detail.chatId, detail.fields?.sourceId) : null
  const fields = detail
    ? Object.entries(detail.fields).filter(([, value]) => value !== null && value !== undefined && value !== '')
    : []
  const copyId = detail?.fields.webhookEventId || detail?.fields.requestId || detail?.id

  const retry = async () => {
    setBusy(true)
    try {
      await api.retryForwardDelivery(bot.service, detail.targetId, detail.id)
      onChanged('เข้าคิวส่งใหม่แล้ว')
      onClose()
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyId)
      setNotice({ type: 'success', text: 'คัดลอกแล้ว' })
    } catch {
      setNotice({ type: 'error', text: copyId })
    }
  }

  const buttonClass = 'flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-900 disabled:opacity-50'
  return (
    <BottomSheet
      open={open}
      title="รายละเอียด"
      onClose={onClose}
      footer={detail && (
        <>
          {detail.retryable && (
            <button type="button" disabled={busy} onClick={retry} className="flex-1 rounded-xl bg-[#06C755] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              ส่งใหม่
            </button>
          )}
          {chat && <button type="button" className={buttonClass} onClick={() => onFilterChat(chat.id)}>ดูเฉพาะแชตนี้</button>}
          <button type="button" className={buttonClass} onClick={copy}>คัดลอก ID</button>
        </>
      )}
    >
      <Notice value={notice} onClose={() => setNotice(null)} />
      {!detail && !notice && <p className="py-8 text-center text-sm text-gray-500">กำลังโหลด...</p>}
      {detail && (
        <>
          <div className="flex items-center gap-2.5">
            <KindIcon kind={detail.kind} size={38} bad={Boolean(detail.error)} />
            <div className="min-w-0">
              <b className="block truncate text-sm">{summary.title}</b>
              <small className="text-xs text-gray-500">{KINDS[detail.kind].label} · {dateTime(detail.at)}</small>
            </div>
          </div>
          {detail.error && (
            <p className="break-words rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{detail.error}</p>
          )}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
            {chat && (
              <>
                <dt className="text-gray-500">แชต</dt>
                <dd>{CHAT_TYPE[chat.type] || chat.type} · {chatLabel(chat)}</dd>
              </>
            )}
            {fields.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-gray-500">{FIELD_LABELS[key] || key}</dt>
                <dd className={`break-all ${MONO_FIELDS.has(key) ? 'font-mono text-[11px]' : ''}`}>
                  {fieldValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
          {detail.related.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-gray-500">เหตุการณ์ที่เกี่ยวข้อง</p>
              <div className="ml-1.5 border-l-2 border-gray-200 pl-3">
                {detail.related.map((item) => (
                  <button
                    type="button"
                    key={`${item.kind}:${item.id}`}
                    onClick={() => onOpenRelated(item)}
                    className={`relative flex w-full items-center gap-2 py-1.5 text-left text-xs ${item.current ? 'font-bold' : ''}`}
                  >
                    <span className={`absolute -left-[18px] h-2.5 w-2.5 rounded-full border-2 bg-white ${
                      item.problem ? 'border-red-500' : 'border-[#06a64a]'
                    }`} />
                    {item.kind === 'inbound' ? `ข้อความเข้า · ${item.label}` : `→ ${item.label}`}
                    {item.kind === 'forward' && (
                      <span className="text-gray-500">
                        {item.status === 'ok' ? `HTTP ${item.httpStatus ?? ''}` : item.status === 'fail' ? 'dead' : 'รอ'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {detail.raw && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-gray-500">ข้อมูลดิบ (JSON)</summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-50 p-2.5 text-[10.5px] text-gray-600">
                {JSON.stringify(detail.raw, null, 2)}
              </pre>
            </details>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default function ActivityTab({ api, bot, chats }) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const chatOf = useChatLookup(chats)
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notice, setNotice] = useState(null)
  const [fresh, setFresh] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const [draftCount, setDraftCount] = useState(null)
  const [selected, setSelected] = useState(null)
  const [apiKeys, setApiKeys] = useState([])
  const [targets, setTargets] = useState([])
  const latest = useRef({ items: [], filters })
  latest.current = { items, filters }

  const update = useCallback((next, { push = false } = {}) => {
    setParams(writeFilters(next), { replace: !push })
  }, [setParams])

  const fetchFirst = useCallback(async ({ silent = false } = {}) => {
    const current = latest.current.filters
    if (!silent) setLoading(true)
    try {
      const [feed, counts] = await Promise.all([
        api.getActivity(bot.service, toQuery(current, { limit: PAGE_SIZE })),
        api.getActivitySummary(bot.service, toQuery(current, { kinds: '', hideOkForwards: '' })),
      ])
      setSummary(counts)
      if (silent) {
        const known = new Set(latest.current.items.map((item) => `${item.kind}:${item.id}`))
        setFresh(feed.items.filter((item) => !known.has(`${item.kind}:${item.id}`)))
      } else {
        setItems(feed.items)
        setCursor(feed.nextCursor)
        setFresh([])
      }
    } catch (error) {
      if (!silent) setNotice({ type: 'error', text: error.message })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [api, bot.service])

  useEffect(() => {
    setNotice(null)
    fetchFirst()
  }, [fetchFirst, params])

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchFirst({ silent: true })
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [fetchFirst])

  useEffect(() => {
    api.getApiKeys(bot.service).then(setApiKeys).catch(() => {})
    api.getForwards(bot.service).then(setTargets).catch(() => {})
  }, [api, bot.service])

  // Live count of the draft filters shown on the sheet's apply button.
  useEffect(() => {
    if (!filterOpen) return undefined
    let cancelled = false
    setDraftCount(null)
    const timer = setTimeout(() => {
      api.getActivitySummary(bot.service, toQuery(draft, { kinds: '', hideOkForwards: '' }))
        .then((value) => {
          if (cancelled) return
          const bucket = draft.problem ? value.problems : value.counts
          const kindsShown = draft.cat === 'all' ? KIND_KEYS : [draft.cat]
          const total = kindsShown.reduce((sum, kind) => sum + bucket[kind], 0)
          setDraftCount(total - (draft.cat === 'all' && !draft.problem ? value.okForwards : 0))
        })
        .catch(() => {})
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [filterOpen, draft, api, bot.service])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const feed = await api.getActivity(
        bot.service,
        toQuery(filters, { limit: PAGE_SIZE, before: cursor }),
      )
      setItems((current) => [...current, ...feed.items])
      setCursor(feed.nextCursor)
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setLoadingMore(false)
    }
  }

  const showFresh = () => {
    setItems((current) => [...fresh, ...current])
    setFresh([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const bucket = summary ? (filters.problem ? summary.problems : summary.counts) : null
  const allCount = bucket
    ? KIND_KEYS.reduce((sum, kind) => sum + bucket[kind], 0) - (filters.problem ? 0 : summary.okForwards)
    : null
  const problemCount = summary
    ? (filters.cat === 'all' ? KIND_KEYS : [filters.cat]).reduce((sum, kind) => sum + summary.problems[kind], 0)
    : 0

  const activeChips = [
    filters.since !== DEFAULT_RANGE && ['since', RANGES.find(([value]) => value === filters.since)[1]],
    filters.chat && ['chat', chatLabel(chatOf(filters.chat))],
    filters.etype && ['etype', `event: ${filters.etype}`],
    filters.source && ['source', filters.source === 'liff' ? 'ทดสอบจาก LIFF' : `API key · ${apiKeys.find((key) => key.id === filters.source)?.name || filters.source}`],
    filters.target && ['target', `→ ${targets.find((target) => target.id === filters.target)?.name || filters.target}`],
    filters.q && ['q', `“${filters.q}”`],
  ].filter(Boolean)

  const openRelated = (item) => setSelected({ kind: item.kind, id: item.id, title: item.label })

  const catButton = (key, label, count, color) => (
    <button
      type="button"
      key={key}
      role="tab"
      aria-selected={filters.cat === key}
      onClick={() => update({ ...filters, cat: key })}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        filters.cat === key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-500'
      }`}
    >
      {color && <i className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {label}
      {count != null && <span className="font-mono text-[10.5px] font-medium opacity-60">{count}</span>}
    </button>
  )

  return (
    <div className="space-y-2">
      <Notice value={notice} onClose={() => setNotice(null)} />
      <div className="sticky top-[56px] z-[8] -mx-4 space-y-2 bg-[#f0f0f0]/95 px-4 pb-2 pt-1 backdrop-blur">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="หมวด log">
          {catButton('all', 'ทั้งหมด', allCount, null)}
          {KIND_KEYS.map((kind) => catButton(kind, KINDS[kind].label, bucket?.[kind] ?? null, KINDS[kind].color))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={filters.problem}
            onClick={() => update({ ...filters, problem: !filters.problem })}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${
              filters.problem ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            มีปัญหา <span className="font-mono text-[11px]">{problemCount}</span>
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => { setDraft(filters); setFilterOpen(true) }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
          >
            ตัวกรอง
            {activeChips.length > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#06C755] px-1 text-[10px] text-white">
                {activeChips.length}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="รีเฟรช"
            disabled={loading}
            onClick={() => fetchFirst()}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            ↻
          </button>
        </div>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => update({ ...filters, [key]: key === 'since' ? DEFAULT_RANGE : '' })}
                className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ef] py-0.5 pl-2.5 pr-1.5 text-[11px] font-semibold text-[#05a344]"
              >
                {label}<span aria-label="ลบ" className="text-sm leading-none opacity-70">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {fresh.length > 0 && (
        <button
          type="button"
          onClick={showFresh}
          className="mx-auto block rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg"
        >
          ↑ มีรายการใหม่ {fresh.length} รายการ
        </button>
      )}

      {loading && <div className="py-12 text-center text-sm text-gray-500">กำลังโหลด...</div>}
      {!loading && !items.length && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
          {filters.problem ? 'ไม่มีรายการที่มีปัญหาในช่วงนี้' : 'ไม่มีรายการตามตัวกรองนี้'}
          {(activeChips.length > 0 || filters.problem) && (
            <button
              type="button"
              onClick={() => update({ ...readFilters(new URLSearchParams()), cat: filters.cat })}
              className="mt-2 block w-full font-semibold text-[#05a344]"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      )}
      {!loading && items.length > 0 && (
        <Timeline items={items} chatOf={chatOf} grouped={filters.cat === 'all'} onOpen={setSelected} />
      )}
      {!loading && cursor && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={loadMore}
          className="w-full rounded-xl bg-white py-2.5 text-xs font-semibold text-gray-500 shadow-sm disabled:opacity-50"
        >
          {loadingMore ? 'กำลังโหลด...' : 'โหลดรายการเก่ากว่า'}
        </button>
      )}

      <FilterSheet
        open={filterOpen}
        draft={draft}
        setDraft={setDraft}
        chats={chats}
        apiKeys={apiKeys}
        targets={targets}
        count={draftCount}
        onClose={() => setFilterOpen(false)}
        onApply={() => { update(draft); setFilterOpen(false) }}
      />
      <DetailSheet
        api={api}
        bot={bot}
        summary={selected}
        chatOf={chatOf}
        onClose={() => setSelected(null)}
        onOpenRelated={openRelated}
        onFilterChat={(chatId) => { setSelected(null); update({ ...filters, chat: chatId }) }}
        onChanged={(text) => { setNotice({ type: 'success', text }); fetchFirst() }}
      />
    </div>
  )
}
