const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

export const requiresLiffTunnel = (location, { liffId, devBypass }) => Boolean(
  liffId &&
  !devBypass &&
  location.protocol === 'http:' &&
  LOCAL_HOSTNAMES.has(location.hostname)
)
