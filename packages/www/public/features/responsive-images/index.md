---
title: "Responsive images"
jampack: "--onlyoptim"
---

For images wider than 600px, `jampack` will generate a set of smaller images and set an [`img srcset`](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) in the `html` source file.

In other words, you can have a single image in your static site and `jampack` will create the different smaller versions to serve the most optimized image for the client device.

Images above the fold generate [progressives `jpeg`](https://www.thewebmaster.com/progressive-jpegs/) as described in the [above the fold optimization](../optimize-above-the-fold/).

## Processing

Responsive images are resized by shrinking width by steps of 300px while keeping aspect ratio.

Sometimes the resized image is bigger than the original image or the previous step because of aliasing or other compression properties. In this scenario the responsive image step is discarded.
