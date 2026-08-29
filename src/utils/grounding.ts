export function safeGroundingSources(value: unknown): Array<{ title?: string; url?: string; snippet?: string }> {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap((source) => {
    if (!source || typeof source !== 'object') return [];
    try {
      const url = new URL(String((source as any).url || ''));
      if (url.protocol !== 'https:') return [];
      return [{
        title: typeof (source as any).title === 'string' ? (source as any).title.slice(0, 300) : undefined,
        url: url.toString(),
        snippet: typeof (source as any).snippet === 'string' ? (source as any).snippet.slice(0, 1000) : undefined,
      }];
    } catch {
      return [];
    }
  });
}
