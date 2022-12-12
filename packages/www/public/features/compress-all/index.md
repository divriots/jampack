---
title: 'Compress all (PASS 2)'
jampack:
---

In a PASS 2, `jampack` compresses all untouched assets and keep the same name and the same format.

| Extension       | Compressor            | 
| --------------- | --------------------- | 
| `.html`,`.htm`  | [`html-minifier-terser`](https://github.com/terser/html-minifier-terser)  |   
| `.css`          | [`csso`](https://github.com/css/csso)                  |   
| `.js`           | [`swc`](https://swc.rs/)                   |   
| `.svg`          | [`svgo`](https://github.com/svg/svgo)                  |  
| `.jpg`,`.jpeg`  | [`sharp`](https://sharp.pixelplumbing.com/)                 |  
| `.png`          | [`sharp`](https://sharp.pixelplumbing.com/)                |    
| `.webp`         | [`sharp`](https://sharp.pixelplumbing.com/)                 |  
