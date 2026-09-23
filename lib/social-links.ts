export function toWhatsAppUrl(value?: string | null) {
  const digits = value?.replace(/\D/g, '') ?? '';
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return normalized.length >= 10 && normalized.length <= 15 ? `https://wa.me/${normalized}` : null;
}

export function toSafeExternalUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
