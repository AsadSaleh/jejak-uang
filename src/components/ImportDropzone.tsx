import { useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'

interface ImportDropzoneProps {
  onParse: (
    bytes: Uint8Array,
    fileName: string,
    password?: string,
    rememberPassword?: boolean,
  ) => void
  parsing: boolean
  error: string | null
  // Set by the route after a parse fails with a password error. Reveals the
  // password field; the byte-level encryption header isn't reliable on its own
  // (some PDFs declare /Encrypt but use an empty user password).
  needsPassword: boolean
  // Fired when a fresh file is loaded — the route uses it to clear any
  // password-required state from a previous file.
  onFileChange?: () => void
}

export function ImportDropzone({
  onParse,
  parsing,
  error,
  needsPassword,
  onFileChange,
}: ImportDropzoneProps) {
  const { t } = useI18n()
  const [fileName, setFileName] = useState<string | null>(null)
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [password, setPassword] = useState('')
  const [rememberPassword, setRememberPassword] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return
    }
    const buf = new Uint8Array(await file.arrayBuffer())
    setBytes(buf)
    setFileName(file.name)
    setPassword('')
    onFileChange?.()
  }

  function reset() {
    setBytes(null)
    setFileName(null)
    setPassword('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function submit() {
    if (!bytes) return
    onParse(
      bytes,
      fileName ?? 'document.pdf',
      password || undefined,
      rememberPassword,
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragOver
            ? 'border-slate-900 bg-slate-50 dark:bg-slate-800'
            : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
        }`}
      >
        <div className="text-3xl">📄</div>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          {fileName ?? t('dropzone.prompt')}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t('dropzone.privacy')}
        </p>
        <p className="mt-3 max-w-md rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          {t('dropzone.supported')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />
      </div>

      {fileName && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {fileName}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {needsPassword ? t('dropzone.passwordRequired') : t('dropzone.ready')}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={parsing}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {t('dropzone.remove')}
            </button>
          </div>

          {needsPassword && (
            <div className="mt-3">
              <label
                htmlFor="pdf-password"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {t('dropzone.pdfPassword')}
              </label>
              <input
                id="pdf-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) submit()
                }}
                placeholder={t('dropzone.passwordPlaceholder')}
                className="mt-1 w-full rounded-md border-0 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                {t('dropzone.remember')}
                <span className="text-slate-400 dark:text-slate-500">
                  {t('dropzone.storedLocally')}
                </span>
              </label>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={parsing || (needsPassword && !password)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {parsing ? t('dropzone.parsing') : t('dropzone.parse')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
