import { describe, expect, test } from 'bun:test'
import { trace } from '@opentelemetry/api'
import { extractTraceContext, TRACE_HEADER } from '../lib/telemetry.js'

describe('x-trace-parrent propagation', () => {
  test('uses the x-trace-parrent header name', () => {
    expect(TRACE_HEADER).toBe('x-trace-parrent')
  })

  test('continues the caller trace from a W3C traceparent value', () => {
    const context = extractTraceContext('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
    const span = trace.getSpanContext(context)
    expect(span.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    expect(span.spanId).toBe('00f067aa0ba902b7')
    expect(span.traceFlags).toBe(1)
    expect(span.isRemote).toBe(true)
  })

  test('ignores missing, malformed and all-zero values', () => {
    expect(extractTraceContext(null)).toBeNull()
    expect(extractTraceContext('garbage')).toBeNull()
    expect(extractTraceContext('00-short-00f067aa0ba902b7-01')).toBeNull()
    expect(
      extractTraceContext('00-00000000000000000000000000000000-00f067aa0ba902b7-01'),
    ).toBeNull()
  })
})
