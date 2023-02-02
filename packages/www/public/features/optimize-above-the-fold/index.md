---
title: "Optimize above the fold"
jampack: "--onlyoptim"
---

`jampack` can do extra optimizations to content and assets above the fold.

The fold position is determined by the following:
- At the tag `<the-fold>` if present (recommended)
- At the tag `<main>` + 5,000 bytes.
- At the tag `<body>` + 10,000 bytes.

> Nothing will be treated as above-the-fold if none of the tags above have been found.

The tag `<the-fold>` should be placed in your HTML pages where you think the fold will be.
The tag `<the-fold>` will be removed from the final output.

`jampack` will prioritize content and assets above the fold:

- Images will be eagerly loaded: no `loading="lazy"` attribute.
- Images will have higher priority: set `fetchpriority="high"` attribute.
- Images will be converted to [`JPEG` progressive](https://www.thewebmaster.com/progressive-jpegs/) which provide better user experience for content above the fold.
- Images with alpha (aka transparency) will not be converted to [`JPEG` progressive](https://www.thewebmaster.com/progressive-jpegs/) because this format doesn't support alpha. Image will be converted to WebP instead.

## Recommended use

```html
> index.html 
... 
... content above the fold 
...
<the-fold></the-fold>
... 
... content below the fold 
...
```
