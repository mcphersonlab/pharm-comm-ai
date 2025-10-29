# GitHub Pages - Pharm Comm AI

[![Deploy to GitHub Pages](https://github.com/mcphersonlab/pharm-comm-ai/actions/workflows/pages.yml/badge.svg)](https://github.com/mcphersonlab/pharm-comm-ai/actions/workflows/pages.yml)

This directory contains the static website for the Pharm Comm AI project, deployed via GitHub Pages.

## About

The GitHub Pages site serves as a landing page and documentation portal for the Pharm Comm AI training module. It provides:

- Project overview and features
- Patient persona descriptions
- Getting started instructions
- Architecture documentation
- Links to the GitHub repository

## Viewing the Site

Once deployed, the site will be available at:
https://mcphersonlab.github.io/pharm-comm-ai/

## Local Development

To preview the site locally:

1. Navigate to the `docs` directory:
   ```bash
   cd docs
   ```

2. Start a local web server (Python):
   ```bash
   python -m http.server 8000
   ```

3. Open your browser to:
   ```
   http://localhost:8000
   ```

## Deployment

The site is automatically deployed via GitHub Actions when changes are pushed to the `main` branch. The workflow is defined in `.github/workflows/pages.yml`.

## Note

This is a static informational site. The interactive training application requires running the Flask backend locally. See the main README.md for instructions on running the full application.
