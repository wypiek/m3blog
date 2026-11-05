---
title: Deploying to GitHub Pages
date: 2025-12-10
tags: [guide, deploy]
icon: rocket_launch
shape: pill
accent: tertiary
summary: Publish your m3blog for free with a short GitHub Actions workflow.
---

Because m3blog produces plain static files, any static host works. GitHub Pages is free and only needs one workflow file.

<!-- more -->

## 1. Set the URL

If your site will live at `https://you.github.io/my-blog/`, set this in `m3blog.config.json`:

```json
{
  "url": "https://you.github.io",
  "basePath": "/my-blog/"
}
```

With a custom domain or a `you.github.io` repository, keep `basePath` as `/`.

## 2. Add the workflow

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy blog
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 3. Turn on Pages

In the repository settings, open **Pages** and choose **GitHub Actions** as the source. Push to `main` and your blog goes live a minute later.
