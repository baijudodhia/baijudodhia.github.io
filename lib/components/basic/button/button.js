/**
 * Button Component - A versatile button component with various appearances, sizes, and states
 * Using the BaseComponent architecture for consistency and improved functionality
 */
import { BaseComponent } from "../../../utils/BaseComponent.js";
import { isEmptyValue } from "../../../utils/helper.js";
import buttonTemplate from "./button.html";
import buttonStyles from "./button.css";

// Centralize configuration constants
export const BUTTON_CONFIG = {
  APPEARANCES: ["primary", "secondary", "tertiary", "outlined", "mono", "link"],
  SIZES: ["xs", "s", "m", "l", "xl"],
  SHAPES: ["rounded", "curved", "rectangle"],
  TYPES: ["button", "submit", "reset", "link", "pwa-installer"],
  TOOLTIP_POSITIONS: ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end"],
  TOOLTIP_ANIMATIONS: ["fade", "shift-away", "shift-toward", "scale"],
  TOOLTIP_TRIGGERS: ["click", "mouseenter", "focus", "manual"],
};

/**
 * Load Tippy.js dependency for tooltips
 * @returns {Promise<Object>} - Tippy.js instance
 */
const loadDependencies = async () => {
  try {
    // Load Popper.js
    await new Promise((resolve, reject) => {
      if (window.Popper) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.11.8/umd/popper.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load Tippy.js
    await new Promise((resolve, reject) => {
      if (window.tippy) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/tippy.js/6.3.7/tippy.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return window.tippy;
  } catch (error) {
    console.error("Failed to load dependencies:", error);
    return null;
  }
};

export class AppButtonComponent extends BaseComponent {
  constructor() {
    super();

    // Template properties
    this.templateHtml = buttonTemplate;
    this.templateStyles = [buttonStyles];

    // Component state
    this._state = {
      // Core state
      id: "button",
      appearance: "primary",
      size: "m",
      shape: "curved",
      style: "",
      // State flags
      loading: false,
      disabled: false,
      // Content
      label: "",
      title: "",
      iconLeft: "",
      iconRight: "",
      iconElementLeft: "",
      iconElementRight: "",
      iconOnly: false,
      // Link properties
      href: "",
      download: "",
      rel: "noopener noreferrer",
      hrefTarget: "_blank",
      // Button properties
      type: "button",
      name: "",
      value: "",
      // Form properties
      form: "",
      formaction: "",
      formmethod: "",
      formtarget: "",
      formnovalidate: false,
      formenctype: "",
      // PWA properties
      installText: "",
      // Tooltip properties
      tooltip: "",
      tooltipAppearance: "",
      tooltipSize: "",
      tooltipShape: "",
      tooltipPosition: "top",
      tooltipHtml: "",
      tooltipAnimation: "fade",
      tooltipDelay: 0,
      tooltipDuration: 200,
      tooltipTrigger: "click",
      tooltipInteractive: false,
      tooltipMaxWidth: 350,
      tooltipOffset: [0, 10],
      tooltipArrow: true,
      tooltipClass: "",
    };

    // External dependencies
    this.tippy = null;
    this.tippyInstance = null;

    // PWA installer properties
    this.deferredPrompt = null;
  }

  /**
   * Component initialization after dependencies are loaded
   */
  async onInit() {
    try {
      this.tippy = await loadDependencies();
      if (this._state.tooltip || this._state.tooltipHtml) {
        this._initTooltip();
      }
      if (this._state.type === "pwa-installer") {
        this._setupPwaInstaller();
      }
    } catch (error) {
      console.error("Failed to initialize button dependencies:", error);
    }
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Use arrow functions to preserve 'this' context
    this._boundClickHandler = (event) => this._handleClick(event);
    this._boundKeyHandler = (event) => this._handleKeyDown(event);

    this.addEventListener("click", this._boundClickHandler);
    this.addEventListener("keydown", this._boundKeyHandler);
  }

  /**
   * Cleanup when component is disconnected
   */
  _cleanup() {
    // Remove event listeners using the same bound functions
    if (this._boundClickHandler) {
      this.removeEventListener("click", this._boundClickHandler);
    }
    if (this._boundKeyHandler) {
      this.removeEventListener("keydown", this._boundKeyHandler);
    }

    if (this._state.type === "pwa-installer") {
      window.removeEventListener("beforeinstallprompt", this._handleBeforeInstallPrompt.bind(this));
    }

    this._destroyTippy();
  }

  /**
   * Observed attributes for automatic change handling
   */
  static get observedAttributes() {
    return [
      // Core attributes
      "id",
      "appearance",
      "size",
      "shape",
      "style",
      // State attributes
      "loading",
      "disabled",
      // Content attributes
      "label",
      "title",
      "icon-left",
      "icon-right",
      "icon-element-left",
      "icon-element-right",
      "icon-only",
      // Link attributes
      "href",
      "download",
      "rel",
      "href-target",
      // Button attributes
      "type",
      "name",
      "value",
      // Form attributes
      "form",
      "formaction",
      "formmethod",
      "formtarget",
      "formnovalidate",
      "formenctype",
      // PWA attributes
      "install-text",
      // Tooltip attributes
      "tooltip",
      "tooltip-appearance",
      "tooltip-size",
      "tooltip-shape",
      "tooltip-position",
      "tooltip-html",
      "tooltip-animation",
      "tooltip-delay",
      "tooltip-duration",
      "tooltip-trigger",
      "tooltip-interactive",
      "tooltip-max-width",
      "tooltip-offset",
      "tooltip-arrow",
      "tooltip-class",
    ];
  }

  /**
   * Handle attribute changes
   */
  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    const camelName = this._camelCase(name);

    // Handle boolean attributes
    if (["disabled", "loading", "formnovalidate", "icon-only", "tooltip-interactive", "tooltip-arrow"].includes(name)) {
      this._state[camelName] = this.hasAttribute(name);
    }
    // Handle numeric attributes
    else if (["tooltip-delay", "tooltip-duration", "tooltip-max-width"].includes(name)) {
      this._state[camelName] = parseInt(newValue || "0", 10);
    }
    // Handle array attributes
    else if (name === "tooltip-offset") {
      try {
        this._state[camelName] = JSON.parse(newValue || "[0, 10]");
      } catch (e) {
        this._state[camelName] = [0, 10];
      }
    }
    // Handle special cases
    else if (name === "href" && newValue && !this.hasAttribute("type")) {
      this._state.type = "link";
      this._state[camelName] = newValue;
    }
    // Handle regular attributes
    else {
      this._state[camelName] = newValue;
    }

    // Update icon-only state when icons or label changes
    if (name === "icon-left" || name === "icon-right" || name === "icon-element-left" || name === "icon-element-right" || name === "label") {
      this._updateIconOnlyState();
    }

    // Render the component
    this._render();

    // Update tooltip if needed
    if (name.startsWith("tooltip-") || name === "tooltip") {
      this._updateTooltip();
    }

    // Handle PWA installer type change
    if (name === "type") {
      if (oldValue === "pwa-installer") {
        window.removeEventListener("beforeinstallprompt", this._handleBeforeInstallPrompt.bind(this));
      }
      if (newValue === "pwa-installer") {
        this._setupPwaInstaller();
      }
    }
  }

  /**
   * Update the icon-only state based on current attributes
   * @private
   */
  _updateIconOnlyState() {
    const hasExplicitIconOnly = this.hasAttribute("icon-only");
    const hasLabel = this._state.label && this._state.label.trim() !== "";
    const hasIcons = this._state.iconLeft || this._state.iconRight || this._state.iconElementLeft || this._state.iconElementRight;

    const shouldBeIconOnly = hasExplicitIconOnly || (hasIcons && !hasLabel);

    if (shouldBeIconOnly !== this._state.iconOnly) {
      this._state.iconOnly = shouldBeIconOnly;
    }
  }

  validateTooltipProps() {
    const {
      appearance,
      size,
      shape,
      "tooltip-appearance": tooltipAppearance,
      "tooltip-size": tooltipSize,
      "tooltip-shape": tooltipShape,
      "tooltip-position": position,
      "tooltip-animation": animation,
      "tooltip-trigger": trigger,
    } = this._state;

    return {
      appearance: BUTTON_CONFIG.APPEARANCES.includes(tooltipAppearance) ? tooltipAppearance : appearance || "primary",
      size: BUTTON_CONFIG.SIZES.includes(tooltipSize) ? tooltipSize : size || "m",
      shape: BUTTON_CONFIG.SHAPES.includes(tooltipShape) ? tooltipShape : shape || "curved",
      position: BUTTON_CONFIG.POSITIONS.includes(position) ? position : "top",
      animation: BUTTON_CONFIG.ANIMATIONS.includes(animation) ? animation : "fade",
      trigger: BUTTON_CONFIG.TRIGGERS.includes(trigger) ? trigger : "click",
    };
  }

  getTippyConfig() {
    const validatedProps = this.validateTooltipProps();
    const tooltipClasses = [`tippy-${validatedProps.appearance}`, `tippy-${validatedProps.size}`, `tippy-${validatedProps.shape}`];

    if (this._state["tooltip-class"]) {
      tooltipClasses.push(this._state["tooltip-class"]);
    }

    return {
      content: this._state["tooltip-html"] || this._state.tooltip,
      allowHTML: true,
      placement: validatedProps.position || "auto",
      theme: validatedProps.appearance,
      trigger: validatedProps["tooltip-trigger"] || "click",
      duration: null,
      interactive: true,
      arrow: true,
      appendTo: () => this.shadowRoot,
      interactiveDebounce: 75,
      hideOnClick: validatedProps.trigger === "click",
      onCreate: (instance) => {
        instance.popper.classList.add(...tooltipClasses);
      },
      onShow: (instance) => {
        // Hide all other tooltips except the current one
        if (this.tippy) {
          this.tippy.hideAll({ exclude: instance });
        }
      },
    };
  }

  parseOffset(offset) {
    if (typeof offset === "string") {
      try {
        return JSON.parse(offset);
      } catch {
        return [0, 10];
      }
    }
    return offset || [0, 10];
  }

  destroyTippy() {
    if (this.tippyInstance) {
      this.tippyInstance.destroy();
      this.tippyInstance = null;
    }
  }

  initializeTippy() {
    // Don't initialize if tooltip property is empty or tippy.js is unavailable
    if (!this._state.tooltip || !this.tippy) {
      return;
    }

    // Handle form button attributes
    if (this._state.form) button.setAttribute("form", this._state.form);
    if (this._state.formaction) button.setAttribute("formaction", this._state.formaction);
    if (this._state.formmethod) button.setAttribute("formmethod", this._state.formmethod);
    if (this._state.formtarget) button.setAttribute("formtarget", this._state.formtarget);
    if (this._state.formnovalidate) button.setAttribute("formnovalidate", "");
    if (this._state.formenctype) button.setAttribute("formenctype", this._state.formenctype);

    // Clear previous content and append new button
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
    this.shadowRoot.appendChild(fragment);

    // Initialize tooltip if needed
    if (this._state.tooltip || this._state.tooltipHtml) {
      this._initTooltip();
    }
  }

  /**
   * Render the component
   */
  _render() {
    if (!this.shadowRoot) return;

    // Create or get the component root
    let root = this.shadowRoot.querySelector(".component-root");
    if (!root) {
      root = document.createElement("div");
      root.className = "component-root";
      this.shadowRoot.appendChild(root);
    }

    // Get or create the button
    let button = root.querySelector("button");
    if (!button) {
      button = document.createElement("button");
      const iconLeft = document.createElement("i");
      iconLeft.id = "button-icon-left";
      iconLeft.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.id = "button-label";

      const iconRight = document.createElement("i");
      iconRight.id = "button-icon-right";
      iconRight.setAttribute("aria-hidden", "true");

      button.appendChild(iconLeft);
      button.appendChild(label);
      button.appendChild(iconRight);
      root.appendChild(button);
    }

    // Set core attributes directly (not as data attributes)
    button.id = this._state.id || "button";
    button.setAttribute("role", this._state.type === "link" ? "link" : "button");
    button.setAttribute("type", this._state.type || "button");

    // Apply appearance, size, and shape as data attributes
    button.setAttribute("data-appearance", this._state.appearance || "primary");
    button.setAttribute("data-size", this._state.size || "m");
    button.setAttribute("data-shape", this._state.shape || "curved");

    // Apply custom styles if any
    if (this._state.style) {
      button.style.cssText = this._state.style;
    }

    // Handle name and value attributes
    if (this._state.name) {
      button.setAttribute("name", this._state.name);
    }
    if (this._state.value) {
      button.setAttribute("value", this._state.value);
    }

    // Handle disabled state
    button.disabled = this._state.disabled;
    if (this._state.disabled) {
      button.setAttribute("aria-disabled", "true");
    } else {
      button.removeAttribute("aria-disabled");
    }

    // Set title if provided
    if (this._state.title) {
      button.setAttribute("title", this._state.title);
    } else {
      button.removeAttribute("title");
    }

    // Handle loading state
    if (this._state.loading) {
      button.setAttribute("aria-busy", "true");
      this._hideIcons(button);
    } else {
      button.removeAttribute("aria-busy");
      this._renderIcons(button);
    }

    // Handle link type
    if (this._state.type === "link" && this._state.href) {
      button.setAttribute("href", this._state.href);
      if (this._state.download) {
        button.setAttribute("download", this._state.download);
      }
      if (this._state.hrefTarget) {
        button.setAttribute("target", this._state.hrefTarget);
        if (this._state.hrefTarget === "_blank") {
          button.setAttribute("aria-label", `${this._state.label} (opens in new tab)`);
        }
      }
      if (this._state.rel) {
        button.setAttribute("rel", this._state.rel);
      }
    }

    // Handle form button attributes
    if (this._state.form) button.setAttribute("form", this._state.form);
    if (this._state.formaction) button.setAttribute("formaction", this._state.formaction);
    if (this._state.formmethod) button.setAttribute("formmethod", this._state.formmethod);
    if (this._state.formtarget) button.setAttribute("formtarget", this._state.formtarget);
    if (this._state.formnovalidate) button.setAttribute("formnovalidate", "");
    if (this._state.formenctype) button.setAttribute("formenctype", this._state.formenctype);

    // Update label
    const labelElement = button.querySelector("#button-label");
    if (labelElement) {
      labelElement.textContent = this._state.label || "";
      labelElement.style.display = this._state.iconOnly ? "none" : "";
    }

    // Initialize tooltip if needed
    if (this._state.tooltip || this._state.tooltipHtml) {
      this._initTooltip();
    }
  }

  /**
   * Render icons in the button
   * @private
   * @param {HTMLButtonElement} button - The button element
   */
  _renderIcons(button) {
    const iconLeft = button.querySelector("#button-icon-left");
    const iconRight = button.querySelector("#button-icon-right");

    if (iconLeft) {
      if (this._state.iconLeft) {
        iconLeft.className = this._state.iconLeft;
        iconLeft.style.display = "";
      } else if (this._state.iconElementLeft) {
        iconLeft.innerHTML = this._state.iconElementLeft;
        iconLeft.style.display = "";
      } else {
        iconLeft.className = "";
        iconLeft.innerHTML = "";
        iconLeft.style.display = "none";
      }
    }

    if (iconRight) {
      if (this._state.iconRight) {
        iconRight.className = this._state.iconRight;
        iconRight.style.display = "";
      } else if (this._state.iconElementRight) {
        iconRight.innerHTML = this._state.iconElementRight;
        iconRight.style.display = "";
      } else {
        iconRight.className = "";
        iconRight.innerHTML = "";
        iconRight.style.display = "none";
      }
    }
  }

  /**
   * Hide icons in the button
   * @private
   * @param {HTMLButtonElement} button - The button element
   */
  _hideIcons(button) {
    const iconLeft = button.querySelector("#button-icon-left");
    const iconRight = button.querySelector("#button-icon-right");

    if (iconLeft) iconLeft.style.display = "none";
    if (iconRight) iconRight.style.display = "none";
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
        this._handleAttributeChange(attr, null, value);
      }
    });
  }

  /**
   * Handle click events
   * @private
   * @param {Event} event - Click event
   */
  _handleClick(event) {
    const { disabled, loading, type } = this._state;

    // Prevent action if disabled or loading
    if (disabled || loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Handle different button types
    if (type === "link") {
      this._handleLinkClick(event);
    } else if (type === "submit") {
      this._handleSubmit(event);
    } else if (type === "reset") {
      this._handleReset(event);
    } else if (type === "pwa-installer") {
      this._handlePwaInstall(event);
    }

    // Emit custom event
    this.dispatchEvent(
      new CustomEvent("button-click", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: event },
      }),
    );
  }

  /**
   * Handle keydown events for accessibility
   * @private
   * @param {KeyboardEvent} event - Keydown event
   */
  _handleKeyDown(event) {
    const { disabled, loading } = this._state;

    // Prevent action if disabled or loading
    if (disabled || loading) {
      return;
    }

    // Trigger click on Enter or Space
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this._handleClick(event);
    }
  }

  /**
   * Handle link button click
   * @private
   * @param {Event} event - Click event
   */
  _handleLinkClick(event) {
    const { href, hrefTarget, download, rel } = this._state;
    const finalTarget = hrefTarget || "_blank";

    if (!href) return;

    event.preventDefault();

    // Handle download links
    if (download !== undefined && download !== null) {
      const a = document.createElement("a");
      a.href = href;
      a.download = download || "";
      a.rel = rel || "noopener noreferrer";
      a.target = finalTarget;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Handle regular links
    const isMailto = href.startsWith("mailto:");
    const isTel = href.startsWith("tel:");

    if (isMailto || isTel) {
      window.location.href = href;
    } else {
      const newWindow = window.open(href, finalTarget, "noopener,noreferrer");
      if (newWindow) {
        newWindow.opener = null;
      }
    }
  }

  /**
   * Handle submit button click
   * @private
   * @param {Event} event - Click event
   */
  _handleSubmit(event) {
    const form = this._findForm();
    if (!form) return;

    event.preventDefault();

    // Apply form attributes if specified
    const { formaction, formmethod, formtarget, formnovalidate, formenctype } = this._state;
    const originalAttrs = {
      action: form.getAttribute("action"),
      method: form.getAttribute("method"),
      target: form.getAttribute("target"),
      novalidate: form.hasAttribute("novalidate"),
      enctype: form.getAttribute("enctype"),
    };

    // Apply temporary attributes
    if (formaction) form.setAttribute("action", formaction);
    if (formmethod) form.setAttribute("method", formmethod);
    if (formtarget) form.setAttribute("target", formtarget);
    if (formnovalidate) form.setAttribute("novalidate", "");
    if (formenctype) form.setAttribute("enctype", formenctype);

    // Submit form
    form.submit();

    // Restore original attributes
    Object.entries(originalAttrs).forEach(([attr, value]) => {
      if (value) {
        form.setAttribute(attr, value);
      } else {
        form.removeAttribute(attr);
      }
    });
  }

  /**
   * Handle reset button click
   * @private
   * @param {Event} event - Click event
   */
  _handleReset(event) {
    const form = this._findForm();
    if (form) {
      event.preventDefault();
      form.reset();
    }
  }

  /**
   * Find the closest form element
   * @private
   * @returns {HTMLFormElement|null} The closest form element or null if not found
   */
  _findForm() {
    const { form } = this._state;

    if (form) {
      return document.getElementById(form);
    }

    let parent = this.parentNode;
    while (parent) {
      if (parent.tagName === "FORM") {
        return parent;
      }
      parent = parent.parentNode;
    }

    return null;
  }
}

// Register the component with improved error handling
try {
  customElements.define("app-button", AppButtonComponent);
  console.log("Button component registered successfully");
} catch (error) {
  console.warn("Button component registration issue:", error.message);
}
