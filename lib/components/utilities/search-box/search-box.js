/**
 * Search Box Component - A trigger button that opens a keyboard-driven "search and jump" palette.
 * Press the shortcut (Ctrl K by default) from anywhere on the page, type to filter, use the
 * arrow keys to move and Enter to run. Actions can scroll to a section, open a link, call a
 * function or dispatch an event.
 * Using the BaseComponent architecture for consistency and improved functionality
 *
 * Actions come from two places and are merged:
 *  1. `sources`: a CSS selector. Every matching element becomes a "jump to" action. The label is read
 *     from data-search-label, then aria-label, then the first heading (or app-text) inside it.
 *  2. `actions`: a JSON array (attribute) or an array of objects (property / setActions()).
 *     { label, hint, group, icon, keywords, selector | href [+ target] | call | event [+ detail] | run }
 *
 * Behaviour: `scroll-offset` leaves room for a sticky header, `focus-target` moves keyboard focus to the target,
 * `update-hash` writes the target id to the URL.
 *
 * Events (all bubble and are composed):
 *  - search-box-open, search-box-close
 *  - search-box-query   detail: { query, count }
 *  - search-box-select  detail: { action, query }   (cancelable: preventDefault() skips the default behaviour)
 */
import { BaseComponent } from "../../../utils/BaseComponent.js";
import { isEmptyValue } from "../../../utils/helper.js";
import searchBoxCssTemplate from "./search-box.css";
import searchBoxHtmlTemplate from "./search-box.html";

// Centralize configuration constants
export const SEARCH_BOX_CONFIG = {
  APPEARANCES: ["primary", "secondary", "tertiary", "outlined", "mono"],
  SIZES: ["xs", "s", "m", "l", "xl"],
  SHAPES: ["rounded", "curved", "rectangle"],
  VARIANTS: ["button", "icon", "input"],
  MATCHES: ["includes", "starts-with", "fuzzy"],
  POSITIONS: ["top", "center"],
  BACKDROPS: ["blur", "dim", "none"],
  SCROLL_BEHAVIORS: ["smooth", "auto"],
};

// Default value for every attribute (used on first load and when an attribute is removed)
const DEFAULTS = {
  id: "search-box",
  appearance: "outlined",
  size: "m",
  shape: "curved",
  style: "",
  disabled: false,
  variant: "button",
  label: "Search",
  placeholder: "Search or jump to...",
  iconLeft: "fas fa-search",
  shortcut: "mod+k",
  showShortcut: true,
  slashShortcut: false,
  actions: [],
  sources: "",
  sourceHint: "section",
  sourceGroup: "Sections",
  match: "includes",
  maxResults: 0,
  emptyText: "Nothing matches. Try a different search.",
  modalLabel: "Search",
  modalPosition: "top",
  modalWidth: "36rem",
  backdrop: "blur",
  showGroups: true,
  showHints: true,
  showFooter: true,
  footerText: "Arrow keys to move, Enter to select, Esc to close",
  closeOnSelect: true,
  scrollBehavior: "smooth",
  scrollOffset: 0,
  compactBelow: 640,
  updateHash: false,
  focusTarget: true,
  open: false,
};

const BOOLEAN_ATTRIBUTES = ["disabled", "show-shortcut", "slash-shortcut", "show-groups", "show-hints", "show-footer", "close-on-select", "update-hash", "focus-target", "open"];
const NUMBER_ATTRIBUTES = ["max-results", "scroll-offset", "compact-below"];
const ENUM_ATTRIBUTES = {
  appearance: SEARCH_BOX_CONFIG.APPEARANCES,
  size: SEARCH_BOX_CONFIG.SIZES,
  shape: SEARCH_BOX_CONFIG.SHAPES,
  variant: SEARCH_BOX_CONFIG.VARIANTS,
  match: SEARCH_BOX_CONFIG.MATCHES,
  "modal-position": SEARCH_BOX_CONFIG.POSITIONS,
  backdrop: SEARCH_BOX_CONFIG.BACKDROPS,
  "scroll-behavior": SEARCH_BOX_CONFIG.SCROLL_BEHAVIORS,
};

