export type CaptureMode = 'single' | 'booth3';

export function resolveCaptureMode(value: string | string[] | undefined) {
  if (value === undefined) return 'hub' as const;
  if (value === 'single' || value === 'booth3') return value;
  return 'invalid' as const;
}
