import type { UrlTransformer } from 'unpic';

export type WebpOptions = {
  effort: number;
  mode: 'lossless' | 'lossly';
  quality: number;
};

export type Options = {
  general: {
    browserslist: string; // browserslist query string
  };
  html: {
    /*
      jampack adds a little bit of css to make
      image keep correct aspect ratio after adding
      image dimensions.
      ":where(img){height:auto}"
    */
    add_css_reset_as: 'inline' | 'off';
    sort_attributes: boolean;
  };
  js: {
    compressor: 'esbuild' | 'swc'; // swc have smaller result but can break code (seen with SvelteKit code)
  };
  css: {
    inline_critical_css: boolean;
    browserslist?: string; // If present, overrides general.browserslist just for CSS
  };
  image: {
    embed_size: number; // Embed above the fold images if size < embed_size
    srcset_min_width: number; // Minimum width of generate image in srcset
    srcset_max_width: number; // Maximum width of generate image in srcset
    srcset_step: number; // Number of pixels between sizes in srcset
    max_width: number; // Maximum width of original images - if bigger => resized output
    src_include: RegExp;
    src_exclude: RegExp | null;
    external: {
      process:
        | 'off' // Default
        | 'download' // Experimental
        | ((attrib_src: string) => Promise<string>); // Experimental
      src_include: RegExp;
      src_exclude: RegExp | null;
    };
    cdn: {
      process:
        | 'off' //default
        | 'optimize';
      src_include: RegExp | null;
      src_exclude: RegExp | null;
      transformer?: UrlTransformer; // Custom 'unpic' cdn url transformer, if not present it will be determined by 'unpic' based on original url
    };
    compress: boolean;
    jpeg: {
      options: {
        quality: number;
        mozjpeg: boolean;
      };
    };
    png: {
      options: {
        compressionLevel: number;
      };
    };
    webp: {
      options_lossless: WebpOptions;
      options_lossly: WebpOptions;
    };
    svg: {
      optimization: boolean;
      add_width_and_height: boolean;
    };
  };
  misc: {
    prefetch_links: 'in-viewport' | 'off';
  };
};
