---
title: Considerations
description: 
layout: ../layouts/MainLayout.astro
---

`jampack` is meant to be used with your static website as is with no particular changes but here are some things you can do to help it extract the best performance of your pages.

### Add `loading="eager"` to your images above the fold

`jampack` sets all images to lazy by default. But, [images above the fold should not be lazy](https://web.dev/lazy-loading-images/#effects-on-largest-contentful-paint-lcp). Just add `loading="eager"` to your images above the fold and `jampack` will treat them as high priority.
