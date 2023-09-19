import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileTypeFromBuffer, FileExtension, MimeType } from 'file-type';
import sharp from 'sharp';
import { AllImageFormat, ImageFormat } from '../compressors/images.js';

type ImageMeta = {
  width: number | undefined;
  height: number | undefined;
  isProgressive: boolean;
  isOpaque: boolean;
  isLossless: boolean;
};

/**
 * File extension, mime and data are loaded only on demand, then cached.
 */
export class Resource {
  public readonly src: string;
  public readonly filePathAbsolute: string;
  private ext: FileExtension | 'svg' | undefined;
  private mime: MimeType | 'image/svg+xml' | undefined;
  private data: Buffer | undefined;
  private image_meta: ImageMeta | null | undefined;

  constructor(src: string, filePathAbsolute: string) {
    this.src = src;
    this.filePathAbsolute = filePathAbsolute;
  }

  public async getData(): Promise<Buffer> {
    if (this.data === undefined) {
      this.data = await fs.readFile(this.filePathAbsolute);
    }

    return this.data;
  }

  public async getImageMeta() {
    if (this.image_meta === undefined) {
      const ext = await this.getExt();
      let isLossless = false;
      switch (ext) {
        case 'svg':
        case 'gif':
        case 'png':
        case 'tif':
          isLossless = true;
        case 'webp':
          if (!isLossless) {
            try {
              // TODO check if webp is lossless
              // const info = await WebPInfo.from(await this.getData());
              // isLossless = info.summary.isLossless;
            } catch (e) {
              console.warn('Failed to get WebP info');
            }
          }
        case 'avif':
        // TODO
        // Check for lossless avif
        case 'jpg':
          let sharpFile = await sharp(await this.getData(), { animated: true });
          const meta = await sharpFile.metadata();
          const stats = await sharpFile.stats();

          this.image_meta = {
            width: meta.width,
            height: meta.height,
            isProgressive: meta.isProgressive || false,
            isOpaque: stats.isOpaque,
            isLossless,
          };
          break;
      }
    }

    if (!this.image_meta) {
      console.log(await this.getExt());
    }

    return this.image_meta;
  }

  public async getLen(): Promise<number> {
    return (await this.getData()).length;
  }

  public async getExt(): Promise<FileExtension | 'svg'> {
    if (this.ext === undefined) {
      await this.loadFileType();
    }

    return this.ext!;
  }

  public async getImageFormat(): Promise<ImageFormat | undefined> {
    const ext = (await this.getExt()) as string;
    if (AllImageFormat.includes(ext)) return ext as ImageFormat;
    return undefined;
  }

  public async getMime(): Promise<MimeType | 'image/svg+xml'> {
    if (this.mime === undefined) {
      await this.loadFileType();
    }

    return this.mime!;
  }

  private async loadFileType() {
    const fileType = await fileTypeFromBuffer(await this.getData());
    if (this.filePathAbsolute.endsWith('.svg')) {
      this.ext = 'svg';
      this.mime = 'image/svg+xml';
    } else if (fileType) {
      this.ext = fileType.ext;
      this.mime = fileType.mime;
    } else {
      throw new Error(`Unknown file type "${this.src}"`);
    }
  }

  static async loadResource(
    projectRoot: string,
    relativeFile: string,
    src: string
  ): Promise<Resource | undefined> {
    if (!isLocal(src)) {
      throw new Error('src should be local');
    }

    const u = url.parse(src);

    if (!u.pathname) {
      throw new Error(`Invalid src format "${src}"`);
    }

    const relativePath = path.join(
      projectRoot,
      src.startsWith('/') ? '' : path.dirname(relativeFile),
      u.pathname
    );
    let absolutePath = path.resolve(relativePath);

    if (await fileExists(absolutePath)) {
      return new Resource(src, absolutePath);
    }

    return undefined;
  }
}

export function isLocal(src: string) {
  const u = url.parse(src);
  return !u.host;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
  } catch (e) {
    return false;
  }
  return true;
}

export function translateSrc(
  projectRoot: string,
  htmlRelativePath: string,
  src: string
) {
  if (!isLocal(src)) {
    throw new Error('Source should be local');
  }

  const srcAbsolutePath = path.join(
    projectRoot,
    src.startsWith('/') ? '' : htmlRelativePath,
    src
  );

  return path.resolve(srcAbsolutePath);
}
