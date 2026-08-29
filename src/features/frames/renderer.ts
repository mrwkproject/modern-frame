import {
  calculateSlotCoverCrop,
  fitTextLines,
  scaleFrameRect,
} from '@/features/frames/helpers';
import type { LocalCapture } from '@/features/camera/types';
import type {
  CompositionContent,
  FrameElement,
  FramePhotoSlot,
  FrameRect,
  FrameTemplate,
  LocalComposition,
} from '@/features/frames/types';

type RenderOptions = {
  outputWidth?: number;
  quality?: number;
};

type RenderFrameInput = {
  captures: readonly LocalCapture[];
  template: FrameTemplate;
  content: CompositionContent;
  options?: RenderOptions;
};

export function resolveCaptureForSlot(
  captures: readonly LocalCapture[],
  slotIndex: number,
) {
  const capture = captures[slotIndex];
  if (!capture) throw new Error(`MISSING_CAPTURE_FOR_SLOT_${slotIndex}`);
  return capture;
}

export function resolveFrameCaptures(
  captures: readonly LocalCapture[],
  template: FrameTemplate,
) {
  const resolved = new Map<number, LocalCapture>();
  for (const slot of template.photoSlots) {
    resolved.set(
      slot.slotIndex,
      resolveCaptureForSlot(captures, slot.slotIndex),
    );
  }
  return resolved;
}

function loadLocalImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('FRAME_SOURCE_LOAD_FAILED'));
    image.src = source;
  });
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 0,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function withRotation(
  context: CanvasRenderingContext2D,
  rect: FrameRect,
  scale: number,
  draw: () => void,
) {
  const rotation = rect.rotation ?? 0;
  if (!rotation) return draw();
  const scaled = scaleFrameRect(rect, scale);
  const centerX = scaled.x + scaled.width / 2;
  const centerY = scaled.y + scaled.height / 2;
  context.save();
  context.translate(centerX, centerY);
  context.rotate((rotation * Math.PI) / 180);
  context.translate(-centerX, -centerY);
  draw();
  context.restore();
}

function drawPhotoSlot(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: FramePhotoSlot,
  scale: number,
) {
  const target = scaleFrameRect(slot, scale);
  const crop = calculateSlotCoverCrop(
    image.naturalWidth,
    image.naturalHeight,
    target.width,
    target.height,
  );
  withRotation(context, slot, scale, () => {
    context.save();
    roundedRectPath(
      context,
      target.x,
      target.y,
      target.width,
      target.height,
      (slot.cornerRadius ?? 0) * scale,
    );
    context.clip();
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      target.x,
      target.y,
      target.width,
      target.height,
    );
    context.restore();
  });
}

function getTextContent(
  element: Extract<FrameElement, { kind: 'text' }>,
  content: CompositionContent,
) {
  if (element.content === 'event-name') return content.eventName;
  if (element.content === 'brand') return 'MODERN FRAME';
  return element.value ?? '';
}

function drawElement(
  context: CanvasRenderingContext2D,
  element: FrameElement,
  content: CompositionContent,
  scale: number,
) {
  const target = scaleFrameRect(element, scale);
  withRotation(context, element, scale, () => {
    if (element.kind === 'shape') {
      roundedRectPath(
        context,
        target.x,
        target.y,
        target.width,
        target.height,
        (element.cornerRadius ?? 0) * scale,
      );
      context.fillStyle = element.fill;
      context.fill();
      return;
    }
    if (element.kind === 'border') {
      const inset = (element.lineWidth * scale) / 2;
      roundedRectPath(
        context,
        target.x + inset,
        target.y + inset,
        target.width - inset * 2,
        target.height - inset * 2,
        (element.cornerRadius ?? 0) * scale,
      );
      context.strokeStyle = element.color;
      context.lineWidth = element.lineWidth * scale;
      context.stroke();
      return;
    }
    const family =
      element.fontFamily === 'serif'
        ? 'Georgia, Times New Roman, serif'
        : 'Arial, Helvetica, sans-serif';
    context.font = `${element.fontWeight} ${element.fontSize * scale}px ${family}`;
    context.fillStyle = element.color;
    context.textAlign = element.align;
    context.textBaseline = 'top';
    const text = getTextContent(element, content);
    const lines = fitTextLines(
      text,
      target.width,
      element.maxLines,
      (candidate) => context.measureText(candidate).width,
    );
    const x =
      element.align === 'left'
        ? target.x
        : element.align === 'right'
          ? target.x + target.width
          : target.x + target.width / 2;
    lines.forEach((line, index) => {
      const y = target.y + index * element.lineHeight * scale;
      if (y + element.fontSize * scale <= target.y + target.height) {
        context.fillText(line, x, y, target.width);
      }
    });
  });
}

export async function renderFrameComposition(
  input: RenderFrameInput,
): Promise<LocalComposition> {
  const { captures, template, content, options = {} } = input;
  const requiredCaptures = resolveFrameCaptures(captures, template);
  const outputWidth = options.outputWidth ?? template.canvas.width;
  const scale = outputWidth / template.canvas.width;
  const outputHeight = Math.round(template.canvas.height * scale);
  if (outputWidth <= 0 || outputHeight <= 0) {
    throw new Error('INVALID_COMPOSITION_DIMENSIONS');
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outputWidth);
  canvas.height = outputHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('COMPOSITION_CONTEXT_UNAVAILABLE');
  context.fillStyle = template.background.color;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const imageBySlot = new Map<number, HTMLImageElement>();
  const imageBySource = new Map<string, Promise<HTMLImageElement>>();
  await Promise.all(
    [...requiredCaptures].map(async ([slotIndex, capture]) => {
      const pendingImage =
        imageBySource.get(capture.objectUrl) ??
        loadLocalImage(capture.objectUrl);
      imageBySource.set(capture.objectUrl, pendingImage);
      imageBySlot.set(slotIndex, await pendingImage);
    }),
  );
  const drawables = [
    ...template.photoSlots.map((slot) => ({
      kind: 'slot' as const,
      value: slot,
    })),
    ...template.elements.map((element) => ({
      kind: 'element' as const,
      value: element,
    })),
  ].sort((first, second) => first.value.zIndex - second.value.zIndex);
  for (const drawable of drawables) {
    if (drawable.kind === 'slot') {
      const image = imageBySlot.get(drawable.value.slotIndex);
      if (!image)
        throw new Error(`MISSING_CAPTURE_FOR_SLOT_${drawable.value.slotIndex}`);
      drawPhotoSlot(context, image, drawable.value, scale);
    } else drawElement(context, drawable.value, content, scale);
  }

  const quality = options.quality ?? 0.92;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result || result.size === 0) {
          reject(new Error('COMPOSITION_ENCODING_FAILED'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      quality,
    );
  });
  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    mimeType: 'image/jpeg',
    templateId: template.id,
  };
}
