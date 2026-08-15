import { exchangeLiffAccessToken } from '../../lib/auth.js'

export default async ({ body, set }) => {
  try {
    return await exchangeLiffAccessToken(body?.access_token)
  } catch (error) {
    set.status = error.status || 500
    return { error: error.message || 'Unable to authenticate with LIFF' }
  }
}
