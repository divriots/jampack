export type ImageFormat = 'webp' | 'svg' | 'jpg' | 'png' | 'avif' | undefined

export type Image = {
  format: ImageFormat
  data: Buffer
}
