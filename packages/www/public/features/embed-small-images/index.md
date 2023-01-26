---
title: 'Embed small images'
jampack: '--onlyoptim'
---

`jampack` embeds small images <400 bytes into `html` using [`data URIs`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs).

This removes a HTTP request that would be around 400 bytes just for the HTTP header anyway.
