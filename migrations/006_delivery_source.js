export async function up(db) {
  await db.schema
    .alterTable('managed_delivery')
    .addColumn('source', 'text')
    .execute()

  await db.schema
    .alterTable('managed_delivery')
    .addColumn('api_key_id', 'text')
    .execute()
}

export async function down(db) {
  await db.schema.alterTable('managed_delivery').dropColumn('api_key_id').execute()
  await db.schema.alterTable('managed_delivery').dropColumn('source').execute()
}
