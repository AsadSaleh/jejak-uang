// A PDF declares encryption via an /Encrypt entry referenced from the trailer.
// Scanning the raw bytes for that token is a cheap, dependency-free signal that
// the file needs a password before LiteParse can read it.
export function isPdfEncrypted(bytes: Uint8Array): boolean {
  const text = new TextDecoder('latin1').decode(bytes)
  return text.includes('/Encrypt')
}
