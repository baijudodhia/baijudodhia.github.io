# Framework-Independent Portfolio with Web Components

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://baijudodhia.github.io)
[![Built with Web Components](https://img.shields.io/badge/Built%20with-Web%20Components-orange)](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
[![ISC License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

A modern portfolio website demonstrating enterprise-level architecture using Web Components and vanilla JavaScript. Built with zero framework dependencies, the project showcases component-based
design, multi-language support, and dynamic theming through native web technologies.

## 🎯 Key Features

- **Framework Independence**: Pure JavaScript implementation using Web Components
- **Multi-language Support**: Dynamic content loading in English, Hindi, and Gujarati
- **Theme System**: HSL-based color system with system/user preference detection
- **Progressive Web App**: Offline support and installable capability
- **Performance Optimized**: Advanced bundling and lazy loading strategies

## 🏗️ System Architecture

### Component Architecture

```
lib/
├── components/        # Reusable Web Components
├── styles/           # Global styles and themes
├── utils/           # Utility functions
├── tools/          # Build tools
├── tests/         # Test suites
└── dist/         # Production build output

portfolio/
├── sections/     # Main application sections
│   ├── about/   # About section component
│   ├── skills/  # Skills section component
│   └── ...      # Other section components
└── assets/     # Static assets
```

### Component Implementation Pattern

```javascript
class BaseComponent extends HTMLElement {
  constructor(props = {}, basePath = "", templateHtml = "", templateStyleUrls = []) {
    super();
    this.props = props;
    this.basePath = basePath;
    this.templateHtml = templateHtml;
    this.templateStyleUrls = templateStyleUrls;
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["language", "theme"];
  }

  // Lifecycle hooks for component management
  connectedCallback() {}
  disconnectedCallback() {}
  attributeChangedCallback(name, oldValue, newValue) {}
}
```

## 🛠️ Prerequisites

- Node.js (LTS version 14+)
- npm (6+) or yarn (1.22+)
- Modern browser with Web Components support
- Git for version control

## 📦 Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/baijudodhia/baijudodhia.github.io.git
   cd baijudodhia.github.io
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   Access the site at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

```javascript
// .env
NODE_ENV = development;
DEBUG = false;
```

### Build Configuration

```javascript
// rollup.config.js
export default {
  input: "./lib/index.js",
  output: {
    file: "lib/dist/index.min.js",
    format: "iife",
    compact: true,
  },
  plugins: [
    /* ... */
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
};
```

## 💻 Development Workflow

### Component Development

1. Create new component in `lib/components/`
2. Extend `BaseComponent` class
3. Implement required lifecycle methods
4. Register using `customElements.define()`

Example:

```javascript
class NewComponent extends BaseComponent {
  constructor() {
    super({
      id: "new-component",
      basePath: "/lib/components/new-component",
      templateHtml: `<div>...</div>`,
      templateStyleUrls: ["/styles/component.css"],
    });
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define("new-component", NewComponent);
```

### Internationalization

Add language support by creating JSON files in the component's data directory:

```javascript
// en.component.json
{
  "title": "English Title",
  "description": "English description"
}

// hi.component.json
{
  "title": "हिंदी शीर्षक",
  "description": "हिंदी विवरण"
}
```

### Theme Development

```javascript
const ThemeSystem = {
  colors: {
    primary: {
      light: (h) => `hsl(${h}, 100%, 50%)`,
      dark: (h) => `hsl(${h}, 100%, 30%)`,
    },
  },
};
```

## 🧪 Testing

### Component Testing

```javascript
describe("ComponentName", () => {
  let component;

  beforeEach(() => {
    component = new ComponentName();
    document.body.appendChild(component);
  });

  it("should render correctly", () => {
    const shadow = component.shadowRoot;
    expect(shadow.querySelector(".content")).toBeTruthy();
  });

  it("should handle language changes", async () => {
    await component.loadContent("hi");
    expect(component.shadowRoot.querySelector(".title")).toHaveTextContent("हिंदी शीर्षक");
  });
});
```

## 🚀 Deployment

### Build Process

1. **Production Build**

   ```bash
   npm run build
   ```

   This generates optimized assets in `lib/dist/`

2. **GitHub Pages Deployment**
   - Push to main branch
   - GitHub Actions workflow handles deployment
   - Cache management and asset optimization

### Performance Monitoring

- Lighthouse scores tracking
- Web Vitals monitoring
- Error logging via console
- Analytics integration

## 🔧 Troubleshooting

### Common Issues

1. **Component Not Rendering**

   - Check browser console for errors
   - Verify Web Components support
   - Ensure Shadow DOM attachment

2. **Style Issues**

   - Verify CSS encapsulation
   - Check theme variable inheritance
   - Inspect Shadow DOM styles

3. **Language Loading Fails**
   - Check network requests
   - Verify JSON file structure
   - Ensure correct path resolution

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style

- Use Prettier for formatting
- Follow Web Components best practices
- Maintain component independence
- Document public APIs

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
