export type WebpOptions = {
    effort?: number;
    mode?: 'lossless' | 'lossly';
    quality?: number;
}

export type Options = {
    image : {
        embed_size: number;
        srcset_min_width: number;
        srcset_max_width: number;
        jpeg: {
            options?: {
                quality?: number;
                mozjpeg?: boolean;
            }
        },
        png: {
            options?: {
                compressionLevel?: number;
            }
        },
        webp: {
            options_lossless?: WebpOptions;
            options_lossly?: WebpOptions;
        }
    }
}

const default_options : Options = {
    image : {
        embed_size: 400,
        srcset_min_width: 400,
        srcset_max_width: 5120,
        jpeg: {
            options: {
                quality: 80,
                mozjpeg: true
            }
        },
        png: {
            options: {
                compressionLevel: 9,
            }
        },
        webp: {
            options_lossless: {
                effort: 4,
                quality: 80,
                mode: 'lossless'
            },
            options_lossly: {
                effort: 4,
                quality: 80,
                mode: 'lossly'
            }
        }
    }
}

export default default_options;
