const pkg = require('../package.json')
const sdkNotify = require('./sdk-notify')

const pkgName = `LINE-BOT v${pkg.version}`
module.exports = {
  pkgName,
  loggingLINE: async (ex) => {
    const { pushNotify } = await sdkNotify('log', 'slog')
    if (ex instanceof Error) {
      ex = ex.message ? `*${(ex.message || '').substring(0, 200)}*\n${(ex.stack || '').substring(0, 200)}` : ex
    }
    await pushNotify(`*${pkgName}* ... ${ex}`)
  }
}
