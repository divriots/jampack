---
title: 'Optimize external images (Experimental)'
jampack: '--onlyoptim'
---

`jampack` can optionally optimizes external images for faster download on any device and better [Core Web Vitals](https://web.dev/learn-core-web-vitals/) scores.

This is controled by configuration:

```js
image: {
    external: {
      process: 'off' | 'download',
    },
}
```

| process: | Description |
|-----------|-------------|
| `'off'` | It will ignore external images and only [optimize local images](/features/optimize-images/). |
| `'download'` | It will download external images [optimize them like local images](/features/optimize-images/). |

`<img>` and `<picture>` elements with external images like:

```html
<img
     src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=jpg&fit=crop&w=1287&q=80"
     alt="Clouds in the sky by Taylor Van Riper"
/>
```

becomes

```html
<img
     src="/_jampack/ab99b9d280ce4cf7cfc810b59f3a7739.jpg.webp"
     alt="Clouds in the sky by Taylor Van Riper"
     loading="lazy"
     decoding="async"
     width="1287"
     height="1931"
     srcset="
        /_jampack/ab99b9d280ce4cf7cfc810b59f3a7739.jpg.webp  1287w,
        /_jampack/ab99b9d280ce4cf7cfc810b59f3a7739@987w.webp  987w,
        /_jampack/ab99b9d280ce4cf7cfc810b59f3a7739@687w.webp  687w
     "
     sizes="100vw"
    />
```
