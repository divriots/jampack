import * as url from 'url'
import * as path from 'path'
import * as fs from 'fs/promises'
import { fileTypeFromBuffer, FileExtension, MimeType } from 'file-type'
import sharp from 'sharp'

type ImageMeta = {
  width: number | undefined
  height: number | undefined
  isProgressive: boolean
  hasAlpha: boolean
}

/**
 * File extension, mime and data are loaded only on demand, then cached.
 */
export class Resource {
  public readonly src: string
  public readonly filePathAbsolute: string
  private ext: FileExtension | 'svg' | undefined
  private mime: MimeType | 'image/svg+xml' | undefined
  private data: Buffer | undefined
  private image_meta: ImageMeta | null | undefined

  constructor(src: string, filePathAbsolute: string) {
    this.src = src
    this.filePathAbsolute = filePathAbsolute
  }

  public async getData(): Promise<Buffer> {
    if (this.data === undefined) {
      this.data = await fs.readFile(this.filePathAbsolute)
    }

    return this.data
  }

  public async getImageMeta() {
    if (this.image_meta === undefined) {
      const ext = await this.getExt()
      switch (ext) {
        case 'svg':
        case 'gif':
        case 'jpg':
        case 'png':
        case 'webp':
        case 'tif':
        case 'avif':
          let sharpFile = await sharp(await this.getData(), { animated: true })
          const meta = await sharpFile.metadata()
          this.image_meta = {
            width: meta.width,
            height: meta.height,
            isProgressive: meta.isProgressive || false,
            hasAlpha: meta.hasAlpha || false,
          }
          break
      }
    }

    if (!this.image_meta) {
      console.log(await this.getExt())
    }

    return this.image_meta
  }

  public async getLen(): Promise<number> {
    return (await this.getData()).length
  }

  public async getExt(): Promise<FileExtension | 'svg'> {
    if (this.ext === undefined) {
      await this.loadFileType()
    }

    return this.ext!
  }

  public async getMime(): Promise<MimeType | 'image/svg+xml'> {
    if (this.mime === undefined) {
      await this.loadFileType()
    }

    return this.mime!
  }

  private async loadFileType() {
    const fileType = await fileTypeFromBuffer(await this.getData())
    if (this.filePathAbsolute.endsWith('.svg')) {
      this.ext = 'svg'
      this.mime = 'image/svg+xml'
    } else if (fileType) {
      this.ext = fileType.ext
      this.mime = fileType.mime
    } else {
      throw new Error(`Unknown file type "${this.src}"`)
    }
  }

  static async loadResource(
    projectRoot: string,
    relativeFile: string,
    src: string
  ): Promise<Resource | undefined> {
    if (!isLocal(src)) {
      throw new Error('src should be local')
    }

    const u = url.parse(src)

    if (!u.pathname) {
      throw new Error(`Invalid src format "${src}"`)
    }

    const relativePath = path.join(
      projectRoot,
      src.startsWith('/') ? '' : path.dirname(relativeFile),
      u.pathname
    )
    let absolutePath = path.resolve(relativePath)

    if (await fileExists(absolutePath)) {
      return new Resource(src, absolutePath)
    }

    return undefined
  }
}

export function isLocal(src: string) {
  const u = url.parse(src)
  return !u.host
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path)
  } catch (e) {
    return false
  }
  return true
}

export function translateSrc(
  projectRoot: string,
  htmlRelativePath: string,
  src: string
) {
  if (!isLocal(src)) {
    throw new Error('Source should be local')
  }

  const srcAbsolutePath = path.join(
    projectRoot,
    src.startsWith('/') ? '' : htmlRelativePath,
    src
  )

  return path.resolve(srcAbsolutePath)
}
