/**
 * Theme Switcher Component - Provides UI for toggling between light and dark themes
 * Using the BaseComponent architecture for consistency and improved functionality
 */
import { BaseComponent } from "../../../utils/BaseComponent.js";
import { isEmptyValue } from "../../../utils/helper.js";
import themeSwitcherCssTemplate from "./theme-switcher.css";
import themeSwitcherHtmlTemplate from "./theme-switcher.html";

// Centralize configuration constants
const THEME_SWITCHER_CONFIG = {
  APPEARANCES: ["primary", "secondary", "tertiary"],
  SIZES: ["xs", "s", "m", "l", "xl"],
  SHAPES: ["rounded", "curved", "rectangle"],
};

export class AppThemeSwitcherComponent extends BaseComponent {
  constructor(
    props = {
      id: "theme-switcher",
      appearance: "primary",
      size: "m",
      shape: "rounded",
      style: "",
      disabled: false,
    },
  ) {
    super();

    // Template properties
    this.templateHtml = themeSwitcherHtmlTemplate;
    this.templateStyles = [themeSwitcherCssTemplate];

    // Component state
    this._state = {
      id: "theme-switcher",
      appearance: "primary",
      size: "m",
      shape: "rounded",
      style: "",
      disabled: false,
    };

    // Bound event handlers
    this._boundHandleThemeToggle = this.handleThemeToggle.bind(this);
    this._boundHandleSystemThemeChange = this.handleSystemThemeChange.bind(this);

    // For backward compatibility
    this.props = props;
  }

  /**
   * Component initialization after dependencies are loaded
   */
  async onInit() {
    try {
      // Initialize theme state
      const theme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);

      // Setup event listeners
      this._setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize theme switcher:", error);
    }
  }

  /**
   * Observed attributes for automatic change handling
   */
  static get observedAttributes() {
    return ["id", "appearance", "size", "shape", "style", "disabled"];
  }

  /**
   * Handle attribute changes
   */
  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Special handling for boolean values
    if (name === "disabled") {
      this._state[name] = newValue === "true" || newValue === true;
    } else {
      this._state[name] = newValue;
    }

    this._render();
  }

  /**
   * Set up event listeners for the component
   */
  _setupEventListeners() {
    const switchInput = this.shadowRoot?.querySelector("#theme-switcher-input");
    if (switchInput) {
      switchInput.addEventListener("change", this._boundHandleThemeToggle);

      // Set initial state
      const theme = document.documentElement.getAttribute("data-theme") || "light";
      switchInput.checked = theme === "dark";
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this._boundHandleSystemThemeChange);
  }

  /**
   * Clean up event listeners when component is disconnected
   */
  _cleanup() {
    const switchInput = this.shadowRoot?.querySelector("#theme-switcher-input");
    if (switchInput) {
      switchInput.removeEventListener("change", this._boundHandleThemeToggle);
    }

    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", this._boundHandleSystemThemeChange);
  }

  /**
   * Handle theme toggle event
   */
  handleThemeToggle(event) {
    if (this._state.disabled) {
      event.preventDefault();
      return;
    }

    const theme = event.target.checked ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    this.dispatchEvent(
      new CustomEvent("themeChange", {
        detail: { theme },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Handle system theme change event
   */
  handleSystemThemeChange(event) {
    if (!localStorage.getItem("theme")) {
      const theme = event.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);

      // Update switch state
      const switchInput = this.shadowRoot?.querySelector("#theme-switcher-input");
      if (switchInput) {
        switchInput.checked = theme === "dark";
      }
    }
  }

  /**
   * Render the component
   */
  _render() {
    if (!this.shadowRoot) return;

    // Get or create the component root
    let root = this.shadowRoot.querySelector(".component-root");
    if (!root) {
      root = document.createElement("div");
      root.className = "component-root";
      this.shadowRoot.appendChild(root);
    }

    // Get or create the theme switcher container
    let themeSwitcher = root.querySelector(".theme-switcher");
    if (!themeSwitcher) {
      themeSwitcher = document.createElement("div");
      themeSwitcher.className = "theme-switcher";

      // Get the template from shadow DOM
      const template = this.shadowRoot.querySelector("#theme-switcher-template");
      if (!template) {
        console.error("Theme switcher template not found in shadow DOM");
        return;
      }

      // Clone the template content
      const templateContent = template.content.cloneNode(true);
      themeSwitcher.appendChild(templateContent);
      root.appendChild(themeSwitcher);
    }

    // Set core attributes
    themeSwitcher.id = this._state.id || "theme-switcher";
    if (this._state.style) {
      themeSwitcher.style.cssText = this._state.style;
    }

    // Set data attributes for styling
    themeSwitcher.setAttribute("data-appearance", this._state.appearance || "primary");
    themeSwitcher.setAttribute("data-size", this._state.size || "m");
    themeSwitcher.setAttribute("data-shape", this._state.shape || "rounded");

    // Update disabled state
    if (this._state.disabled) {
      themeSwitcher.setAttribute("disabled", "");
    } else {
      themeSwitcher.removeAttribute("disabled");
    }

    // Update input state
    const input = themeSwitcher.querySelector("#theme-switcher-input");
    if (input) {
      input.disabled = this._state.disabled || false;

      // Set the checked state based on current theme
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      input.checked = currentTheme === "dark";
    }
  }
}

// Register the component
customElements.define("app-theme-switcher", AppThemeSwitcherComponent);
