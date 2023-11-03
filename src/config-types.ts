export type WebpOptions = {
  effort: number;
  mode: 'lossless' | 'lossly';
  quality: number;
};

export type Options = {
  html: {
    /*
      jampack adds a little bit of css to make
      image keep correct aspect ratio after adding
      image dimensions.
      ":where(img){height:auto}"
    */
    add_css_reset_as: 'inline' | 'off';
  };
  js: {
    compressor: 'esbuild' | 'swc'; // swc have smaller result but can break code (seen with SvelteKit code)
  };
  css: {
    inline_critical_css: boolean;
  };
  image: {
    embed_size: number; // Embed above the fold images if size < embed_size
    srcset_min_width: number; // Minimum width of generate image in srcset
    srcset_max_width: number; // Maximum width of generate image in srcset
    max_width: number; // Maximum width of original images - if bigger => resized output
    external: {
      process:
        | 'off' // Default
        | 'download'; // Experimental
      src_include: RegExp;
      src_exclude: RegExp | null;
    };
    cdn: {
      process:
        | 'off' //default
        | 'optimize';
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
    };
  };
  misc: {
    prefetch_links: 'in-viewport' | 'off';
  };
};
