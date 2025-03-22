// BaseComponent.js - A foundation class for all web components

import { isEmptyValue } from "./helper.js";

/**
 * BaseComponent - A foundation class for all web components
 * Provides common functionality like template loading, attribute handling, and lifecycle methods
 */
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Component state
    this._state = {};
    this._initialized = false;
    this._pendingAttributes = new Map();
  }

  async connectedCallback() {
    try {
      await this._initialize();
    } catch (error) {
      console.error(`Failed to initialize component ${this.tagName}:`, error);
    }
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (!this._initialized) {
      this._pendingAttributes.set(name, { oldValue, newValue });
      return;
    }

    this._processAttributeChange(name, oldValue, newValue);
  }

  _processAttributeChange(name, oldValue, newValue) {
    try {
      if (typeof this._handleAttributeChange === "function") {
        this._handleAttributeChange(name, oldValue, newValue);
      } else {
        const camelName = this._camelCase(name);
        if (this._state) {
          this._state[camelName] = newValue;
        }
      }
    } catch (error) {
      console.error(`[${this.tagName}] Error handling attribute change:`, {
        name,
        oldValue,
        newValue,
        error: error.message,
      });
    }
  }

  async _initialize() {
    try {
      // Setup template and styles
      await this._setupTemplate();
      await this._setupStyles();

      // Parse attributes and setup event listeners
      this._parseAttributes();
      this._setupEventListeners();

      // Initial render
      this._render();

      // Component-specific initialization
      if (typeof this.onInit === "function") {
        await this.onInit();
      }

      // Mark as initialized
      this._initialized = true;

      // Process any pending attribute changes
      if (this._pendingAttributes.size > 0) {
        for (const [name, { oldValue, newValue }] of this._pendingAttributes) {
          this._processAttributeChange(name, oldValue, newValue);
        }
        this._pendingAttributes.clear();
      }
    } catch (error) {
      console.error(`Initialization error in ${this.tagName}:`, error);
      throw error;
    }
  }

  async _setupTemplate() {
    if (!this.templateHtml) return;

    try {
      // Create root element
      const root = document.createElement("div");
      root.className = "component-root";

      // Handle imported template
      let templateContent = this.templateHtml;

      // If it's a module default export, use that
      if (this.templateHtml.default) {
        templateContent = this.templateHtml.default;
      }

      // Parse the template content
      const parser = new DOMParser();
      const doc = parser.parseFromString(templateContent, "text/html");

      // First try to find a template tag
      const template = doc.querySelector("template");
      if (template) {
        // Clone the template and append it to the root
        const clone = document.importNode(template, true);
        root.appendChild(clone);
      } else {
        // If no template tag found, use the content directly
        root.innerHTML = templateContent;
      }

      this.shadowRoot.appendChild(root);
    } catch (error) {
      console.error(`Template setup error in ${this.tagName}:`, error);
      throw error;
    }
  }

  async _setupStyles() {
    if (!this.templateStyles || !this.templateStyles.length) return;

    try {
      const styles = document.createElement("style");
      let cssContent = "";

      // Handle array of styles
      if (Array.isArray(this.templateStyles)) {
        for (const style of this.templateStyles) {
          // Handle module default exports
          if (style && style.default) {
            cssContent += style.default + "\n";
          }
          // Handle plain CSS strings
          else if (typeof style === "string") {
            cssContent += style + "\n";
          }
          // Handle CSSStyleSheet objects
          else if (style instanceof CSSStyleSheet) {
            cssContent +=
              Array.from(style.cssRules)
                .map((rule) => rule.cssText)
                .join("\n") + "\n";
          }
        }
      }
      // Handle single style
      else {
        cssContent = this.templateStyles.default || this.templateStyles;
      }

      styles.textContent = cssContent;
      this.shadowRoot.insertBefore(styles, this.shadowRoot.firstChild);
    } catch (error) {
      console.error(`Style setup error in ${this.tagName}:`, error);
      throw error;
    }
  }

  _camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  _kebabCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  // These methods should be implemented by child classes
  _parseAttributes() {}
  _render() {}
  _setupEventListeners() {}
  _cleanup() {}

  setState(newState, shouldRender = true) {
    this._state = { ...this._state, ...newState };
    if (shouldRender) this._render();
  }

  getState() {
    return { ...this._state };
  }

  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  emit(name, detail = {}, options = {}) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: true,
      ...options,
      detail,
    });
    this.dispatchEvent(event);
    return event;
  }
}
