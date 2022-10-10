export type ImageFormat = 'webp' | 'svg' | 'jpg' | 'png' | undefined;

export type Image = {
  format: ImageFormat,
  data: Buffer;
}

