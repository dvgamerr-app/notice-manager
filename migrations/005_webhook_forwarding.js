export async function up(db) {
  await db.schema
    .createTable('managed_webhook_target')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('bot_id', 'text', (column) =>
      column.notNull().references('managed_bot.id').onDelete('cascade'))
    .addColumn('chat_id', 'text', (column) =>
      column.references('managed_chat.id').onDelete('cascade'))
    .addColumn('name', 'text', (column) => column.notNull())
    .addColumn('url', 'text', (column) => column.notNull())
    .addColumn('secret', 'text', (column) => column.notNull())
    .addColumn('enabled', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('timeout_ms', 'integer', (column) => column.notNull().defaultTo(5000))
    .addColumn('max_attempts', 'integer', (column) => column.notNull().defaultTo(6))
    .addColumn('consecutive_failures', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('paused_until', 'text')
    .addColumn('last_success_at', 'text')
    .addColumn('last_failure_at', 'text')
    .addColumn('last_http_status', 'integer')
    .addColumn('last_error', 'text')
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createIndex('managed_webhook_target_bot_index')
    .ifNotExists()
    .on('managed_webhook_target')
    .columns(['bot_id', 'enabled'])
    .execute()

  await db.schema
    .createTable('managed_webhook_forward')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('target_id', 'text', (column) =>
      column.notNull().references('managed_webhook_target.id').onDelete('cascade'))
    .addColumn('event_id', 'text', (column) =>
      column.notNull().references('managed_webhook_event.id').onDelete('cascade'))
    .addColumn('status', 'text', (column) => column.notNull().defaultTo('pending'))
    .addColumn('attempt_count', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('next_attempt_at', 'text', (column) => column.notNull())
    .addColumn('last_attempt_at', 'text')
    .addColumn('last_http_status', 'integer')
    .addColumn('last_error', 'text')
    .addColumn('duration_ms', 'integer')
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('delivered_at', 'text')
    .addUniqueConstraint(
      'managed_webhook_forward_target_event_unique',
      ['target_id', 'event_id'],
    )
    .execute()

  await db.schema
    .createIndex('managed_webhook_forward_due_index')
    .ifNotExists()
    .on('managed_webhook_forward')
    .columns(['status', 'next_attempt_at'])
    .execute()

  await db.schema
    .createIndex('managed_webhook_forward_target_index')
    .ifNotExists()
    .on('managed_webhook_forward')
    .columns(['target_id', 'created_at'])
    .execute()

  await db.schema
    .createIndex('managed_webhook_forward_event_index')
    .ifNotExists()
    .on('managed_webhook_forward')
    .column('event_id')
    .execute()

  await db.schema
    .createIndex('managed_webhook_forward_created_index')
    .ifNotExists()
    .on('managed_webhook_forward')
    .column('created_at')
    .execute()
}

export async function down(db) {
  await db.schema.dropTable('managed_webhook_forward').ifExists().execute()
  await db.schema.dropIndex('managed_webhook_target_bot_index').ifExists().execute()
  await db.schema.dropTable('managed_webhook_target').ifExists().execute()
}
