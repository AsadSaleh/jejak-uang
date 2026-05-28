import { useRef, useState } from 'react'
import { isPdfEncrypted } from '../import/detect-encryption'

interface ImportDropzoneProps {
  onParse: (bytes: Uint8Array, fileName: string, password?: string) => void
  parsing: boolean
  error: string | null
}

export function ImportDropzone({ onParse, parsing, error }: ImportDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [encrypted, setEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return
    }
    const buf = new Uint8Array(await file.arrayBuffer())
    setBytes(buf)
    setFileName(file.name)
    setEncrypted(isPdfEncrypted(buf))
    setPassword('')
  }

  function reset() {
    setBytes(null)
    setFileName(null)
    setEncrypted(false)
    setPassword('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function submit() {
    if (!bytes) return
    onParse(bytes, fileName ?? 'document.pdf', encrypted ? password : undefined)
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
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="text-3xl">📄</div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {fileName ?? 'Drop a bank statement PDF here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Parsed entirely in your browser — nothing is uploaded.
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
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">
                {fileName}
              </p>
              <p className="text-xs text-slate-400">
                {encrypted ? '🔒 Password protected' : 'Ready to parse'}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={parsing}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          {encrypted && (
            <div className="mt-3">
              <label
                htmlFor="pdf-password"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                PDF password
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
                placeholder="Enter password to unlock"
                className="mt-1 w-full rounded-md border-0 bg-slate-50 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
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
              disabled={parsing || (encrypted && !password)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {parsing ? 'Parsing…' : 'Parse statement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
