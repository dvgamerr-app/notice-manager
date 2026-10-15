import pino from 'pino'
import { emitLog } from './telemetry.js'

const configuredLevel = process.env.LOG_LEVEL?.trim() || 'info'
// json (default) writes one JSON record per line; text pretty-prints for terminals.
const configuredFormat = process.env.LOG_FORMAT?.trim().toLowerCase() || 'json'

const options = {
  name: 'notice-manager',
  level: configuredLevel,
  hooks: {
    logMethod(args, method, level) {
      emitLog(level, args)
      return method.apply(this, args)
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers.x-api-key',
      'channel_access_token',
      'channel_secret',
      '*.channel_access_token',
      '*.channel_secret',
    ],
    censor: '[REDACTED]',
  },
}

export const logger =
  configuredFormat === 'text'
    ? pino(
        options,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            errorLikeObjectKeys: ['__none__'],
          },
        }),
      )
    : pino(options)
