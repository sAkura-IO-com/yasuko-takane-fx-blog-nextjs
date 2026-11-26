import { commonAuthenticatorNames } from "@better-auth/passkey"

/** Names-only snapshot of passkeydeveloper/passkey-authenticator-aaguids. */
import communityAuthenticatorNames from "./passkey-aaguids.json"
/** Colorful brand marks keyed by English authenticator name. */
import communityAuthenticatorIcons from "./passkey-aaguid-icons.json"

const ANONYMOUS_AAGUID = "00000000-0000-0000-0000-000000000000"

/** Display labels for common providers; unmatched names stay as in the community list. */
const AUTHENTICATOR_LABELS_ZH: Record<string, string> = {
  "Apple Passwords": "Apple 密码",
  "Chrome on Mac": "Chrome（Mac）",
  "Chrome on Windows": "Chrome（Windows）",
  "Google Password Manager": "Google 密码管理器",
  "iCloud Keychain": "iCloud 钥匙串",
  "iCloud Keychain (Managed)": "iCloud 钥匙串（托管）",
  "Kaspersky Password Manager": "卡巴斯基密码管理器",
  "Microsoft Password Manager": "Microsoft 密码管理器",
  "Windows Hello": "Windows Hello",
}

const authenticatorNames: Record<string, string> = {
  ...communityAuthenticatorNames,
  ...commonAuthenticatorNames,
}

const authenticatorIcons = communityAuthenticatorIcons as Record<string, string>

const ICON_FAMILY_ALIASES: [RegExp, string][] = [
  [/^YubiKey|^Security Key/i, "YubiKey 5 Series"],
  [/Titan Security Key/i, "Google Titan Security Key v2"],
  [/^Chrome on /i, "Chrome on Mac"],
  [/^iCloud Keychain/i, "iCloud Keychain (Managed)"],
]

function normalizeAaguid(aaguid: string | null | undefined) {
  return aaguid?.trim().toLowerCase() || ""
}

function localizeAuthenticatorName(name: string) {
  return AUTHENTICATOR_LABELS_ZH[name] ?? name
}

/** English/community name for an AAGUID, or undefined if unknown or withheld. */
export function getPasskeyAuthenticatorSource(
  aaguid: string | null | undefined
) {
  const normalized = normalizeAaguid(aaguid)
  if (!normalized || normalized === ANONYMOUS_AAGUID) return undefined
  const name = authenticatorNames[normalized]
  return typeof name === "string" ? name : undefined
}

/** Read-time label for the authenticator that created the passkey. */
export function getPasskeyAuthenticatorName(
  aaguid: string | null | undefined
) {
  const source = getPasskeyAuthenticatorSource(aaguid)
  if (source) return localizeAuthenticatorName(source)
  const normalized = normalizeAaguid(aaguid)
  if (!normalized || normalized === ANONYMOUS_AAGUID) return "未披露认证器"
  return "未知认证器"
}

function iconForSourceName(source: string) {
  const exact = authenticatorIcons[source]
  if (exact) return exact
  for (const [pattern, key] of ICON_FAMILY_ALIASES) {
    if (pattern.test(source)) {
      const aliased = authenticatorIcons[key]
      if (aliased) return aliased
    }
  }
  return undefined
}

/** Colorful authenticator logo as a data URI, if we have one. */
export function getPasskeyAuthenticatorIcon(
  aaguid: string | null | undefined
) {
  const source = getPasskeyAuthenticatorSource(aaguid)
  if (!source) return undefined
  return iconForSourceName(source)
}

export function isCustomPasskeyName(
  storedName: string | null | undefined,
  aaguid: string | null | undefined
) {
  const stored = storedName?.trim()
  if (!stored) return false
  const source = getPasskeyAuthenticatorSource(aaguid)
  if (source && stored === source) return false
  if (source && stored === localizeAuthenticatorName(source)) return false
  return true
}
