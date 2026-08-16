import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Database } from 'bun:sqlite'
import {
  Kysely,
  PostgresDialect,
  SqliteDialect,
} from 'kysely'
import { FileMigrationProvider, Migrator } from 'kysely/migration'
import { Pool } from 'pg'
import { logger } from './logger.js'

const databaseUrl = process.env.DATABASE_URL || 'sqlite://./notice-manager.sqlite'

export const databaseType = /^(?:sqlite:|file:|:memory:)/i.test(databaseUrl)
  ? 'sqlite'
  : 'postgres'

const sqliteFilename = (url) => {
  if (url === ':memory:' || url === 'sqlite://:memory:' || url === 'file://:memory:') {
    return ':memory:'
  }

  const withoutProtocol = url.replace(/^(?:sqlite|file):\/\//i, '')
  if (/^\/[A-Za-z]:\//.test(withoutProtocol)) return withoutProtocol.slice(1)
  return withoutProtocol || './notice-manager.sqlite'
}

// Kysely's SQLite dialect expects better-sqlite3's `reader` property.
// Bun's native statement exposes `columnNames` instead, while its query methods
// are otherwise compatible with the small interface Kysely needs.
class BunSqliteDatabase {
  constructor(filename) {
    this.native = new Database(filename, { create: true })
    this.native.run('PRAGMA foreign_keys = ON')
    if (filename !== ':memory:') this.native.run('PRAGMA journal_mode = WAL')
  }

  prepare(sql) {
    const statement = this.native.prepare(sql)
    return {
      get reader() {
        return statement.columnNames.length > 0
      },
      all: (parameters) => statement.all(parameters),
      run: (parameters) => statement.run(parameters),
      iterate: (parameters) => statement.iterate(parameters),
    }
  }

  close() {
    this.native.close()
  }
}

const dialect = databaseType === 'sqlite'
  ? new SqliteDialect({
      database: new BunSqliteDatabase(sqliteFilename(databaseUrl)),
    })
  : new PostgresDialect({
      pool: new Pool({ connectionString: databaseUrl }),
    })

export const db = new Kysely({ dialect })

export const migrateToLatest = async () => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, '..', 'migrations'),
    }),
  })

  const { error, results = [] } = await migrator.migrateToLatest()
  for (const result of results) {
    const label = result.status === 'Success' ? 'migrated' : result.status.toLowerCase()
    logger.info(
      { migration: result.migrationName, status: result.status, label },
      'Database migration completed',
    )
  }
  if (error) throw error
}
