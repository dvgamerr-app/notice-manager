import pino from 'pino'

const configuredLevel = process.env.LOG_LEVEL?.trim() || 'info'

export const logger = pino({
  name: 'notice-manager',
  level: configuredLevel,
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
})
