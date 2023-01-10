---
title: CLI Options
description: Lorem ipsum dolor sit amet - 3
layout: ../layouts/MainLayout.astro
---

| Options______      | Description                    |
| ------------- | ------------------------------ |
| `--onlyoptim` | Only runs optimization (PASS 1) |
| `--onlycomp`  | Only runs compression (PASS 2) |
| `--fast`      | Go fast. Mostly no compression just checks for issues. |
| `--fail`      | Exits with a non-zero return code if issues. |
| `--nowrite`   | Don't write anything to disk (for testing) |
| `--exclude`   | Files to exclude from processing. Expect glob format like `--exclude 'blog/**'` |
| `--cleancache`| Clean cache before running |
| `--nocache`   | Don't use the cache (no read or write to cache) |
