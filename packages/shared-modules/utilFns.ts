
export function extractMessageFromCatch(e: unknown, fallbackMessage?: string) {
  if (e instanceof Error) {
    return e.message;
  } else if (typeof e === 'string') {
    return e;
  } else if (fallbackMessage) {
    return fallbackMessage;
  }
  return 'there was an error!'
}

// export function slugifyString(text: string) {

// }
