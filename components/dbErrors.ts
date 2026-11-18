// Server functions raise errors as "CODE|Friendly message".
// Show customers only the friendly part.
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const msg = (err as { message?: string } | null)?.message;
  if (typeof msg === "string" && msg.includes("|")) {
    return msg.split("|").slice(1).join("|").trim() || fallback;
  }
  return fallback;
}

export function errorCode(err: unknown): string | null {
  const msg = (err as { message?: string } | null)?.message;
  if (typeof msg === "string" && msg.includes("|")) return msg.split("|")[0].trim();
  return null;
}