const MODIFIER_ALIASES = {
  ctrl: "ctrl",
  control: "ctrl",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  alt: "alt",
  option: "alt",
  shift: "shift",
  mod: "mod",
};

const isApplePlatform = () => {
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
};

export class AppSearchBoxComponent extends BaseComponent {
  constructor(
    props = {
      id: "search-box",
      appearance: "outlined",
      size: "m",
      shape: "curved",
      style: "",
      disabled: false,
    },
    basePath = "/components/utilities/search-box",
  ) {
    super();

    // Template properties
    this.templateHtml = searchBoxHtmlTemplate;
    this.templateStyles = [searchBoxCssTemplate];

    // Component state
    this._state = { ...DEFAULTS, actions: [] };

    // Actions supplied through the `actions` attribute and through setActions()/addAction()
    this._attributeActions = [];
    this._programmaticActions = [];

    // Result list state
    this._results = [];
    this._selectedIndex = 0;
    this._query = "";
    this._isOpen = false;
    this._reflectingOpen = false;
    this._mediaQuery = null;
    this._compact = false;
    this._compactApplied = null;

    // Bound event handlers
    this._boundHandleDocumentKeydown = this._handleDocumentKeydown.bind(this);
    this._boundHandleCompactChange = this._handleCompactChange.bind(this);

    // For backward compatibility
    this.props = props;
    this.basePath = basePath;

    // A value set on the element before it was upgraded would otherwise shadow the accessor below
    this._upgradeProperty("actions");
  }

  /**
   * Re-apply a property that was assigned before the custom element definition was loaded
   * @private
   */
  _upgradeProperty(name) {
    if (Object.prototype.hasOwnProperty.call(this, name)) {
      const value = this[name];
      delete this[name];
      this[name] = value;
    }
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
      "disabled",
      // Trigger attributes
      "variant",
      "label",
      "placeholder",
      "icon-left",
      "shortcut",
      "show-shortcut",
      "slash-shortcut",
      "compact-below",
      // Action attributes
      "actions",
      "sources",
      "source-hint",
      "source-group",
      // Search attributes
      "match",
      "max-results",
      "empty-text",
      // Palette attributes
      "modal-label",
      "modal-position",
      "modal-width",
      "backdrop",
      "show-groups",
      "show-hints",
      "show-footer",
      "footer-text",
      // Behaviour attributes
      "close-on-select",
      "scroll-behavior",
      "scroll-offset",
      "update-hash",
      "focus-target",
      "open",
    ];
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Moving the element in the DOM disconnects and reconnects it. Only attach the global listeners
   * again instead of building the shadow DOM a second time.
   */
  async connectedCallback() {
    if (this._initialized) {
      this._attachGlobalListeners();
      this._updateCompact();
      return;
    }
    await super.connectedCallback();
  }

  /**
   * Component initialization once the template and attributes are ready
   */
  async onInit() {
    if (this._state.open) {
      this.open();
    }
  }

  /**
   * Set up event listeners for the component
   * @override
   */
  _setupEventListeners() {
    this._attachGlobalListeners();
  }

  _attachGlobalListeners() {
    document.addEventListener("keydown", this._boundHandleDocumentKeydown);
  }

