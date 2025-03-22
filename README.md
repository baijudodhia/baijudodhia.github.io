# Personal Portfolio Website

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Fbaijudodhia.github.io)](https://baijudodhia.github.io)

## Overview

A modern, performant personal portfolio website built with vanilla JavaScript and bundled using Rollup. The project emphasizes clean architecture, progressive enhancement, and optimal performance
through modern build tooling.

## Key Features

- 🚀 Optimized build process using Rollup
- 🎨 Modern CSS with PostCSS processing
- 📱 Progressive Web App (PWA) support
- 🌓 Theme support (light mode)
- 📊 Bundle analysis and optimization
- 🔍 SEO-friendly with proper meta tags
- ⚡ No runtime dependencies - pure vanilla JavaScript

## First-Time Setup

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/baijudodhia/baijudodhia.github.io.git
   cd baijudodhia.github.io
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   ```

## Codebase Structure

```
baijudodhia.github.io/
├── assets/           # Static assets and resources
├── cdn/             # CDN-ready assets
├── enable-javascript/# Fallback for users with JS disabled
├── lib/             # Core library code
├── portfolio/       # Portfolio-specific components
├── .github/         # GitHub workflows and configs
├── index.html       # Main entry point
├── rollup.config.js # Build configuration
└── package.json     # Project dependencies and scripts
```

### Key Components

- **Entry Point**: `index.html` serves as the main application entry point
- **Build System**: `rollup.config.js` manages bundling, optimization, and asset processing
- **Styles**: PostCSS handles CSS processing with features like:
  - CSS imports (`postcss-import`)
  - URL handling (`postcss-url`)
  - Minification (`cssnano`)
  - Autoprefixing (`autoprefixer`)

## Development Guide

### Build Process

The project uses Rollup for bundling with several optimizations:

- JavaScript bundling and minification
- CSS processing and optimization
- Asset handling (images, fonts)
- Bundle analysis and visualization

### Available Scripts

- `npm run dev`: Starts development server with hot reload and bundle analysis
- `npm run build`: Creates production build in `lib/dist`

### Development Tools

- Bundle analysis: View `bundle-analysis.html` after build
- VS Code settings included for consistent development
- Prettier configuration for code formatting

## Troubleshooting

Common issues and solutions:

1. **JavaScript Disabled**:

   - The site automatically redirects to `/enable-javascript/` for graceful degradation

2. **Build Errors**:

   - Clear `lib/dist` directory: `rm -rf lib/dist`
   - Delete `node_modules` and run `npm install`

3. **Development Server Issues**:
   - Ensure port 3000 is available
   - Check for Node.js version compatibility

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Submit a pull request

### Code Style

- Follow existing code formatting (Prettier config provided)
- Maintain vanilla JavaScript approach - no frameworks
- Document new features and changes
