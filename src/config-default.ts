import { Options } from './config-types.js';

const default_options: Options = {
  html: {
    add_css_reset_as: 'inline',
  },
  css: {
    inline_critical_css: false, // Doesn't work yet
  },
  js: {
    compressor: 'esbuild',
  },
  image: {
    embed_size: 1500,
    srcset_min_width: 390 * 2, // HiDPI phone
    srcset_max_width: 1920 * 2, // 4K
    max_width: 99999,
    external: {
      process: 'off',
      src_include: /^.*$/,
      src_exclude: null,
    },
    compress: true,
    jpeg: {
      options: {
        quality: 75,
        mozjpeg: true,
      },
    },
    png: {
      options: {
        compressionLevel: 9,
      },
    },
    webp: {
      options_lossless: {
        effort: 4,
        quality: 77,
        mode: 'lossless',
      },
      options_lossly: {
        effort: 4,
        quality: 77,
        mode: 'lossly',
      },
    },
    svg: {
      optimization: true,
    },
  },
  misc: {
    prefetch_links: 'off',
  },
};

export default default_options;
