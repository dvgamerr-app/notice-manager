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
}

export async function down(db) {
  await db.schema.dropTable('managed_rate_limit_bucket').ifExists().execute()
}
