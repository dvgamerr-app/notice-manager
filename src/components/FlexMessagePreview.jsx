const sizeMap = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 14,
  lg: 17,
  xl: 20,
  xxl: 24,
  '3xl': 30,
}

const spaceMap = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

const length = (value, fallback = undefined) => {
  if (value == null || value === '') return fallback
  if (typeof value === 'number') return value
  if (value in spaceMap) return spaceMap[value]
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

const safeImageUrl = (value) => {
  try {
    const url = new URL(String(value || ''), window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

function FlexNode({ node, nodeKey }) {
  if (!node || typeof node !== 'object') return null
  if (node.type === 'text') {
    return (
      <div
        key={nodeKey}
        style={{
          color: node.color || '#444444',
          fontSize: sizeMap[node.size] || length(node.size, 13),
          fontWeight: node.weight === 'bold' ? 700 : 400,
          textAlign: node.align || 'left',
          whiteSpace: node.wrap === false ? 'nowrap' : 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: length(node.margin, 0),
          lineHeight: 1.35,
        }}
      >
        {String(node.text || '')}
      </div>
    )
  }
  if (node.type === 'box') {
    return (
      <div
        key={nodeKey}
        style={{
          display: 'flex',
          flexDirection: node.layout === 'horizontal' ? 'row' : 'column',
          alignItems: node.alignItems || (node.layout === 'horizontal' ? 'center' : 'stretch'),
          justifyContent: node.justifyContent || 'flex-start',
          gap: length(node.spacing, 0),
          marginTop: length(node.margin, 0),
          padding: length(node.paddingAll, 0),
          background: node.backgroundColor || 'transparent',
          borderRadius: length(node.cornerRadius, 0),
        }}
      >
        {(node.contents || []).map((child, index) => (
          <FlexNode key={`${nodeKey}-${index}`} node={child} nodeKey={`${nodeKey}-${index}`} />
        ))}
      </div>
    )
  }
  if (node.type === 'button') {
    return (
      <div
        key={nodeKey}
        style={{
          marginTop: length(node.margin, 0),
          borderRadius: 8,
          background: node.style === 'primary' ? node.color || '#06C755' : 'transparent',
          border: node.style === 'secondary' ? `1px solid ${node.color || '#06C755'}` : 'none',
          color: node.style === 'primary' ? '#ffffff' : node.color || '#06C755',
          padding: '9px 12px',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {node.action?.label || 'Action'}
      </div>
    )
  }
  if (node.type === 'image' || node.type === 'icon') {
    const source = safeImageUrl(node.url)
    return source ? (
      <img
        key={nodeKey}
        src={source}
        alt=""
        style={{
          display: 'block',
          width: node.type === 'icon' ? length(node.size, 20) : '100%',
          height: node.type === 'icon' ? length(node.size, 20) : length(node.aspectRatio, 120),
          objectFit: node.aspectMode === 'fit' ? 'contain' : 'cover',
          borderRadius: length(node.cornerRadius, 0),
          marginTop: length(node.margin, 0),
        }}
      />
    ) : null
  }
  if (node.type === 'separator') {
    return <hr key={nodeKey} style={{ marginTop: length(node.margin, 0), borderColor: node.color || '#eeeeee' }} />
  }
  if (node.type === 'spacer') {
    return <div key={nodeKey} style={{ height: length(node.size, 8) }} />
  }
  return null
}

function Bubble({ contents }) {
  return (
    <div className="w-[260px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      {contents.hero && <FlexNode node={contents.hero} nodeKey="hero" />}
      {contents.body && <FlexNode node={contents.body} nodeKey="body" />}
      {contents.footer && (
        <div className="border-t border-gray-100">
          <FlexNode node={contents.footer} nodeKey="footer" />
        </div>
      )}
    </div>
  )
}

export default function FlexMessagePreview({ message, displayName, avatarUrl }) {
  const messages = Array.isArray(message) ? message : [message]
  const flex = messages.find((item) => item?.type === 'flex')
  const contents = flex?.contents?.type === 'carousel'
    ? flex.contents.contents?.[0]
    : flex?.contents
  if (!contents || contents.type !== 'bubble') {
    return (
      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
        Preview รองรับ Flex bubble หรือ bubble แรกของ carousel
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d6e1e7] bg-[#8facbf] p-3">
      <div className="mb-2 text-center text-[10px] font-medium text-white/80">ตัวอย่างใน LINE</div>
      <div className="flex items-start gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-xs font-bold text-white">
            {(displayName || 'L').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="mb-1 truncate text-[11px] font-medium text-white">
            {displayName || 'LINE Manager'}
          </div>
          <Bubble contents={contents} />
          {flex?.contents?.type === 'carousel' && flex.contents.contents?.length > 1 && (
            <div className="mt-1 text-[10px] text-white/80">
              แสดงการ์ดแรกจากทั้งหมด {flex.contents.contents.length} การ์ด
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
