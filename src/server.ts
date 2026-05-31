import handler from '@tanstack/react-start/server-entry'

// Headers applied to all SSR responses. Static assets get equivalent headers
// from `public/_headers`, which the Workers asset server reads directly.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export default {
  async fetch(...args: Parameters<typeof handler.fetch>) {
    const response = await handler.fetch(...args)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(name, value)
    }
    return response
  },
}
