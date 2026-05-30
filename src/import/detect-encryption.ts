// A PDF declares encryption via an `/Encrypt N M R` indirect reference in the
// trailer dictionary, which lives at the end of the file. We scan the tail
// (where the trailer is) for that specific pattern — looking for the literal
// "/Encrypt" anywhere yields false positives when the string appears inside a
// content stream.
const ENCRYPT_REF_RE = /\/Encrypt\s+\d+\s+\d+\s+R/

export function isPdfEncrypted(bytes: Uint8Array): boolean {
  const tail = bytes.slice(Math.max(0, bytes.length - 8192))
  return ENCRYPT_REF_RE.test(new TextDecoder('latin1').decode(tail))
}
