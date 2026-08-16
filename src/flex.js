const value = (input) => String(input || '').trim()

export const buildCompactFlexMessage = ({
  title,
  body,
  actionLabel,
  actionUri,
}) => {
  const cardTitle = value(title)
  const cardBody = value(body)
  const buttonUri = value(actionUri)
  const buttonLabel = value(actionLabel) || 'เปิดดู'

  if (!cardTitle && !cardBody) {
    throw new Error('Flex card ต้องมีหัวข้อหรือรายละเอียดอย่างน้อยหนึ่งรายการ')
  }
  if (buttonUri) {
    let protocol
    try {
      protocol = new URL(buttonUri).protocol
    } catch {
      throw new Error('URL ของปุ่ม Flex card ไม่ถูกต้อง')
    }
    if (!['https:', 'http:', 'line:', 'tel:'].includes(protocol)) {
      throw new Error('URL ของปุ่ม Flex card ต้องเป็น HTTP, HTTPS, LINE หรือโทรศัพท์')
    }
  }

  const contents = []
  if (cardTitle) {
    contents.push({
      type: 'text',
      text: cardTitle,
      weight: 'bold',
      size: 'sm',
      color: '#111111',
      wrap: true,
    })
  }
  if (cardBody) {
    contents.push({
      type: 'text',
      text: cardBody,
      size: 'xs',
      color: '#666666',
      wrap: true,
      ...(cardTitle ? { margin: 'sm' } : {}),
    })
  }

  const bubble = {
    type: 'bubble',
    size: 'micro',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents,
    },
  }
  if (buttonUri) {
    bubble.footer = {
      type: 'box',
      layout: 'vertical',
      paddingAll: '8px',
      contents: [{
        type: 'button',
        style: 'link',
        height: 'sm',
        color: '#06C755',
        action: { type: 'uri', label: buttonLabel.slice(0, 40), uri: buttonUri },
      }],
    }
  }

  return {
    type: 'flex',
    altText: (cardTitle || cardBody || 'Flex card').slice(0, 400),
    contents: bubble,
  }
}
