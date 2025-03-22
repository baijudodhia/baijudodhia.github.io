/**
 * Text Component - A versatile text component with various appearances, sizes, and states
 * Using the BaseComponent architecture for consistency and improved functionality
 */
import { BaseComponent } from "../../../utils/BaseComponent.js";
import { isEmptyValue } from "../../../utils/helper.js";
import textCssTemplate from "./text.css";
import textHtmlTemplate from "./text.html";

// Centralize configuration constants
const TEXT_CONFIG = {
  APPEARANCES: ["primary", "secondary", "tertiary", "link"],
  SIZES: ["xs", "s", "m", "l", "xl", "xxl", "xxxl"],
  VARIANTS: ["text", "link", "heading", "paragraph"],
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

export class AppTextComponent extends BaseComponent {
  constructor(
    props = {
      id: "text",
      appearance: "",
      size: "m",
      style: "",
      text: "",
      title: "",
      "icon-left": "",
      "icon-right": "",
      href: "",
      "href-target": "_blank",
      variant: "text",
    },
    basePath = "/components/basic/text",
  ) {
    super();

    // Template properties
    this.templateHtml = textHtmlTemplate;
    this.templateStyles = [textCssTemplate];

    // Component state
    this._state = {
      id: "text",
      appearance: "",
      size: "m",
      style: "",
      text: "",
      title: "",
      iconLeft: "",
      iconRight: "",
      iconElementLeft: "",
      iconElementRight: "",
      href: "",
      hrefTarget: "_blank",
      variant: "text",
      loading: false,
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

    // For backward compatibility
    this.props = props;
    this.basePath = basePath;

    // External dependencies
    this.tippy = null;
    this.tippyInstance = null;
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
    } catch (error) {
      console.error("Failed to initialize text dependencies:", error);
    }
  }

  /**
   * Cleanup when component is disconnected
   */
  _cleanup() {
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
      "style",
      "text",
      "title",
      "icon-left",
      "icon-right",
      "icon-element-left",
      "icon-element-right",
      "variant",
      "href",
      "href-target",
      "loading",
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
   * @override
   */
  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Handle boolean attributes
    if (["tooltip-interactive", "tooltip-arrow"].includes(name)) {
      this._state[this._camelCase(name)] = this.hasAttribute(name);
    }
    // Handle numeric attributes
    else if (["tooltip-delay", "tooltip-duration", "tooltip-max-width"].includes(name)) {
      this._state[this._camelCase(name)] = parseInt(newValue || "0", 10);
    }
    // Handle array attributes
    else if (name === "tooltip-offset") {
      try {
        this._state[this._camelCase(name)] = JSON.parse(newValue || "[0, 10]");
      } catch (e) {
        this._state[this._camelCase(name)] = [0, 10];
      }
    }
    // Handle other attributes
    else {
      switch (name) {
        case "icon-left":
          this._state.iconLeft = newValue;
          break;
        case "icon-right":
          this._state.iconRight = newValue;
          break;
        case "icon-element-left":
          this._state.iconElementLeft = newValue;
          break;
        case "icon-element-right":
          this._state.iconElementRight = newValue;
          break;
        case "href-target":
          this._state.hrefTarget = newValue;
          break;
        default:
          this._state[this._camelCase(name)] = newValue;
      }
    }

    // If href is set, automatically set variant to link
    if (name === "href" && newValue && !this._state.variant) {
      this._state.variant = "link";
      this.props.variant = "link";
    }

    // Update tooltip if needed
    if (name.startsWith("tooltip-") || name === "tooltip") {
      this._updateTooltip();
    }

    this._render();
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
   * Set up event listeners for the component
   * @override
   */
  _setupEventListeners() {
    if (this._state.variant === "link" && this._state.href) {
      // Add click listener for link variant
      this.addEventListener("click", this._handleLinkClick.bind(this));

      // Add keyboard listener for accessibility
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._handleLinkClick();
        }
      });

      // Set role and tabindex for accessibility
      this.setAttribute("role", "link");
      if (!this.hasAttribute("tabindex")) {
        this.setAttribute("tabindex", "0");
      }
    }
  }

  /**
   * Handle clicks for link variant
   * @private
   */
  _handleLinkClick() {
    if (!this._state.href) return;

    const target = this._state.hrefTarget || "_blank";

    if (target === "_blank") {
      // Open in new window with security best practices
      const newWindow = window.open(this._state.href, target, "noopener,noreferrer");
      if (newWindow) {
        newWindow.opener = null;
        newWindow.location = this._state.href;
      } else {
        console.error("Failed to open new window.");
      }
    } else {
      // Open in the same window
      window.location.href = this._state.href;
    }
  }

  /**
   * Render the component
   * @override
   */
  _render() {
    if (!this.shadowRoot) return;

    // Get or create the main text element
    let textElement = this.shadowRoot.querySelector(".text");
    if (!textElement) {
      textElement = document.createElement("div");
      textElement.classList.add("text");
      textElement.setAttribute("id", this._state.id || "text");
      this.shadowRoot.appendChild(textElement);
    }

    // Clear existing content
    while (textElement.firstChild) {
      textElement.removeChild(textElement.firstChild);
    }

    // Apply data attributes
    textElement.setAttribute("data-appearance", this._state.appearance || "");
    textElement.setAttribute("data-size", this._state.size || "m");
    textElement.setAttribute("data-variant", this._state.variant || "text");

    // Apply inline styles if present
    if (this._state.style) {
      textElement.setAttribute("style", this._state.style);
    }

    // Handle loading state
    if (this._state.loading === "true" || this._state.loading === true) {
      const loadingAnimationContainer = document.createElement("div");
      loadingAnimationContainer.setAttribute("id", "loader-container");

      const loadingAnimation = document.createElement("div");
      loadingAnimation.setAttribute("id", "loader");
      loadingAnimation.setAttribute("data-appearance", this._state.appearance);
      loadingAnimation.setAttribute("data-size", this._state.size);
      loadingAnimation.setAttribute("disabled", true);

      loadingAnimationContainer.appendChild(loadingAnimation);
      textElement.appendChild(loadingAnimationContainer);
      return;
    }

    // Get the template from the shadow DOM
    const template = this.shadowRoot.querySelector("#text-template");
    if (!template) {
      console.error("Text template not found in shadow DOM");
      return;
    }

    // Clone the template
    const fragment = template.content.cloneNode(true);

    // Process left icon
    const leftIconEl = fragment.querySelector("#text-icon-left");
    if (this._state.iconLeft && leftIconEl) {
      this._state.iconLeft.split(" ").forEach((cls) => {
        leftIconEl.classList.add(cls);
      });
    } else if (this._state.iconElementLeft) {
      // Support for custom icon element
      try {
        const tempEl = document.createElement("div");
        tempEl.innerHTML = this._state.iconElementLeft.trim();
        if (leftIconEl && leftIconEl.parentNode) {
          leftIconEl.parentNode.replaceChild(tempEl.firstChild, leftIconEl);
        }
      } catch (error) {
        console.error("Failed to parse left icon element:", error);
      }
    } else if (leftIconEl) {
      leftIconEl.remove();
    }

    // Process text content
    const textContentEl = fragment.querySelector("#text-text");
    if (textContentEl) {
      if (this._state.text) {
        textContentEl.textContent = this._state.text;
        textContentEl.setAttribute("title", this._state.title || this._state.text);
      } else {
        textContentEl.remove();
      }
    }

    // Process right icon
    const rightIconEl = fragment.querySelector("#text-icon-right");
    if (this._state.iconRight && rightIconEl) {
      this._state.iconRight.split(" ").forEach((cls) => {
        rightIconEl.classList.add(cls);
      });
    } else if (this._state.iconElementRight) {
      // Support for custom icon element
      try {
        const tempEl = document.createElement("div");
        tempEl.innerHTML = this._state.iconElementRight.trim();
        if (rightIconEl && rightIconEl.parentNode) {
          rightIconEl.parentNode.replaceChild(tempEl.firstChild, rightIconEl);
        }
      } catch (error) {
        console.error("Failed to parse right icon element:", error);
      }
    } else if (rightIconEl) {
      rightIconEl.remove();
    }

    // Add the fragment to the text element
    textElement.appendChild(fragment);

    // Handle variant-specific behavior
    if (this._state.variant === "link" && this._state.href) {
      textElement.classList.add("text-link");
      textElement.style.cursor = "pointer";
    }
  }

  /**
   * For backward compatibility
   */
  render() {
    this._render();
  }

  /**
   * Initialize tooltip
   * @private
   */
  _initTooltip() {
    // Don't initialize if tooltip property is empty or tippy.js is unavailable
    if ((!this._state.tooltip && !this._state.tooltipHtml) || !this.tippy) {
      return;
    }

    // Destroy existing tooltip instance
    this._destroyTippy();

    // Get the text element
    const textElement = this.shadowRoot.querySelector(".text");
    if (!textElement) return;

    // Get validated tooltip configuration
    const config = this._getTippyConfig();

    // Initialize new tooltip
    this.tippyInstance = this.tippy(textElement, {
      ...config,
      delay: this._state.tooltipDelay || 0,
      duration: this._state.tooltipDuration || 200,
      maxWidth: this._state.tooltipMaxWidth || 350,
      offset: this._parseOffset(this._state.tooltipOffset),
      arrow: this._state.tooltipArrow !== false,
      interactive: this._state.tooltipInteractive || false,
    });
  }

  /**
   * Update tooltip configuration
   * @private
   */
  _updateTooltip() {
    if (!this.tippyInstance) {
      this._initTooltip();
      return;
    }

    const config = this._getTippyConfig();

    this.tippyInstance.setProps({
      ...config,
      delay: this._state.tooltipDelay || 0,
      duration: this._state.tooltipDuration || 200,
      maxWidth: this._state.tooltipMaxWidth || 350,
      offset: this._parseOffset(this._state.tooltipOffset),
      arrow: this._state.tooltipArrow !== false,
      interactive: this._state.tooltipInteractive || false,
    });
  }

  /**
   * Get validated tooltip configuration
   * @private
   * @returns {Object} Tooltip configuration object
   */
  _getTippyConfig() {
    const validatedProps = this._validateTooltipProps();
    const tooltipClasses = [`tippy-${validatedProps.appearance}`, `tippy-${validatedProps.size}`, `tippy-${validatedProps.shape}`];

    if (this._state.tooltipClass) {
      tooltipClasses.push(this._state.tooltipClass);
    }

    return {
      content: this._state.tooltipHtml || this._state.tooltip,
      allowHTML: Boolean(this._state.tooltipHtml),
      placement: validatedProps.position || "auto",
      theme: validatedProps.appearance,
      trigger: validatedProps.trigger || "click",
      appendTo: () => this.shadowRoot,
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

  /**
   * Validate tooltip properties
   * @private
   * @returns {Object} Validated tooltip properties
   */
  _validateTooltipProps() {
    return {
      appearance: TEXT_CONFIG.APPEARANCES.includes(this._state.tooltipAppearance) ? this._state.tooltipAppearance : this._state.appearance || "primary",
      size: TEXT_CONFIG.SIZES.includes(this._state.tooltipSize) ? this._state.tooltipSize : this._state.size || "m",
      shape: TEXT_CONFIG.SHAPES.includes(this._state.tooltipShape) ? this._state.tooltipShape : this._state.shape || "curved",
      position: TEXT_CONFIG.TOOLTIP_POSITIONS.includes(this._state.tooltipPosition) ? this._state.tooltipPosition : "top",
      trigger: TEXT_CONFIG.TOOLTIP_TRIGGERS.includes(this._state.tooltipTrigger) ? this._state.tooltipTrigger : "click",
    };
  }

  /**
   * Parse tooltip offset
   * @private
   * @param {Array|string} offset - Offset value
   * @returns {Array} Parsed offset array
   */
  _parseOffset(offset) {
    if (typeof offset === "string") {
      try {
        return JSON.parse(offset);
      } catch {
        return [0, 10];
      }
    }
    return offset || [0, 10];
  }

  /**
   * Destroy tooltip instance
   * @private
   */
  _destroyTippy() {
    if (this.tippyInstance) {
      this.tippyInstance.destroy();
      this.tippyInstance = null;
    }
  }
}

// Register the component with improved error handling
try {
  customElements.define("app-text", AppTextComponent);
  console.log("Text component registered successfully");
} catch (error) {
  console.warn("Text component registration issue:", error.message);
}
