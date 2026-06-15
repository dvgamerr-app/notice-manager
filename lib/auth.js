import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

// ponytail: separate Pool for better-auth (it owns its own queries against ba_ tables)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || 'notice-manager-secret-changeme-32!',
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  advanced: {
    database: { tablePrefix: 'ba_' }
  },
  socialProviders: {
    line: {
      clientId: process.env.LINE_CLIENT_ID || '',
      clientSecret: process.env.LINE_CLIENT_SECRET || '',
      scope: ['profile', 'openid'],
    }
  }
})
