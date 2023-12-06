<div>

```
     __                                    __    
    |__|____    _____ ___________    ____ |  | __
    |  \__  \  /     \\____ \__  \ _/ ___\|  |/ /
    |  |/ __ \|  Y Y  \  |_> > __ \\  \___|    < 
/\__|  (____  /__|_|  /   __(____  /\___  >__|_ \
\______|    \/      \/|  |       \/     \/     \/
                      |__|
```

</div>

[![npm version](https://img.shields.io/npm/v/@divriots/jampack)](https://npmjs.org/package/@divriots/jampack) 
[![Discord](https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord)](https://discord.gg/XkQxSU9)

# Jampack

Optimizes static websites for best user experience and best Core Web Vitals scores.

<div id="banner">
  <div>Brought to you by</div>
  <a href="https://divRIOTS.com#gh-light-mode-only">
    <img width="150" height="40" src="https://divRIOTS.com/divriots.svg" alt="‹div›RIOTS" />
  </a>
  <a href="https://divRIOTS.com#gh-dark-mode-only">
    <img width="150" height="40" src="https://divRIOTS.com/divriots-dark.svg" alt="‹div›RIOTS" />
  </a>
</div>

## What is `jampack`?

> Not a bundler. Not a framework.

`jampack` is a post-processing tool that takes the output of your [Static Site Generator (aka SSG)](https://jamstack.org/generators/) and optimizes it for best user experience and best [Core Web Vitals](https://web.dev/learn-core-web-vitals/) scores.

[Read the introduction blog post](https://divriots.com/blog/introducing-jampack/)

## What can `jampack` do?

### `<img>`

```html
<img src="./redpanda.jpg" alt="Red panda">
```

becomes responsive with dimensions:

```html
<img src="./redpanda.jpg.webp" alt="Red panda" 
     srcset="
     ./redpanda.jpg.webp 3872w, ./redpanda@3572w.jpg.webp 3572w, ./redpanda@3272w.jpg.webp 3272w, 
     ./redpanda@2972w.jpg.webp 2972w, ./redpanda@2672w.jpg.webp 2672w, ./redpanda@2372w.jpg.webp 2372w,
     ./redpanda@2072w.jpg.webp 2072w, ./redpanda@1772w.jpg.webp 1772w, ./redpanda@1472w.jpg.webp 1472w,
     ./redpanda@1172w.jpg.webp 1172w, ./redpanda@872w.jpg.webp 872w"
     sizes="100vw"
     loading="lazy"
     decoding="async"
     width="3872" 
     height="2592">
```

### `<picture>`

```html
<picture>
    <img src="./redpanda.jpg" alt="Red panda">
</picture>
```

becomes responsive with multiple formats including AVIF:

```html
<picture>
    <source type="image/avif" 
            srcset="./redpanda@1936w.avif 1936w, ./redpanda@1636w.avif 1636w,
                    ./redpanda@1336w.avif 1336w, ./redpanda@1036w.avif 1036w,
                    ./redpanda@736w.avif 736w">
    <source type="image/webp" 
            srcset="./redpanda@1936w.webp 1936w, ./redpanda@1636w.webp 1636w,
                    ./redpanda@1336w.webp 1336w, ./redpanda@1036w.webp 1036w,
                    ./redpanda@736w.webp 736w">
    <img src="./redpanda.jpg" 
         alt="Red panda" 
         loading="lazy" 
         decoding="async" 
         width="1936" 
         height="1296" 
         srcset="./redpanda.jpg 1936w, ./redpanda@1636w.jpg 1636w,
                 ./redpanda@1336w.jpg 1336w, ./redpanda@1036w.jpg 1036w,
                 ./redpanda@736w.jpg 736w"
         sizes="100vw">
</picture>
```

[Read more](/features/optimize-images)

### CDN images become responsive

```html
<img
      src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt="Clouds in the sky by Taylor Van Riper"
      width="2848"
      height="4272"
    />
```

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

[Read more](/features/optimize-images-cdn)

### External images can be downloaded and optimized

```html
<img
     src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=jpg&fit=crop&w=1287&q=80"
     alt="Clouds in the sky by Taylor Van Riper"
/>
```

becomes

```html
<img
     src="_jampack/ab99b9d280ce4cf7cfc810b59f3a7739.jpg.webp"
     alt="Clouds in the sky by Taylor Van Riper"
     loading="lazy"
     decoding="async"
     width="1287"
     height="1931"
     srcset="
        _jampack/ab99b9d280ce4cf7cfc810b59f3a7739.jpg.webp  1287w,
        _jampack/ab99b9d280ce4cf7cfc810b59f3a7739@987w.webp  987w,
        _jampack/ab99b9d280ce4cf7cfc810b59f3a7739@687w.webp  687w
     "
     sizes="100vw"
    />
```

[Read more](/features/optimize-images-external)

### Above & below-the-fold

`jampack` optimizes assets above-the-fold ⬆️.

- Images are loaded with higher priority.
- Images are compress as Progressive JPEG.
- Small images are embedded in HTML.

Lazy-load assets below-the-fold ⬇️.

- Images and Iframes are lazy loaded.

[Read more](https://jampack.divriots.com/features/optimize-above-the-fold/)

## Inline critical CSS

Avoid [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) while stylesheets are downloaded and parsed.
`jampack` will inline critical CSS and lazy-load the rest of CSS.

[Read more](https://jampack.divriots.com/features/inline-critical-css/)

## Prefetch links

Speedup the future page navigations by prefetching the links on the page.
Thanks to [quicklink](https://github.com/GoogleChromeLabs/quicklink), this can be done dynamically as links enter the viewport.

[Read more](https://jampack.divriots.com/features/prefetch-links/)

### All assets are compressed

In a 2nd PASS, `jampack` compresses all untouched assets and keep the same name and the same format.

| Extension       | Compressor            | 
| --------------- | --------------------- | 
| `.html`,`.htm`  | [`html-minifier-terser`](https://github.com/terser/html-minifier-terser) |   
| `.css`          | [`lightningCSS`](https://lightningcss.dev)  |
| `.js`           | [`esbuild`](https://esbuild.github.io/) or [`swc`](https://swc.rs/)                   |   
| `.svg`          | [`svgo`](https://github.com/svg/svgo)                  |  
| `.jpg`,`.jpeg`  | [`sharp`](https://sharp.pixelplumbing.com/)                 |  
| `.png`          | [`sharp`](https://sharp.pixelplumbing.com/)                |    
| `.webp`         | [`sharp`](https://sharp.pixelplumbing.com/)                 |  
| `.avif`         | [`sharp`](https://sharp.pixelplumbing.com/)                 |  

### [And a lot more!](https://jampack.divriots.com/)


## Quick use

```sh
# Optimize static website in `dist` folder
npx @divriots/jampack ./dist
```

For more options see [CLI options](https://jampack.divriots.com/cli-options/).

## `jampack` used in the wild

- [divRIOTS.com](https://divRIOTS.com)
- [Backlight.dev](https://backlight.dev)
- [story.to.design](https://story.to.design)
- [html.to.design](https://html.to.design/docs)
- [WebComponents.dev](https://WebComponents.dev)
- [LWC.studio](https://lwc.studio)
- [Components.studio](https://components.studio)
- [keycloak.ch](https://keycloak.ch)
- [bayjs.org](https://bayjs.org/)
- [qwind.pages.dev](https://qwind.pages.dev/)
- [Bloycey's Blog](https://bloycey.blog/)
- [gxanshu.in](https://gxanshu.in/)
  
> Add yours here

## Why is it called `jampack`?

- `jam`: From [Jamstack](https://en.wikipedia.org/wiki/Jamstack).
- `pack`: Reminescent of the [Executable Packers](https://en.wikipedia.org/wiki/Executable_compression#List_of_executable_packers) from the 90s.

## License

This software is released under the terms of the [MIT license](https://github.com/divriots/jampack/blob/main/LICENSE).
