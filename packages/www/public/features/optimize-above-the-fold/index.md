---
title: "Optimize above the fold"
jampack: "--onlyoptim"
---

`jampack` can do extra optimizations to content and assets above the fold if the tag `<the-fold>` is added in your HTML.

The tag `<the-fold>` should be placed in your HTML pages where you think the fold will be.

`jampack` will prioritize content and assets above `<the-fold>`:

- Images will be eagerly loaded: no `loading="lazy"` attribute.
- Images will have higher priority: set `fetchpriority="high"` attribute.
- Images will be converted to [`jpeg` progressive](https://www.thewebmaster.com/progressive-jpegs/) which provide better user experience for content above the fold.
- Images with alpha (aka transparency) will not be converted to [`jpeg` progressive](https://www.thewebmaster.com/progressive-jpegs/) because this format doesn't support alpha. Image will be converted to WebP instead.

The `<the-fold>` tag will be removed from the final output.

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
