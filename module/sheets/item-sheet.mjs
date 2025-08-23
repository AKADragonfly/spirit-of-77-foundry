import { SPIRIT77 } from "../helpers/config.mjs";

/**
 * Extend the basic ItemSheet with Spirit of '77 specific functionality
 * @extends {foundry.appv1.sheets.ItemSheet}
 */
export class Spirit77ItemSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["spirit77", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      submitOnChange: false,  // Prevent auto-submission on every keystroke
      submitOnClose: true
    });
  }

  /** @override */
  get template() {
    const path = "systems/spirit-of-77/templates/item";
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /** @override */
  getData() {
    // Retrieve base data structure
    const context = super.getData();

    // CRITICAL FIX: With corrected template.json, item data is directly on system
    // So we need to pass the system data directly to the template
    const itemData = context.item.system;  // Access system data directly

    console.log('Item data in getData:', itemData);

    // Retrieve the roll data for TinyMCE editors
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add configuration data
    context.config = CONFIG.SPIRIT77;

    // Prepare type-specific data - pass system data directly
    this._prepareItemTypeData(context, itemData);

    // CRITICAL: Merge the system data into the context root so template can access it
    Object.assign(context, itemData);

    return context;
  }

  /**
   * Prepare type-specific data - Updated for corrected template.json structure
   */
  _prepareItemTypeData(context, itemData) {
    if (this.item.type === 'move') {
      // Prepare stat options for moves
      context.statOptions = [];
      const statKeys = ['might', 'hustle', 'brains', 'smooth', 'soul'];
      for (const key of statKeys) {
        context.statOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.stat === key  // Direct access, no system wrapper
        });
      }
    }

    if (this.item.type === 'gear') {
      // Prepare weapon range options for gear (if it's a weapon)
      context.rangeOptions = [];
      const ranges = ['close', 'reach', 'near', 'far'];
      for (const key of ranges) {
        context.rangeOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.range === key  // Direct access, no system wrapper
        });
      }

      // Ensure traits is an array
      if (!Array.isArray(itemData.traits)) {
        if (typeof itemData.traits === 'string') {
          itemData.traits = itemData.traits.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.traits = [];
        }
      }
    }

    if (this.item.type === 'thang') {
      // Prepare thang type options using CONFIG
      context.thangTypeOptions = [];
      for (const [key, label] of Object.entries(CONFIG.SPIRIT77.thangTypes || {})) {
        context.thangTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.thangType === key  // Direct access, no system wrapper
        });
      }

      // Prepare stat options for thangs
      context.statOptions = [];
      const statKeys = ['might', 'hustle', 'brains', 'smooth', 'soul'];
      for (const key of statKeys) {
        context.statOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.rollStat === key  // Direct access, no system wrapper
        });
      }
    }

    if (this.item.type === 'vehicle') {
      // Prepare vehicle type options using CONFIG
      context.vehicleTypeOptions = [];
      for (const [key, label] of Object.entries(CONFIG.SPIRIT77.vehicleTypes || {})) {
        context.vehicleTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.vehicleType === key  // Direct access, no system wrapper
        });
      }

      // Ensure traits is an array
      if (!Array.isArray(itemData.traits)) {
        if (typeof itemData.traits === 'string') {
          itemData.traits = itemData.traits.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.traits = [];
        }
      }
    }

    if (this.item.type === 'xtech') {
      // Ensure modifications is an array
      if (!Array.isArray(itemData.modifications)) {
        if (typeof itemData.modifications === 'string') {
          itemData.modifications = itemData.modifications.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.modifications = [];
        }
      }
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Handle rollable buttons
    html.find('.rollable').click(this._onRoll.bind(this));
  }

  /**
   * Handle roll buttons
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls
    if (dataset.rollType === 'item') {
      return this.item.roll();
    }
  }

  /**
   * SIMPLIFIED: Override the default update behavior to handle arrays properly
   */
  async _updateObject(event, formData) {
    console.log('Form submission - Raw form data:', formData);
    
    // Handle comma-separated arrays for traits and modifications
    if (formData['traits'] && typeof formData['traits'] === 'string') {
      formData['traits'] = formData['traits'].split(',').map(s => s.trim()).filter(s => s);
    }
    
    if (formData['modifications'] && typeof formData['modifications'] === 'string') {
      formData['modifications'] = formData['modifications'].split(',').map(s => s.trim()).filter(s => s);
    }

    // Process nested object data properly
    const processedData = foundry.utils.expandObject(formData);
    console.log('After expandObject:', processedData);
    
    // Update the object
    return this.object.update(processedData);
  }
}
