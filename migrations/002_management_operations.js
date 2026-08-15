export async function up(db) {
  await db.schema
    .alterTable('managed_chat')
    .addColumn('line_display_name', 'text')
    .execute()

  await db.schema
    .alterTable('managed_chat')
    .addColumn('picture_url', 'text')
    .execute()

  await db.schema
    .alterTable('managed_chat')
    .addColumn('metadata_payload', 'text')
    .execute()

  await db.schema
    .alterTable('managed_chat')
    .addColumn('updated_at', 'text', (column) => column.notNull().defaultTo(''))
    .execute()

  await db
    .updateTable('managed_chat')
    .set((expression) => ({
      line_display_name: expression.ref('display_name'),
      updated_at: expression.ref('last_seen_at'),
    }))
    .execute()

  await db.schema
    .createIndex('managed_bot_user_unique')
    .ifNotExists()
    .unique()
    .on('managed_bot')
    .column('bot_user_id')
    .execute()

  await db.schema
    .createTable('managed_api_key')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'text', (column) =>
      column.notNull().references('app_user.id').onDelete('cascade'))
    .addColumn('bot_id', 'text', (column) =>
      column.notNull().references('managed_bot.id').onDelete('cascade'))
    .addColumn('name', 'text', (column) => column.notNull())
    .addColumn('key_prefix', 'text', (column) => column.notNull())
    .addColumn('key_hash', 'text', (column) => column.notNull().unique())
    .addColumn('active', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('last_used_at', 'text')
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('revoked_at', 'text')
    .execute()

  await db.schema
    .createIndex('managed_api_key_bot_active_index')
    .ifNotExists()
    .on('managed_api_key')
    .columns(['bot_id', 'active'])
    .execute()

  await db.schema
    .createTable('managed_audit_log')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('actor_type', 'text', (column) => column.notNull())
    .addColumn('actor_id', 'text')
    .addColumn('bot_id', 'text', (column) =>
      column.references('managed_bot.id').onDelete('set null'))
    .addColumn('action', 'text', (column) => column.notNull())
    .addColumn('entity_type', 'text', (column) => column.notNull())
    .addColumn('entity_id', 'text')
    .addColumn('metadata_payload', 'text', (column) => column.notNull().defaultTo('{}'))
    .addColumn('created_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createIndex('managed_audit_bot_created_index')
    .ifNotExists()
    .on('managed_audit_log')
    .columns(['bot_id', 'created_at'])
    .execute()

  await db.schema
    .createIndex('managed_webhook_bot_received_index')
    .ifNotExists()
    .on('managed_webhook_event')
    .columns(['bot_id', 'received_at'])
    .execute()
}

export async function down(db) {
  await db.schema.dropIndex('managed_webhook_bot_received_index').ifExists().execute()
  await db.schema.dropTable('managed_audit_log').ifExists().execute()
  await db.schema.dropTable('managed_api_key').ifExists().execute()
  await db.schema.dropIndex('managed_bot_user_unique').ifExists().execute()
  await db.schema.alterTable('managed_chat').dropColumn('updated_at').execute()
  await db.schema.alterTable('managed_chat').dropColumn('metadata_payload').execute()
  await db.schema.alterTable('managed_chat').dropColumn('picture_url').execute()
  await db.schema.alterTable('managed_chat').dropColumn('line_display_name').execute()
}
