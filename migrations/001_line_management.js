export async function up(db) {
  await db.schema
    .createTable('app_setting')
    .ifNotExists()
    .addColumn('key', 'text', (column) => column.primaryKey())
    .addColumn('value', 'text', (column) => column.notNull())
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createTable('app_user')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('display_name', 'text', (column) => column.notNull())
    .addColumn('picture_url', 'text')
    .addColumn('role', 'text', (column) => column.notNull().defaultTo('admin'))
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createTable('app_session')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('token_hash', 'text', (column) => column.notNull().unique())
    .addColumn('user_id', 'text', (column) =>
      column.notNull().references('app_user.id').onDelete('cascade'))
    .addColumn('expires_at', 'text', (column) => column.notNull())
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('last_seen_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createTable('managed_bot')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'text', (column) =>
      column.notNull().references('app_user.id').onDelete('cascade'))
    .addColumn('service', 'text', (column) => column.notNull().unique())
    .addColumn('name', 'text', (column) => column.notNull())
    .addColumn('channel_access_token', 'text', (column) => column.notNull())
    .addColumn('channel_secret', 'text', (column) => column.notNull())
    .addColumn('bot_user_id', 'text', (column) => column.notNull())
    .addColumn('basic_id', 'text')
    .addColumn('picture_url', 'text')
    .addColumn('active', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('webhook_endpoint', 'text')
    .addColumn('verified_at', 'text', (column) => column.notNull())
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .execute()

  await db.schema
    .createTable('managed_chat')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('bot_id', 'text', (column) =>
      column.notNull().references('managed_bot.id').onDelete('cascade'))
    .addColumn('source_id', 'text', (column) => column.notNull())
    .addColumn('source_type', 'text', (column) => column.notNull())
    .addColumn('display_name', 'text', (column) => column.notNull().defaultTo(''))
    .addColumn('active', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('registered', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('first_seen_at', 'text', (column) => column.notNull())
    .addColumn('last_seen_at', 'text', (column) => column.notNull())
    .addUniqueConstraint('line_chat_bot_source_unique', ['bot_id', 'source_id'])
    .execute()

  await db.schema
    .createIndex('managed_chat_bot_registered_index')
    .ifNotExists()
    .on('managed_chat')
    .columns(['bot_id', 'registered'])
    .execute()

  await db.schema
    .createTable('managed_webhook_event')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('bot_id', 'text', (column) =>
      column.notNull().references('managed_bot.id').onDelete('cascade'))
    .addColumn('webhook_event_id', 'text')
    .addColumn('event_type', 'text', (column) => column.notNull())
    .addColumn('source_id', 'text')
    .addColumn('payload', 'text', (column) => column.notNull())
    .addColumn('is_redelivery', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('received_at', 'text', (column) => column.notNull())
    .addUniqueConstraint('line_webhook_bot_event_unique', ['bot_id', 'webhook_event_id'])
    .execute()

  await db.schema
    .createTable('managed_delivery')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('bot_id', 'text', (column) =>
      column.notNull().references('managed_bot.id').onDelete('cascade'))
    .addColumn('chat_id', 'text', (column) =>
      column.references('managed_chat.id').onDelete('set null'))
    .addColumn('recipient_id', 'text', (column) => column.notNull())
    .addColumn('message_payload', 'text', (column) => column.notNull())
    .addColumn('status', 'text', (column) => column.notNull())
    .addColumn('line_request_id', 'text')
    .addColumn('response_payload', 'text')
    .addColumn('error', 'text')
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('sent_at', 'text')
    .execute()

  await db.schema
    .createIndex('managed_delivery_bot_created_index')
    .ifNotExists()
    .on('managed_delivery')
    .columns(['bot_id', 'created_at'])
    .execute()
}

export async function down(db) {
  await db.schema.dropTable('managed_delivery').ifExists().execute()
  await db.schema.dropTable('managed_webhook_event').ifExists().execute()
  await db.schema.dropTable('managed_chat').ifExists().execute()
  await db.schema.dropTable('managed_bot').ifExists().execute()
  await db.schema.dropTable('app_session').ifExists().execute()
  await db.schema.dropTable('app_user').ifExists().execute()
  await db.schema.dropTable('app_setting').ifExists().execute()
}
