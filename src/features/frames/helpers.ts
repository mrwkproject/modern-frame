export function calculateSlotCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  slotWidth: number,
  slotHeight: number,
) {
  if (
    [sourceWidth, sourceHeight, slotWidth, slotHeight].some(
      (value) => value <= 0,
    )
  ) {
    throw new Error('INVALID_FRAME_DIMENSIONS');
  }
  const sourceAspect = sourceWidth / sourceHeight;
  const slotAspect = slotWidth / slotHeight;
  if (sourceAspect > slotAspect) {
    const width = sourceHeight * slotAspect;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / slotAspect;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}

export function scaleFrameRect(
  rect: { x: number; y: number; width: number; height: number },
  scale: number,
) {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

export function fitTextLines(
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: (candidate: string) => number,
) {
  const normalized = text.replace(/\s+/g, ' ').trim() || 'Celebration';
  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === 0) lines.push(normalized);
  const consumed = lines.join(' ').length;
  if (
    consumed < normalized.length ||
    measure(lines[lines.length - 1]!) > maxWidth
  ) {
    let last = lines[lines.length - 1]!;
    while (last.length > 1 && measure(`${last}…`) > maxWidth)
      last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines.slice(0, maxLines);
}

export function createPhotoFilename(eventName: string, templateId: string) {
  const eventPart = eventName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  const safeTemplate = templateId.replace(/[^a-z0-9-]/g, '').slice(0, 48);
  return `${eventPart || 'event'}-${safeTemplate || 'frame'}-modern-frame.jpg`;
}
