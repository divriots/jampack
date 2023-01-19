export type WebpOptions = {
  effort: number;
  mode: "lossless" | "lossly";
  quality: number;
};

export type Options = {
  image: {
    embed_size: number;
    srcset_min_width: number;
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
  };
};

const default_options: Options = {
  image: {
    embed_size: 400,
    srcset_min_width: 400,
    compress: true,
    jpeg: {
      options: {
        quality: 80,
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
        quality: 80,
        mode: "lossless",
      },
      options_lossly: {
        effort: 4,
        quality: 80,
        mode: "lossly",
      },
    },
  },
};

const fast_options_override: {} = {
  image: {
    embed_size: 0,
    srcset_min_width: 16000,
    compress: false,
    jpeg: {
      options: {
        mozjpeg: false,
      },
    },
    png: {
      options: {
        compressionLevel: 0,
      },
    },
    webp: {
      options_lossless: {
        effort: 0,
      },
      options_lossly: {
        effort: 0,
      },
    },
  },
};

export function fast() {
  Object.assign(default_options, fast_options_override);
}

export default default_options;
