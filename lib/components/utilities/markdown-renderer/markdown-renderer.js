/**
 * Markdown Renderer Component - Renders markdown content with MathJax and Mermaid support
 * Using the BaseComponent architecture for consistency and improved functionality
 */
import { BaseComponent } from "../../../utils/BaseComponent.js";
import { isEmptyValue } from "../../../utils/helper.js";
import markdownRendererCssTemplate from "./markdown-renderer.css";
import markdownRendererHtmlTemplate from "./markdown-renderer.html";

// Centralize configuration constants
const MARKDOWN_RENDERER_CONFIG = {
  APPEARANCES: ["primary", "secondary", "tertiary"],
  SIZES: ["xs", "s", "m", "l", "xl"],
  SHAPES: ["rounded", "curved", "rectangle"],
};

/**
 * Load Marked.js and MathJax dependencies
 * @param {Object} props - Component properties
 * @returns {Promise<Object>} - Loaded dependencies
 */
const loadDependencies = async (props) => {
  try {
    // Load Marked.js
    await new Promise((resolve, reject) => {
      if (window.marked) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load MathJax
    await new Promise((resolve, reject) => {
      if (window.MathJax) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@2.7.9/MathJax.js?config=TeX-AMS_CHTML";
      script.onload = () => {
        window.MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [
              ["$", "$"],
              ["\\(", "\\)"],
            ],
            displayMath: [
              ["$$", "$$"],
              ["\\[", "\\]"],
            ],
            processEscapes: true,
            skipTags: ["script", "noscript", "style", "textarea", "code"],
            ignoreClass: "no-mathjax",
          },
          showProcessingMessages: false,
          messageStyle: "none",
          showMathMenu: false,
          elements: [], // Allow processing of arbitrary DOM elements
        });

        // Configure MathJax to handle Shadow DOM
        window.MathJax.Hub.Register.StartupHook("End", function () {
          window.MathJax.Hub.processSectionDelay = 0;
        });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load Mermaid.js
    await new Promise((resolve, reject) => {
      if (window.mermaid) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js";
      script.onload = () => {
        // Don't initialize here - we'll do it in the render method
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Marked.js renderer to handle code blocks
    const renderer = new window.marked.Renderer();
    renderer.code = function (code, language, escaped) {
      if (language === "mermaid") {
        const id = `mermaid-${Math.random().toString(36).substring(2)}`;
        return `<div class="mermaid-diagram" data-diagram-id="${id}" data-diagram-code="${encodeURIComponent(code)}"></div>`;
      }

      const codeBlock = document.createElement("app-code-block");
      codeBlock.setAttribute("code", code);
      if (language) {
        codeBlock.setAttribute("language", language);
        codeBlock.setAttribute("title", language);
      }
      codeBlock.setAttribute("appearance", props?.appearance || "primary");
      codeBlock.setAttribute("size", props?.size || "m");
      codeBlock.setAttribute("shape", props?.shape || "curved");
      return codeBlock.outerHTML;
    };

    window.marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: true,
      headerPrefix: "heading-",
      mangle: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: true,
      renderer: renderer,
    });

    return { marked: window.marked, MathJax: window.MathJax };
  } catch (error) {
    console.error("Failed to load dependencies:", error);
    return null;
  }
};

export class AppMarkdownRendererComponent extends BaseComponent {
  constructor(
    props = {
      id: "markdown-renderer",
      appearance: "primary",
      size: "m",
      shape: "curved",
      style: "",
      content: "",
    },
    basePath = "/components/utilities/markdown-renderer",
  ) {
    super();

    // Template properties
    this.templateHtml = markdownRendererHtmlTemplate;
    this.templateStyles = [markdownRendererCssTemplate];

    // Component state
    this._state = {
      id: "markdown-renderer",
      appearance: "primary",
      size: "m",
      shape: "curved",
      style: "",
      content: "",
    };

    // External dependencies
    this.marked = null;
    this.MathJax = null;
    this.mermaid = null;

    // For backward compatibility
    this.props = props;
    this.basePath = basePath;

    // Initialize the component
    this._init();
  }

  /**
   * Initialize the component by loading dependencies
   * @private
   */
  async _init() {
    try {
      const deps = await loadDependencies(this._state);
      if (deps) {
        this.marked = deps.marked;
        this.MathJax = deps.MathJax;
        this.mermaid = window.mermaid;

        // Apply the current component state and render
        this._parseAttributes();
        this._render();
      }
    } catch (error) {
      console.error("Failed to initialize markdown renderer:", error);
    }
  }

  /**
   * Observed attributes for automatic change handling
   */
  static get observedAttributes() {
    return ["id", "appearance", "size", "shape", "style", "content"];
  }

  /**
   * Handle attribute changes
   * @override
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Update both props (for backward compatibility) and _state
    this.props[name] = newValue;
    this._state[name] = newValue;

    // Only render if dependencies are loaded
    if (this.marked && this.MathJax) {
      this._render();
    }
  }

  /**
   * Parse attributes from the element
   * @override
   */
  _parseAttributes() {
    // Get all observed attributes
    const attributes = this.constructor.observedAttributes;

    // Process each attribute
    attributes.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        const value = this.getAttribute(attr);

        // Update both props (for backward compatibility) and _state
        this.props[attr] = value;
        this._state[attr] = value;
      }
    });
  }

  /**
   * Initialize or update mermaid configuration based on current theme
   * @private
   */
  _initializeMermaid() {
    if (!window.mermaid) return;

    const theme = document.documentElement.getAttribute("data-theme") || "light";
    window.mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "inherit",
    });
  }

  /**
   * Render mermaid diagrams in the container
   * @private
   * @param {HTMLElement} container - The container element
   */
  async _renderMermaidDiagrams(container) {
    if (!window.mermaid) return;

    // Initialize mermaid with current theme
    this._initializeMermaid();

    // Find all mermaid diagrams
    const diagrams = container.querySelectorAll(".mermaid-diagram");
    for (const diagram of diagrams) {
      const id = diagram.getAttribute("data-diagram-id");
      const code = decodeURIComponent(diagram.getAttribute("data-diagram-code"));

      try {
        // Clear previous content
        diagram.innerHTML = "";

        // Render the diagram
        const { svg } = await window.mermaid.render(id, code);
        diagram.innerHTML = svg;

        // Apply component styles to the diagram
        const svgElement = diagram.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";

          // Inherit font styles
          const textElements = svgElement.querySelectorAll("text");
          textElements.forEach((text) => {
            text.style.fontFamily = "inherit";
          });
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        diagram.innerHTML = `<pre class="mermaid-error">Error rendering diagram: ${error.message}</pre>`;
      }
    }
  }

  /**
   * Process MathJax content in the container
   * @private
   * @param {HTMLElement} container - The container element
   */
  async _processMathJax(container) {
    if (!this.MathJax) return;

    return new Promise((resolve) => {
      // Force MathJax to process the Shadow DOM content
      this.MathJax.Hub.Queue(["Typeset", this.MathJax.Hub, container], () => {
        // After typesetting, ensure all math is visible
        const mathElements = container.querySelectorAll(".MathJax, .MathJax_Preview, .MathJax_CHTML");
        mathElements.forEach((el) => {
          el.style.visibility = "visible";
          el.style.display = "block";
        });
        resolve();
      });
    });
  }

  /**
   * Render the component
   * @override
   */
  async _render() {
    if (!this.shadowRoot || !this.marked || !this.MathJax) return;

    try {
      // Get or create the main container element
      let container = this.shadowRoot.querySelector(".markdown-renderer");
      if (!container) {
        container = document.createElement("div");
        container.classList.add("markdown-renderer");
        container.setAttribute("id", this._state.id || "markdown-renderer");
        this.shadowRoot.appendChild(container);
      }

      // Clear existing content
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Apply data attributes
      for (const [key, value] of Object.entries(this._state)) {
        if (!isEmptyValue(value)) {
          if (["id", "style"].includes(key)) {
            container.setAttribute(key, value);
          } else if (key !== "content") {
            container.setAttribute(`data-${key}`, value);
          }
        }
      }

      // Get the template from the shadow DOM
      const template = this.shadowRoot.querySelector("#markdown-renderer-template");
      if (!template) {
        throw new Error("Markdown renderer template not found in shadow DOM");
      }

      // Clone the template
      const fragment = template.content.cloneNode(true);

      // Render markdown content
      const contentEl = fragment.querySelector("#markdown-content");
      if (contentEl && this._state.content) {
        // Render Markdown content using Marked.js
        contentEl.innerHTML = this.marked.parse(this._state.content);

        // First render mermaid diagrams
        await this._renderMermaidDiagrams(contentEl);

        // Add the fragment to the container
        container.appendChild(fragment);

        // Ensure MathJax can access Shadow DOM content
        const mathJaxContext = document.createElement("div");
        mathJaxContext.innerHTML = contentEl.innerHTML;
        document.body.appendChild(mathJaxContext);

        // Process MathJax in the temporary context
        await this._processMathJax(mathJaxContext);

        // Copy processed content back to Shadow DOM
        contentEl.innerHTML = mathJaxContext.innerHTML;

        // Clean up
        document.body.removeChild(mathJaxContext);
      } else {
        container.appendChild(fragment);
      }

      // Set up theme change observer for mermaid diagrams
      if (!this._themeObserver) {
        this._themeObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "data-theme") {
              const contentElement = this.shadowRoot.querySelector("#markdown-content");
              if (contentElement) {
                this._renderMermaidDiagrams(contentElement);
              }
            }
          });
        });

        this._themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });
      }
    } catch (error) {
      console.error("Error rendering content:", error);
      const container = this.shadowRoot.querySelector(".markdown-renderer");
      if (container) {
        container.innerHTML = `<div class="render-error">Error rendering content: ${error.message}</div>`;
      }
    }
  }

  /**
   * For backward compatibility
   */
  render() {
    this._render();
  }

  /**
   * For backward compatibility
   */
  getElement() {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(".markdown-renderer");
  }

  /**
   * For backward compatibility
   */
  getTemplate() {
    return this.shadowRoot.querySelector("#markdown-renderer-template");
  }

  /**
   * For backward compatibility
   */
  getTemplateClone(template) {
    return template.content.cloneNode(true);
  }

  /**
   * Clean up when component is disconnected
   */
  disconnectedCallback() {
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }
}

// Register the component with improved error handling
try {
  customElements.define("app-markdown-renderer", AppMarkdownRendererComponent);
  console.log("Markdown Renderer component registered successfully");
} catch (error) {
  console.warn("Markdown Renderer component registration issue:", error.message);
}
