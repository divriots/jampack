---
title: CLI Options
description: List of options for `jampack` command-line.
layout: ../layouts/MainLayout.astro
---

| Options______      | Description                    |
| ------------- | ------------------------------ |
| `--onlyoptim` | Only runs optimization (PASS 1) |
| `--onlycomp`  | Only runs compression (PASS 2) |
| `--fast`      | Go fast. Mostly no compression just checks for issues. |
| `--fail`      | Exits with a non-zero return code if issues. |
| `--nowrite`   | Don't write anything to disk (for testing) |
| `--include`   | HTML files to include - by default all *.htm and *.html are included. Expect glob format like `--exclude 'blog/post100/index.html'` |
| `--exclude`   | Files to exclude from processing. Expect glob format like `--exclude 'blog/**'` |
| `--cleancache`| Clean cache before running |
| `--nocache`   | Don't use the cache (no read or write to cache) |
