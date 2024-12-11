---
title: Video
jampack: "--onlyoptim"
---

`jampack` optimize videos below [the fold](/features/optimize-above-the-fold/).

## Autoplay videos

Videos below the fold with attribute `autoplay` are lazy loaded using JavaScript.

## Click-to-play videos

Videos without `autoplay` and with a `poster` get a `preload="none"` attribute to postpone the loading of the video until user request.

As of today, `jampack` doesn't automatically create posters for video. It's a TODO.
