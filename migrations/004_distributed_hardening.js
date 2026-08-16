export async function up(db) {
  await db.schema
    .createTable('managed_rate_limit_bucket')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('api_key_id', 'text', (column) =>
      column.notNull().references('managed_api_key.id').onDelete('cascade'))
    .addColumn('window_started_at', 'text', (column) => column.notNull())
    .addColumn('request_count', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .addUniqueConstraint(
      'managed_rate_limit_bucket_key_window_unique',
      ['api_key_id', 'window_started_at'],
    )
    .execute()

  await db.schema
    .createIndex('managed_rate_limit_bucket_window_index')
    .ifNotExists()
    .on('managed_rate_limit_bucket')
    .column('window_started_at')
    .execute()

  await db.schema
    .createIndex('app_session_expires_index')
    .ifNotExists()
    .on('app_session')
    .column('expires_at')
    .execute()

  await db.schema
    .createIndex('managed_webhook_received_index')
    .ifNotExists()
    .on('managed_webhook_event')
    .column('received_at')
    .execute()

  await db.schema
    .createIndex('managed_delivery_created_index')
    .ifNotExists()
    .on('managed_delivery')
    .column('created_at')
    .execute()

  await db.schema
    .createIndex('managed_audit_created_index')
    .ifNotExists()
    .on('managed_audit_log')
    .column('created_at')
    .execute()
}

export async function down(db) {
  await db.schema.dropIndex('managed_audit_created_index').ifExists().execute()
  await db.schema.dropIndex('managed_delivery_created_index').ifExists().execute()
  await db.schema.dropIndex('managed_webhook_received_index').ifExists().execute()
  await db.schema.dropIndex('app_session_expires_index').ifExists().execute()
  await db.schema.dropTable('managed_rate_limit_bucket').ifExists().execute()
}
