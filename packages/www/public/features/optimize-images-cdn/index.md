---
title: 'Optimize CDN images'
jampack: '--onlyoptim'
---

`jampack` can optionally optimizes CDN images for faster download on any device and better [Core Web Vitals](https://web.dev/learn-core-web-vitals/) scores.

`jampack` will use the transform capabilities of the CDN to resize the images for the srcsets. This doesn't require any download of the images.

## Supported CDN providers

- Adobe Dynamic Media (Scene7)
- Builder.io
- Bunny.net
- Cloudflare
- Contentful
- Cloudinary
- Directus
- Imgix
- Unsplash
- DatoCMS
- Sanity
- Prismic
- Kontent.ai
- Netlify
- Shopify
- Storyblok
- Vercel / Next.js
- WordPress.com and Jetpack Site Accelerator

> This feature is powered by [unpic](https://unpic.pics/) to detect and transform URLs. See [unpic's GitHub project](https://github.com/ascorbic/unpic) for more details.

## Configuration

```js
image: {
    cdn: {
      process: 'off' | 'optimize',
    },
}
```

| process: | Description |
|-----------|-------------|
| `'off'` | It will ignore cdn images and treat them as [external images](/features/features/optimize-images-external). |
| `'optimize'` | It will detect external images as coming from CDN and generate srcsets images url on the CDN. |

## Example

`<img>` and `<picture>` elements with CDN images like:

```html
<img
      src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt="Clouds in the sky by Taylor Van Riper"
      width="2848"
      height="4272"
    />
```

> For the moment, `width` and `height` image attributes are mandatory for `jampack` to work CDN images.

becomes

```html
<img
      src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt="Clouds in the sky by Taylor Van Riper"
      width="2848"
      height="4272"
      loading="lazy"
      decoding="async"
      srcset="
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=2848&amp;fit=min&amp;auto=format 2848w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=2548&amp;fit=min&amp;auto=format 2548w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=2248&amp;fit=min&amp;auto=format 2248w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=1948&amp;fit=min&amp;auto=format 1948w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=1648&amp;fit=min&amp;auto=format 1648w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=1348&amp;fit=min&amp;auto=format 1348w,
        https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;w=1048&amp;fit=min&amp;auto=format 1048w
      "
      sizes="100vw"
    />
```

