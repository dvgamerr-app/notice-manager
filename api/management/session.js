import { unauthorized } from './shared.js'

export const getSession = async ({ user, set }) => {
  if (!user) return unauthorized(set)
  return { user }
}
