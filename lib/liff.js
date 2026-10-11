// LIFF IDs look like `<LINE Login channel ID>-<random>`, so the channel ID can
// be derived from the LIFF ID and operators only configure one value.
export const getLiffId = () =>
  (process.env.LIFF_ID || process.env.VITE_LIFF_ID || '').trim()

export const getLoginChannelId = () => {
  const explicit = (
    process.env.LINE_LOGIN_CHANNEL_ID ||
    process.env.LINE_CLIENT_ID ||
    ''
  ).trim()
  if (explicit) return explicit
  return /^(\d+)-/.exec(getLiffId())?.[1] || ''
}
