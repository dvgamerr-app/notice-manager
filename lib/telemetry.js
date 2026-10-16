import { SeverityNumber } from '@opentelemetry/api-logs'
import { ROOT_CONTEXT, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Elysia } from 'elysia'
import pkg from '../package.json' with { type: 'json' }

// Traceway receives OTLP/HTTP at <instance>/api/otel. Telemetry stays disabled
// (no-op tracer) unless both the instance URL and the backend token are set.
const instance = process.env.TRACEWAY_URL?.trim().replace(/\/+$/, '')
const token = process.env.TRACEWAY_TOKEN?.trim()

let provider = null
let loggerProvider = null
if (instance && token) {
  const resource = resourceFromAttributes({
    'service.name': process.env.OTEL_SERVICE_NAME || 'notice-manager',
    'service.version': process.env.APP_VERSION || pkg.version,
  })
  const headers = { Authorization: `Bearer ${token}` }
  provider = new BasicTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${instance}/api/otel/v1/traces`, headers }),
      ),
    ],
  })
  loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({ url: `${instance}/api/otel/v1/logs`, headers }),
      }),
    ],
  })
}

const tracer = provider ? provider.getTracer('notice-manager') : trace.getTracer('notice-manager')
const requestSpans = new WeakMap()

export const telemetryEnabled = Boolean(provider)

export const shutdownTelemetry = async () => {
  await Promise.allSettled([provider?.shutdown(), loggerProvider?.shutdown()])
}

const SEVERITY = [
  [60, SeverityNumber.FATAL, 'FATAL'],
  [50, SeverityNumber.ERROR, 'ERROR'],
  [40, SeverityNumber.WARN, 'WARN'],
  [30, SeverityNumber.INFO, 'INFO'],
  [20, SeverityNumber.DEBUG, 'DEBUG'],
  [0, SeverityNumber.TRACE, 'TRACE'],
]
const SENSITIVE_KEY = /token|secret|authorization|cookie|password|key|signature/i
const otelLogger = loggerProvider?.getLogger('notice-manager')

// Mirrors a pino record to Traceway. Only primitive, non-sensitive fields are sent.
export const emitLog = (level, args) => {
  if (!otelLogger) return
  try {
    const [first, second] = args
    const fields = first && typeof first === 'object' ? first : {}
    const body = typeof first === 'string' ? first : String(second ?? fields.err?.message ?? '')
    const attributes = {}
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'err' || SENSITIVE_KEY.test(key)) continue
      if (['string', 'number', 'boolean'].includes(typeof value)) attributes[key] = value
    }
    if (fields.err instanceof Error) {
      attributes['exception.type'] = fields.err.name
      attributes['exception.message'] = fields.err.message
      if (fields.err.stack) attributes['exception.stacktrace'] = fields.err.stack
    }
    const [, severityNumber, severityText] = SEVERITY.find(([min]) => level >= min)
    otelLogger.emit({ severityNumber, severityText, body, attributes })
  } catch {
    // Logging must never break the application.
  }
}

export const TRACE_HEADER = 'x-trace-parrent'

const TRACE_PARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/

// Parses a W3C traceparent value ("00-<traceId>-<parentSpanId>-<flags>") carried in
// the x-trace-parrent header into a remote parent context; null when absent/invalid.
export const extractTraceContext = (value) => {
  const match = TRACE_PARENT.exec(String(value ?? '').trim().toLowerCase())
  if (!match) return null
  const [, traceId, spanId, flags] = match
  if (/^0+$/.test(traceId) || /^0+$/.test(spanId)) return null
  return trace.setSpanContext(ROOT_CONTEXT, {
    traceId,
    spanId,
    traceFlags: Number.parseInt(flags, 16),
    isRemote: true,
  })
}

// Bun's HTTP server bypasses node:http, so there is no auto-instrumentation:
// each request becomes one SERVER span named after the matched route pattern.
// A valid x-trace-parrent header makes the span continue the caller's trace.
export const requestTelemetry = new Elysia({ name: 'traceway-request-telemetry' })
  .onRequest(({ request }) => {
    if (!provider) return
    const url = new URL(request.url)
    requestSpans.set(
      request,
      tracer.startSpan(
        `${request.method} ${url.pathname}`,
        {
          kind: SpanKind.SERVER,
          attributes: {
            'http.request.method': request.method,
            'url.path': url.pathname,
          },
        },
        extractTraceContext(request.headers.get(TRACE_HEADER)) ?? ROOT_CONTEXT,
      ),
    )
  })
  .onError({ as: 'global' }, ({ request, error, code }) => {
    const span = requestSpans.get(request)
    if (!span || code === 'NOT_FOUND' || code === 'VALIDATION') return
    const status = Number(/** @type {{ status?: number }} */ (error)?.status ?? 500)
    if (status < 500) return
    const err = error instanceof Error ? error : new Error(String(error))
    span.recordException(err)
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
  })
  .onAfterResponse({ as: 'global' }, ({ request, route, set, response }) => {
    const span = requestSpans.get(request)
    if (!span) return
    requestSpans.delete(request)
    const status = Number(
      set.status ?? (response instanceof Response ? response.status : 200),
    ) || 200
    // http.route must be a pattern starting with "/"; unmatched requests omit it.
    if (route?.startsWith('/') && route !== '/*') {
      span.updateName(`${request.method} ${route}`)
      span.setAttribute('http.route', route)
    }
    span.setAttribute('http.response.status_code', status)
    if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR })
    span.end()
  })

// One Task = one execution of background work. The span name is the grouping key.
export const runTask = async (name, work, attributes = {}) =>
  tracer.startActiveSpan(name, { kind: SpanKind.CONSUMER, attributes }, async (span) => {
    try {
      const result = await work(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
      throw error
    } finally {
      span.end()
    }
  })

// Records a Task only when the run found work, so idle polling stays out of Traceway.
export const recordTaskIf = (name, startedAt, attributes) => {
  const span = tracer.startSpan(name, {
    kind: SpanKind.CONSUMER,
    startTime: startedAt,
    attributes,
  })
  span.setStatus({ code: SpanStatusCode.OK })
  span.end()
}
