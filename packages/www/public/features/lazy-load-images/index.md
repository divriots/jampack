---
title: "Lazy load images"
jampack: "--onlyoptim"
---

`jampack` will set all images to load in lazy by default. This gives the client browser the opportunity to load more critical data.

Images will have new attributes:
- `loading="lazy"`
- `decoding="async"`

## Exceptions

Images will not be lazy loaded in the following conditions:

- Image as attribute `loading="eager"`. Explicitly requesting for no lazy loading.
- Image is marked [above the fold](../optimize-above-the-fold/).

⚠️ [Lazy loading images above the fold can cause LCP issues](https://web.dev/lazy-loading-images/#effects-on-largest-contentful-paint-lcp),
we recommend to use the `jampack`'s [`<the-fold>` feature](../optimize-above-the-fold/) or mark images with `loading="eager"` when they are above the fold.

