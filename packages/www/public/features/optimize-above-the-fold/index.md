---
title: "Optimize above the fold"
jampack: "--onlyoptim"
---

`jampack` can do extra optimizations to content and assets above the fold.

## How is the fold positionned?

The fold position is determined by the following:
- At the tag `<the-fold>` if present (recommended)
- OR, at the tag `<main>` + 5,000 bytes, if tag `<main>` is present.
- OR, at the tag `<body>` + 10,000 bytes, if tag `<body>` is present.

> Nothing will be treated as above-the-fold if none of the tags above have been found.

The tag `<the-fold>` should be placed in your HTML pages where you think the fold will be.
The tag `<the-fold>` will be removed from the final output.

## What is done differently above-the-fold?

`jampack` will prioritize content and assets above the fold:

- Images will be eagerly loaded: no `loading="lazy"` attribute.
- Images will have higher priority: set `fetchpriority="high"` attribute.
- [Small images will be embed in HTML](/features/embed-small-images/)

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
