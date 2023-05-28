// Copied from https://github.com/etienne-martin/cache-control-parser (MIT licence)
// The npm package was not ESM - can't be used

export interface CacheControl {
  'max-age'?: number;
  's-maxage'?: number;
  'stale-while-revalidate'?: number;
  'stale-if-error'?: number;
  public?: boolean;
  private?: boolean;
  'no-store'?: boolean;
  'no-cache'?: boolean;
  'must-revalidate'?: boolean;
  'proxy-revalidate'?: boolean;
  immutable?: boolean;
  'no-transform'?: boolean;
}

const SUPPORTED_DIRECTIVES: (keyof CacheControl)[] = [
  'max-age',
  's-maxage',
  'stale-while-revalidate',
  'stale-if-error',
  'public',
  'private',
  'no-store',
  'no-cache',
  'must-revalidate',
  'proxy-revalidate',
  'immutable',
  'no-transform',
];

export const parse = (cacheControlHeader: string): CacheControl => {
  const cacheControl: CacheControl = {};

  const directives = cacheControlHeader
    .toLowerCase()
    .split(',')
    .map((str) =>
      str
        .trim()
        .split('=')
        .map((str) => str.trim())
    );

  for (const [directive, value] of directives) {
    switch (directive) {
      case 'max-age':
        const maxAge = parseInt(value, 10);

        if (isNaN(maxAge)) continue;

        cacheControl['max-age'] = maxAge;

        break;
      case 's-maxage':
        const sharedMaxAge = parseInt(value, 10);

        if (isNaN(sharedMaxAge)) continue;

        cacheControl['s-maxage'] = sharedMaxAge;
        break;
      case 'stale-while-revalidate':
        const staleWhileRevalidate = parseInt(value, 10);

        if (isNaN(staleWhileRevalidate)) continue;

        cacheControl['stale-while-revalidate'] = staleWhileRevalidate;
        break;
      case 'stale-if-error':
        const staleIfError = parseInt(value, 10);

        if (isNaN(staleIfError)) continue;

        cacheControl['stale-if-error'] = staleIfError;
        break;
      case 'public':
        cacheControl.public = true;
        break;
      case 'private':
        cacheControl.private = true;
        break;
      case 'no-store':
        cacheControl['no-store'] = true;
        break;
      case 'no-cache':
        cacheControl['no-cache'] = true;
        break;
      case 'must-revalidate':
        cacheControl['must-revalidate'] = true;
        break;
      case 'proxy-revalidate':
        cacheControl['proxy-revalidate'] = true;
        break;
      case 'immutable':
        cacheControl.immutable = true;
        break;
      case 'no-transform':
        cacheControl['no-transform'] = true;
        break;
    }
  }

  return cacheControl;
};

export const stringify = (cacheControl: CacheControl) => {
  const directives: string[] = [];

  for (const [key, value] of Object.entries(cacheControl)) {
    if (!SUPPORTED_DIRECTIVES.includes(key as keyof CacheControl)) continue;

    switch (typeof value) {
      case 'boolean':
        directives.push(`${key}`);
        break;
      case 'number':
        directives.push(`${key}=${value}`);
        break;
    }
  }

  return directives.join(', ');
};
