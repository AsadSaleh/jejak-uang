// Thin wrapper around the LiteParse WASM build. Everything is loaded lazily and
// dynamically so the (large) wasm module never touches the SSR/server path and
// is only fetched when the user actually parses a file.

export interface ParsedTextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontName?: string
  fontSize?: number
}

export interface ParsedPage {
  pageNum: number
  width: number
  height: number
  text: string
  textItems: ParsedTextItem[]
}

export interface ParsedDoc {
  text: string
  pages: ParsedPage[]
}

export class PdfPasswordError extends Error {
  constructor(message = 'PDF is password protected or the password is incorrect.') {
    super(message)
    this.name = 'PdfPasswordError'
  }
}

let initPromise: Promise<void> | null = null

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const mod = await import('@llamaindex/liteparse-wasm')
      const wasmUrl = (
        await import('@llamaindex/liteparse-wasm/liteparse_wasm_bg.wasm?url')
      ).default
      await mod.default({ module_or_path: wasmUrl })
    })()
  }
  return initPromise
}

export async function parsePdf(
  bytes: Uint8Array,
  password?: string,
): Promise<ParsedDoc> {
  await ensureInit()
  const { LiteParse } = await import('@llamaindex/liteparse-wasm')
  const parser = new LiteParse({
    ocrEnabled: false,
    outputFormat: 'json',
    quiet: true,
    ...(password ? { password } : {}),
  })
  try {
    const result = await parser.parse(bytes)
    return {
      text: typeof result?.text === 'string' ? result.text : '',
      pages: Array.isArray(result?.pages) ? result.pages : [],
    }
  } catch (err) {
    const msg = String((err as Error)?.message ?? err).toLowerCase()
    if (msg.includes('password') || msg.includes('encrypt')) {
      throw new PdfPasswordError()
    }
    throw err
  }
}
