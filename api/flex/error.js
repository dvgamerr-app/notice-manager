import alertFlex from './alert.js'

export default (title, err, detail) => {
  const msg = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? (err.stack || '').slice(0, 300) : ''
  return alertFlex(title, msg, detail || stack, '#f44336')
}
