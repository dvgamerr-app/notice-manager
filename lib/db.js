import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'

export const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL })
  })
})

export const initDbSchema = async () => {
  console.log('init database...')

  await sql`
    CREATE TABLE IF NOT EXISTS line_bot (
      id SERIAL PRIMARY KEY,
      service VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(200),
      access_token TEXT,
      secret TEXT,
      user_id VARCHAR(100),
      active BOOLEAN DEFAULT true,
      options JSONB DEFAULT '{}',
      created TIMESTAMPTZ DEFAULT NOW()
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS line_bot_room (
      id SERIAL PRIMARY KEY,
      bot_name VARCHAR(100) NOT NULL,
      room_id VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      name VARCHAR(200) DEFAULT '',
      active BOOLEAN DEFAULT true,
      variable JSONB DEFAULT '[]',
      created TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(bot_name, room_id)
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS line_bot_user (
      id SERIAL PRIMARY KEY,
      bot_name VARCHAR(100) NOT NULL,
      room_name VARCHAR(200) NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      name VARCHAR(200),
      created TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(bot_name, room_name, user_id)
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS line_inbound (
      id SERIAL PRIMARY KEY,
      bot_name VARCHAR(100),
      type VARCHAR(50),
      source JSONB,
      message JSONB,
      timestamp BIGINT,
      created TIMESTAMPTZ DEFAULT NOW()
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS line_outbound (
      id SERIAL PRIMARY KEY,
      bot_name VARCHAR(100),
      user_to VARCHAR(100),
      sender JSONB,
      type VARCHAR(20) DEFAULT 'bot',
      sended BOOLEAN DEFAULT true,
      error TEXT,
      created TIMESTAMPTZ DEFAULT NOW()
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS chat_webhook (
      id SERIAL PRIMARY KEY,
      service VARCHAR(100) NOT NULL,
      room VARCHAR(200),
      uri TEXT NOT NULL,
      active BOOLEAN DEFAULT true,
      created TIMESTAMPTZ DEFAULT NOW()
    )
  `.execute(db)

  // better-auth tables (prefix ba_ avoids PostgreSQL reserved word "user")
  await sql`
    CREATE TABLE IF NOT EXISTS ba_user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS ba_session (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES ba_user(id) ON DELETE CASCADE
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS ba_account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES ba_user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS ba_verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    )
  `.execute(db)

  console.log('database schema ready')
}
