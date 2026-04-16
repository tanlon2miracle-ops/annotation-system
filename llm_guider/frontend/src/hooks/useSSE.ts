import type { SSEEvent } from '../types'

export interface SSECallbacks {
  onEvent: (event: SSEEvent) => void
  onError: (error: Error) => void
  onDone: () => void
}

export function streamSSE(
  url: string,
  body: unknown,
  callbacks: SSECallbacks,
): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status}: ${text}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const parsed = parseSSEBlock(part)
          if (parsed) callbacks.onEvent(parsed)
        }
      }

      if (buffer.trim()) {
        const parsed = parseSSEBlock(buffer)
        if (parsed) callbacks.onEvent(parsed)
      }

      callbacks.onDone()
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return controller
}

function parseSSEBlock(block: string): SSEEvent | null {
  let event = 'message'
  let dataStr = ''

  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) {
      event = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      dataStr = line.slice(6)
    }
  }

  if (!dataStr) return null

  try {
    return { event, data: JSON.parse(dataStr) }
  } catch {
    return null
  }
}
