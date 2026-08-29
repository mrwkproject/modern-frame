export type FrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
};

export type FramePhotoSlot = FrameRect & {
  id: string;
  kind: 'photo';
  slotIndex: number;
  cornerRadius?: number;
};

export type FrameShapeElement = FrameRect & {
  id: string;
  kind: 'shape';
  fill: string;
  cornerRadius?: number;
};

export type FrameBorderElement = FrameRect & {
  id: string;
  kind: 'border';
  color: string;
  lineWidth: number;
  cornerRadius?: number;
};

export type FrameTextElement = FrameRect & {
  id: string;
  kind: 'text';
  content: 'event-name' | 'brand' | 'literal';
  value?: string;
  color: string;
  fontFamily: 'serif' | 'sans-serif';
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700;
  lineHeight: number;
  maxLines: number;
  align: 'left' | 'center' | 'right';
};

export type FrameElement =
  FrameShapeElement | FrameBorderElement | FrameTextElement;

export type FrameTemplate = {
  id: string;
  name: string;
  description: string;
  canvas: { width: number; height: number };
  background: { color: string };
  photoSlots: FramePhotoSlot[];
  elements: FrameElement[];
};

export type LocalComposition = {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  templateId: string;
};

export type CompositionContent = {
  eventName: string;
};
