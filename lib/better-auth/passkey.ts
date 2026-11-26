const CANCELLED_CODES = new Set([
  "AUTH_CANCELLED",
  "REGISTRATION_CANCELLED",
  "ERROR_CEREMONY_ABORTED",
])

/** User dismissed the browser passkey prompt; do not surface as a failure. */
export function isPasskeyCancelled(
  error: {
    code?: string | undefined
    message?: string | undefined
  } | null
) {
  if (!error) return false
  return CANCELLED_CODES.has(error.code ?? "")
}