  /**
   * Clean up when component is disconnected
   * @override
   */
  _cleanup() {
    document.removeEventListener("keydown", this._boundHandleDocumentKeydown);
    if (this._mediaQuery) {
      this._mediaQuery.removeEventListener("change", this._boundHandleCompactChange);
      this._mediaQuery = null;
      this._compactApplied = null;
    }
    if (this._isOpen) {
      this.close();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Attributes                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Handle attribute changes
   * @override
   */
  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue === newValue && this._initialized) return;
    if (name === "open" && this._reflectingOpen) return;

    const camelName = this._camelCase(name);
    const raw = this.getAttribute(name);

    // Update props (for backward compatibility)
    this.props[name] = raw;

    if (BOOLEAN_ATTRIBUTES.includes(name)) {
      this._state[camelName] = this._toBoolean(raw, DEFAULTS[camelName]);
    } else if (NUMBER_ATTRIBUTES.includes(name)) {
      this._state[camelName] = this._toNumber(raw, DEFAULTS[camelName]);
    } else if (ENUM_ATTRIBUTES[name]) {
      this._state[camelName] = ENUM_ATTRIBUTES[name].includes(raw) ? raw : DEFAULTS[camelName];
    } else if (name === "actions") {
      this._attributeActions = this._parseActions(raw);
    } else {
      this._state[camelName] = raw === null ? DEFAULTS[camelName] : raw;
    }

    if (name === "open") {
      if (this._initialized) {
        this._state.open ? this.open() : this.close();
      }
      return;
    }

    this._render();

    // Keep an open palette in sync with changes that affect its content
    if (this._isOpen && ["actions", "sources", "source-hint", "source-group", "match", "max-results", "empty-text", "show-groups", "show-hints", "show-footer", "footer-text", "placeholder"].includes(name)) {
      this._refreshResults();
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
        this._handleAttributeChange(attr, null, this.getAttribute(attr));
      }
    });
  }

  _toBoolean(value, fallback) {
    if (value === null || value === undefined) return fallback;
    return !["false", "0", "off", "no"].includes(String(value).trim().toLowerCase());
  }

  _toNumber(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Create the DOM from the template once and wire up its events
   * @private
   */
  _ensureDom() {
    if (!this.shadowRoot) return null;

    // Get or create the component root
    let root = this.shadowRoot.querySelector(".component-root");
    if (!root) {
      root = document.createElement("div");
      root.className = "component-root";
      this.shadowRoot.appendChild(root);
    }

    if (!root.querySelector(".search-box")) {
      // Get the template from shadow DOM
      const template = this.shadowRoot.querySelector("#search-box-template");
      if (!template) {
        console.error("Search box template not found in shadow DOM");
        return null;
      }

      root.appendChild(template.content.cloneNode(true));
      this._bindDomEvents(root);
    }

    return root.querySelector(".search-box");
  }

  /**
   * Render the component
   * @override
   */
  _render() {
    const container = this._ensureDom();
    if (!container) return;

    const state = this._state;
    const trigger = this.$("#search-box-trigger");
    const dialog = this.$("#search-box-dialog");

    // Set core attributes
    container.id = state.id || DEFAULTS.id;
    if (state.style) {
      container.style.cssText = state.style;
    } else {
      container.removeAttribute("style");
    }
    container.style.setProperty("--search-box-width", state.modalWidth || DEFAULTS.modalWidth);

    // Set data attributes for styling
    container.setAttribute("data-appearance", state.appearance);
    container.setAttribute("data-size", state.size);
    container.setAttribute("data-shape", state.shape);
    container.setAttribute("data-variant", state.variant);
    container.setAttribute("data-show-shortcut", String(this._hasShortcut() && state.showShortcut));
    dialog.setAttribute("data-position", state.modalPosition);
    dialog.setAttribute("data-backdrop", state.backdrop);

    // Trigger content
    const icon = this.$("#search-box-icon");
    icon.className = `search-box-icon ${state.iconLeft || ""}`.trim();
    icon.style.display = state.iconLeft ? "" : "none";

    const label = this.$("#search-box-label");
    label.textContent = state.label || "";
    label.style.display = state.label ? "" : "none";

    this.$("#search-box-shortcut").textContent = this._formatShortcut();

    // Icon-only presentation (explicit variant, or no label at all)
    const iconOnly = state.variant === "icon" || !state.label;
    container.setAttribute("data-icon-only", String(iconOnly && state.variant !== "input"));

    // Trigger state and accessible name
    trigger.disabled = Boolean(state.disabled);
    if (state.disabled) {
      trigger.setAttribute("aria-disabled", "true");
    } else {
      trigger.removeAttribute("aria-disabled");
    }
    const accessibleName = state.label || state.placeholder || state.modalLabel;
    const shortcutText = this._hasShortcut() ? this._formatShortcut() : "";
    trigger.setAttribute("aria-label", shortcutText ? `${accessibleName} (${shortcutText})` : accessibleName);
    if (this._hasShortcut()) {
      trigger.setAttribute("aria-keyshortcuts", this._ariaShortcut());
    } else {
      trigger.removeAttribute("aria-keyshortcuts");
    }

    // Palette content
    dialog.setAttribute("aria-label", state.modalLabel || DEFAULTS.modalLabel);
    this.$("#search-box-input").setAttribute("placeholder", state.placeholder || "");
    this.$("#search-box-input").setAttribute("aria-label", state.placeholder || state.modalLabel);
    this.$("#search-box-field-icon").className = `search-box-field-icon ${state.iconLeft || ""}`.trim();

    const footer = this.$("#search-box-footer");
    footer.textContent = state.footerText || "";
    footer.hidden = !(state.showFooter && state.footerText);

    this._updateCompact();
  }

  /* ------------------------------------------------------------------ */
  /* DOM events                                                          */
  /* ------------------------------------------------------------------ */

  _bindDomEvents(root) {
    const trigger = root.querySelector("#search-box-trigger");
    const dialog = root.querySelector("#search-box-dialog");
    const input = root.querySelector("#search-box-input");
    const list = root.querySelector("#search-box-list");

    trigger.addEventListener("click", () => this.open());

    input.addEventListener("input", () => {
      this._query = input.value;
      this._selectedIndex = 0;
      this._refreshResults();
    });
    input.addEventListener("keydown", (event) => this._handleInputKeydown(event));

    list.addEventListener("click", (event) => {
      const option = event.target.closest("[data-index]");
      if (option) this._selectIndex(Number(option.dataset.index));
    });
    list.addEventListener("pointermove", (event) => {
      const option = event.target.closest("[data-index]");
      if (!option) return;
      const index = Number(option.dataset.index);
      if (index !== this._selectedIndex) this._setSelected(index, false);
    });

    // A click on the backdrop reports the dialog itself as the target
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) this.close();
    });
    dialog.addEventListener("close", () => this._handleDialogClosed());
  }

  _handleInputKeydown(event) {
    const count = this._results.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (count) this._setSelected((this._selectedIndex + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (count) this._setSelected((this._selectedIndex - 1 + count) % count);
        break;
      case "PageDown":
        event.preventDefault();
        if (count) this._setSelected(Math.min(this._selectedIndex + 5, count - 1));
        break;
      case "PageUp":
        event.preventDefault();
        if (count) this._setSelected(Math.max(this._selectedIndex - 5, 0));
        break;
      case "Home":
        if (count && this._query === "") {
          event.preventDefault();
          this._setSelected(0);
        }
        break;
      case "End":
        if (count && this._query === "") {
          event.preventDefault();
          this._setSelected(count - 1);
        }
        break;
      case "Enter":
        event.preventDefault();
        if (count) this._selectIndex(this._selectedIndex);
        break;
      default:
        break;
    }
  }

  _handleDocumentKeydown(event) {
    if (this._state.disabled || event.defaultPrevented || event.isComposing) return;

    if (this._hasShortcut() && this._matchesShortcut(event)) {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (this._state.slashShortcut && event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !this._isTypingTarget(event)) {
      event.preventDefault();
      this.open();
    }
  }

  _isTypingTarget(event) {
    const target = event.composedPath?.()[0] || event.target;
    if (!target || !target.tagName) return false;
    return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
  }

  /* ------------------------------------------------------------------ */
  /* Shortcut                                                            */
  /* ------------------------------------------------------------------ */

  _hasShortcut() {
    return Boolean(this._state.shortcut && this._state.shortcut.trim());
  }

  _parseShortcut() {
    const parsed = { key: "", ctrl: false, meta: false, alt: false, shift: false, mod: false };
    this._state.shortcut
      .toLowerCase()
      .split("+")
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        const modifier = MODIFIER_ALIASES[token];
        if (modifier) {
          parsed[modifier] = true;
        } else {
          parsed.key = token === "esc" ? "escape" : token === "space" ? " " : token;
        }
      });
    return parsed;
  }

  _matchesShortcut(event) {
    const shortcut = this._parseShortcut();
    if (!shortcut.key || event.key.toLowerCase() !== shortcut.key) return false;
    if (event.altKey !== shortcut.alt || event.shiftKey !== shortcut.shift) return false;

    if (shortcut.mod) {
      return event.ctrlKey || event.metaKey;
    }
    return event.ctrlKey === shortcut.ctrl && event.metaKey === shortcut.meta;
  }

  _formatShortcut() {
    if (!this._hasShortcut()) return "";
    const shortcut = this._parseShortcut();
    const apple = isApplePlatform();
    const parts = [];

    if (shortcut.mod) parts.push(apple ? "⌘" : "Ctrl");
    if (shortcut.ctrl) parts.push(apple ? "⌃" : "Ctrl");
    if (shortcut.meta) parts.push(apple ? "⌘" : "Win");
    if (shortcut.alt) parts.push(apple ? "⌥" : "Alt");
    if (shortcut.shift) parts.push(apple ? "⇧" : "Shift");
    if (shortcut.key) parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1));

    return apple ? parts.join("") : parts.join(" ");
  }

  _ariaShortcut() {
    const shortcut = this._parseShortcut();
    const parts = [];
    if (shortcut.mod || shortcut.ctrl) parts.push("Control");
    if (shortcut.meta) parts.push("Meta");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join("+");
  }

  /* ------------------------------------------------------------------ */
  /* Compact mode (icon only on small screens)                           */
  /* ------------------------------------------------------------------ */

  _updateCompact() {
    const container = this.$(".search-box");
    if (!container) return;

    const below = this._state.compactBelow;
    if (this._compactApplied !== below) {
      if (this._mediaQuery) {
        this._mediaQuery.removeEventListener("change", this._boundHandleCompactChange);
        this._mediaQuery = null;
      }
      if (below > 0 && window.matchMedia) {
        this._mediaQuery = window.matchMedia(`(max-width: ${below}px)`);
        this._mediaQuery.addEventListener("change", this._boundHandleCompactChange);
        this._compact = this._mediaQuery.matches;
      } else {
        this._compact = false;
      }
      this._compactApplied = below;
    }

    container.setAttribute("data-compact", String(this._compact));
  }

  _handleCompactChange(event) {
    this._compact = event.matches;
    this.$(".search-box")?.setAttribute("data-compact", String(this._compact));
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */

  _parseActions(raw) {
    if (isEmptyValue(raw)) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`[${this.tagName}] The "actions" attribute must be a JSON array.`, error.message);
      return [];
    }
  }

  /**
   * Turn an element matched by `sources` into an action
   * @private
   */
  _discoverSourceActions() {
    const selector = this._state.sources;
    if (isEmptyValue(selector)) return [];

    const scope = this.getRootNode && this.getRootNode().querySelectorAll ? this.getRootNode() : document;
    let elements = [];
    try {
      elements = Array.from(scope.querySelectorAll(selector));
    } catch (error) {
      console.warn(`[${this.tagName}] Invalid "sources" selector: ${selector}`);
      return [];
    }

    return elements
      .map((element) => ({
        label: this._readElementLabel(element),
        hint: element.getAttribute("data-search-hint") || this._state.sourceHint,
        group: element.getAttribute("data-search-group") || this._state.sourceGroup,
        keywords: element.getAttribute("data-search-keywords") || "",
        icon: element.getAttribute("data-search-icon") || "",
        element,
      }))
      .filter((action) => action.label);
  }

  _readElementLabel(element) {
    const explicit = element.getAttribute("data-search-label") || element.getAttribute("aria-label");
    if (explicit) return explicit.trim();

    const heading = element.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();

    const text = element.querySelector("app-text[text]");
    if (text) return text.getAttribute("text").trim();

    return element.id || "";
  }

  _normalizeAction(action, index) {
    if (!action || typeof action !== "object") return null;
    const label = String(action.label ?? "").trim();
    if (!label) return null;

    const keywords = Array.isArray(action.keywords) ? action.keywords.join(" ") : String(action.keywords ?? "");
    return {
      ...action,
      id: action.id ?? `action-${index}`,
      label,
      hint: action.hint ?? "",
      group: action.group ?? "",
      icon: action.icon ?? "",
      keywords,
    };
  }

  _getAllActions() {
    return [...this._discoverSourceActions(), ...this._attributeActions, ...this._programmaticActions]
      .map((action, index) => this._normalizeAction(action, index))
      .filter(Boolean)
      .filter((action) => !action.disabled);
  }

  /**
   * Replace the programmatic actions. Accepts functions through `run`, which the JSON attribute cannot carry.
   * @param {Array<Object>} actions
   */
  setActions(actions) {
    this._programmaticActions = Array.isArray(actions) ? actions : [];
    if (this._isOpen) this._refreshResults();
  }

  /**
   * Add a single programmatic action
   * @param {Object} action
   */
  addAction(action) {
    this._programmaticActions.push(action);
    if (this._isOpen) this._refreshResults();
  }

  /**
   * Remove programmatic actions by id or label
   * @param {string} idOrLabel
   */
  removeAction(idOrLabel) {
    this._programmaticActions = this._programmaticActions.filter((action) => action.id !== idOrLabel && action.label !== idOrLabel);
    if (this._isOpen) this._refreshResults();
  }

  /**
   * All current actions: discovered, attribute and programmatic
   * @returns {Array<Object>}
   */
  getActions() {
    return this._getAllActions();
  }

  get actions() {
    return this._programmaticActions;
  }

  set actions(value) {
    this.setActions(value);
  }

  /** Re-read the `sources` selector, for content that was added after the page loaded */
  refresh() {
    if (this._isOpen) this._refreshResults();
  }

  /* ------------------------------------------------------------------ */
  /* Search                                                              */
  /* ------------------------------------------------------------------ */

  _score(action, terms) {
    const label = action.label.toLowerCase();
    const extra = `${action.keywords} ${action.hint} ${action.group}`.toLowerCase();
    const mode = this._state.match;
    let total = 0;

    for (const term of terms) {
      let score = 0;
      const labelWords = label.split(/[\s\-_/]+/);

      if (label.startsWith(term)) score = 100;
      else if (labelWords.some((word) => word.startsWith(term))) score = 80;
      else if (mode !== "starts-with" && label.includes(term)) score = 60;
      else if (extra.split(/[\s\-_/,]+/).some((word) => word.startsWith(term))) score = 40;
      else if (mode !== "starts-with" && extra.includes(term)) score = 30;
      else if (mode === "fuzzy" && this._isSubsequence(term, label)) score = 20;

      if (!score) return 0;
      total += score;
    }
    return total;
  }

  _isSubsequence(term, text) {
    let position = 0;
    for (const char of text) {
      if (char === term[position]) position += 1;
      if (position === term.length) return true;
    }
    return false;
  }

  _search(query) {
    const actions = this._getAllActions();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    let results = actions;
    if (terms.length) {
      results = actions
        .map((action, index) => ({ action, index, score: this._score(action, terms) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((entry) => entry.action);
    }

    const max = this._state.maxResults;
    return max > 0 ? results.slice(0, max) : results;
  }

  _refreshResults() {
    const list = this.$("#search-box-list");
    if (!list) return;

    this._results = this._search(this._query);
    this._selectedIndex = Math.min(this._selectedIndex, Math.max(this._results.length - 1, 0));

    const state = this._state;
    const showGroups = state.showGroups && this._query.trim() === "";
    const fragment = document.createDocumentFragment();
    let lastGroup = null;

    this._results.forEach((action, index) => {
      if (showGroups && action.group && action.group !== lastGroup) {
        const heading = document.createElement("li");
        heading.className = "search-box-group";
        heading.setAttribute("role", "presentation");
        heading.textContent = action.group;
        fragment.appendChild(heading);
      }
      lastGroup = action.group;

      const option = document.createElement("li");
      option.className = "search-box-option";
      option.id = `search-box-option-${index}`;
      option.dataset.index = String(index);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(index === this._selectedIndex));

      if (action.icon) {
        const icon = document.createElement("i");
        icon.className = `search-box-option-icon ${action.icon}`;
        icon.setAttribute("aria-hidden", "true");
        option.appendChild(icon);
      }

      const text = document.createElement("span");
      text.className = "search-box-option-label";
      text.textContent = action.label;
      option.appendChild(text);

      if (state.showHints && action.hint) {
        const hint = document.createElement("span");
        hint.className = "search-box-option-hint";
        hint.textContent = action.hint;
        option.appendChild(hint);
      }

      fragment.appendChild(option);
    });

    list.replaceChildren(fragment);

    const empty = this.$("#search-box-empty");
    empty.textContent = state.emptyText;
    empty.hidden = this._results.length > 0;
    list.hidden = this._results.length === 0;

    const input = this.$("#search-box-input");
    input.setAttribute("aria-activedescendant", this._results.length ? `search-box-option-${this._selectedIndex}` : "");

    this.$("#search-box-status").textContent = this._results.length ? `${this._results.length} ${this._results.length === 1 ? "result" : "results"}` : state.emptyText;

    this.emit("search-box-query", { query: this._query, count: this._results.length });
  }

  _setSelected(index, scroll = true) {
    const options = this.$$(".search-box-option");
    options.forEach((option) => option.setAttribute("aria-selected", String(Number(option.dataset.index) === index)));
    this._selectedIndex = index;
    this.$("#search-box-input").setAttribute("aria-activedescendant", `search-box-option-${index}`);

    if (scroll) {
      this.$(`#search-box-option-${index}`)?.scrollIntoView({ block: "nearest" });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Opening and closing                                                 */
  /* ------------------------------------------------------------------ */

  /** Open the palette */
  open() {
    if (this._isOpen || this._state.disabled) return;
    if (!this._ensureDom()) return;

    const dialog = this.$("#search-box-dialog");
    const input = this.$("#search-box-input");

    this._query = "";
    this._selectedIndex = 0;
    input.value = "";
    this._refreshResults();

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    this._isOpen = true;
    this._state.open = true;
    this.$("#search-box-trigger").setAttribute("aria-expanded", "true");
    this._reflectOpenAttribute(true);

    input.focus();
    this.emit("search-box-open", {});
  }

  /** Close the palette */
  close() {
    const dialog = this.$("#search-box-dialog");
    if (!dialog || !this._isOpen) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      this._handleDialogClosed();
    }
  }

  /** Open the palette if it is closed, close it if it is open */
  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  get isOpen() {
    return this._isOpen;
  }

  /** Move focus to the trigger button */
  focus(options) {
    this.$("#search-box-trigger")?.focus(options);
  }

  _handleDialogClosed() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._state.open = false;
    this.$("#search-box-trigger")?.setAttribute("aria-expanded", "false");
    this._reflectOpenAttribute(false);
    this.emit("search-box-close", {});
  }

  _reflectOpenAttribute(open) {
    this._reflectingOpen = true;
    if (open) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
    this._reflectingOpen = false;
  }

  /* ------------------------------------------------------------------ */
  /* Running an action                                                   */
  /* ------------------------------------------------------------------ */

  _selectIndex(index) {
    const action = this._results[index];
    if (!action) return;

    const query = this._query;
    const detail = { action: this._publicAction(action), query };
    const event = this.emit("search-box-select", detail);

    if (this._state.closeOnSelect) this.close();
    if (event.defaultPrevented) return;

    this._runAction(action, detail);
  }

  _publicAction(action) {
    const { element, run, ...rest } = action;
    return { ...rest, element, run };
  }

  _runAction(action, detail) {
    if (typeof action.run === "function") {
      action.run(detail);
    } else if (action.element) {
      this._scrollToElement(action.element);
    } else if (action.selector) {
      const target = this._resolveTarget(action.selector);
      if (target) this._scrollToElement(target);
    } else if (action.call) {
      this._callFunction(action.call, detail);
    } else if (action.href) {
      this._openLink(action.href, action.target);
    } else if (action.event) {
      this.emit(action.event, action.detail ?? { action: detail.action });
    }
  }

  _resolveTarget(selector) {
    try {
      const root = this.getRootNode && this.getRootNode().querySelector ? this.getRootNode() : document;
      return root.querySelector(selector) || document.querySelector(selector);
    } catch (error) {
      console.warn(`[${this.tagName}] Invalid selector: ${selector}`);
      return null;
    }
  }

  _callFunction(path, detail) {
    const fn = String(path)
      .split(".")
      .reduce((scope, key) => (scope ? scope[key] : undefined), window);
    if (typeof fn === "function") {
      fn(detail);
    } else {
      console.warn(`[${this.tagName}] "${path}" is not a function on window.`);
    }
  }

  _openLink(href, target) {
    if (href.startsWith("#")) {
      const element = href.length > 1 ? this._resolveTarget(href) : null;
      if (element) this._scrollToElement(element);
      return;
    }

    if (/^(mailto|tel):/i.test(href)) {
      window.location.href = href;
      return;
    }

    let sameOrigin = false;
    try {
      sameOrigin = new URL(href, window.location.href).origin === window.location.origin;
    } catch (error) {
      sameOrigin = false;
    }

    const finalTarget = target || (sameOrigin ? "_self" : "_blank");
    if (finalTarget === "_self") {
      window.location.assign(href);
    } else {
      window.open(href, finalTarget, "noopener,noreferrer");
    }
  }

  /**
   * Scroll an element into view inside whichever container actually scrolls (the window or an
   * ancestor with overflow), leaving `scroll-offset` pixels free for a fixed or sticky header.
   * @private
   */
  _scrollToElement(element) {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduceMotion ? "auto" : this._state.scrollBehavior;
    const offset = this._state.scrollOffset;
    const scrollParent = this._getScrollParent(element);
    const elementTop = element.getBoundingClientRect().top;

    if (scrollParent) {
      const parentTop = scrollParent.getBoundingClientRect().top;
      scrollParent.scrollBy({ top: elementTop - parentTop - offset, behavior });
    } else {
      window.scrollBy({ top: elementTop - offset, behavior });
    }

    // Move keyboard focus to the target so screen readers announce it. The browser's focus ring is
    // hidden while the target is focused, so the host page's own design is left untouched.
    if (this._state.focusTarget) {
      if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
      const previousOutline = element.style.outline;
      element.style.outline = "none";
      element.addEventListener("blur", () => (element.style.outline = previousOutline), { once: true });
      element.focus({ preventScroll: true });
    }

    if (this._state.updateHash && element.id) {
      history.replaceState(null, "", `#${element.id}`);
    }
  }

  _getScrollParent(element) {
    let node = element.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      const overflowY = getComputedStyle(node).overflowY;
      if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* For backward compatibility                                          */
  /* ------------------------------------------------------------------ */

  render() {
    this._render();
  }

  getElement() {
    if (!this.shadowRoot) return null;
    return this.shadowRoot.querySelector(".search-box");
  }

  getTemplate() {
    return this.shadowRoot.querySelector("#search-box-template");
  }

  getTemplateClone(template) {
    return template.content.cloneNode(true);
  }
}

// Register the component with improved error handling
try {
  customElements.define("app-search-box", AppSearchBoxComponent);
  console.log("Search Box component registered successfully");
} catch (error) {
  console.warn("Search Box component registration issue:", error.message);
}
