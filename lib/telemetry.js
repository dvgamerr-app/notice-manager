import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Elysia } from 'elysia'
import pkg from '../package.json' with { type: 'json' }

// Traceway receives OTLP/HTTP at <instance>/api/otel. Telemetry stays disabled
// (no-op tracer) unless both the instance URL and the backend token are set.
const instance = process.env.TRACEWAY_URL?.trim().replace(/\/+$/, '')
const token = process.env.TRACEWAY_TOKEN?.trim()

let provider = null
if (instance && token) {
  provider = new BasicTracerProvider({
    resource: resourceFromAttributes({
      'service.name': process.env.OTEL_SERVICE_NAME || 'notice-manager',
      'service.version': process.env.APP_VERSION || pkg.version,
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${instance}/api/otel/v1/traces`,
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    ],
  })
}

const tracer = provider ? provider.getTracer('notice-manager') : trace.getTracer('notice-manager')
const requestSpans = new WeakMap()

export const telemetryEnabled = Boolean(provider)

export const shutdownTelemetry = async () => {
  if (provider) await provider.shutdown().catch(() => {})
}

// Bun's HTTP server bypasses node:http, so there is no auto-instrumentation:
// each request becomes one SERVER span named after the matched route pattern.
export const requestTelemetry = new Elysia({ name: 'traceway-request-telemetry' })
  .onRequest(({ request }) => {
    if (!provider) return
    const url = new URL(request.url)
    requestSpans.set(
      request,
      tracer.startSpan(`${request.method} ${url.pathname}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.request.method': request.method,
          'url.path': url.pathname,
        },
      }),
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
