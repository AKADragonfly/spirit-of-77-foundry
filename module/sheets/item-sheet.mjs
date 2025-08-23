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

    // Use a safe clone of the item data for further operations
    const itemData = context.item;

    console.log('Item data in getData:', itemData.system);

    // Retrieve the roll data for TinyMCE editors
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add configuration data
    context.config = CONFIG.SPIRIT77;

    // Prepare type-specific data
    this._prepareItemTypeData(context);

    return context;
  }

  /**
   * Prepare type-specific data
   */
  _prepareItemTypeData(context) {
    const itemData = context.item;

    if (itemData.type === 'move') {
      // Prepare stat options for moves
      context.statOptions = [];
      const statKeys = ['might', 'hustle', 'brains', 'smooth', 'soul'];
      for (const key of statKeys) {
        context.statOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.system.stat === key
        });
      }

      // CRITICAL FIX: Ensure move result objects exist in the actual item data
      // Don't just ensure they exist in context, ensure they exist on the actual item
      const currentData = this.item.system;
      let needsUpdate = false;
      const updateData = {};

      if (!currentData.success || typeof currentData.success !== 'object') {
        updateData['system.success'] = { value: 10, text: '' };
        needsUpdate = true;
      }
      if (!currentData.partial || typeof currentData.partial !== 'object') {
        updateData['system.partial'] = { value: 7, text: '' };
        needsUpdate = true;
      }
      if (!currentData.failure || typeof currentData.failure !== 'object') {
        updateData['system.failure'] = { text: '' };
        needsUpdate = true;
      }

      // Apply the update immediately if needed, but don't await it
      if (needsUpdate) {
        console.log('Applying critical move data fix:', updateData);
        this.item.update(updateData);
      }
    }

    if (itemData.type === 'gear') {
      // Prepare weapon range options for gear (if it's a weapon)
      context.rangeOptions = [];
      const ranges = ['close', 'reach', 'near', 'far'];
      for (const key of ranges) {
        context.rangeOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.system.range === key
        });
      }

      // Ensure traits is an array
      if (!Array.isArray(itemData.system.traits)) {
        if (typeof itemData.system.traits === 'string') {
          itemData.system.traits = itemData.system.traits.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.system.traits = [];
        }
      }
    }

    if (itemData.type === 'thang') {
      // Prepare thang type options using CONFIG
      context.thangTypeOptions = [];
      for (const [key, label] of Object.entries(CONFIG.SPIRIT77.thangTypes || {})) {
        context.thangTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.thangType === key
        });
      }

      // Prepare stat options for thangs
      context.statOptions = [];
      const statKeys = ['might', 'hustle', 'brains', 'smooth', 'soul'];
      for (const key of statKeys) {
        context.statOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.system.rollStat === key
        });
      }
    }

    if (itemData.type === 'vehicle') {
      // Prepare vehicle type options using CONFIG
      context.vehicleTypeOptions = [];
      for (const [key, label] of Object.entries(CONFIG.SPIRIT77.vehicleTypes || {})) {
        context.vehicleTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.vehicleType === key
        });
      }

      // Ensure traits is an array
      if (!Array.isArray(itemData.system.traits)) {
        if (typeof itemData.system.traits === 'string') {
          itemData.system.traits = itemData.system.traits.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.system.traits = [];
        }
      }
    }

    if (itemData.type === 'xtech') {
      // Ensure modifications is an array
      if (!Array.isArray(itemData.system.modifications)) {
        if (typeof itemData.system.modifications === 'string') {
          itemData.system.modifications = itemData.system.modifications.split(',').map(s => s.trim()).filter(s => s);
        } else {
          itemData.system.modifications = [];
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

    // Handle form changes with debouncing to prevent excessive updates
    let debounceTimer;
    html.find('input, textarea, select').on('change', (event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this._onSubmit(event);
      }, 300); // 300ms delay
    });
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
   * Override the default update behavior to handle arrays and nested objects properly
   */
  async _updateObject(event, formData) {
    console.log('Form submission - Raw form data:', formData);
    
    // Handle comma-separated arrays for traits and modifications
    if (formData['system.traits'] && typeof formData['system.traits'] === 'string') {
      formData['system.traits'] = formData['system.traits'].split(',').map(s => s.trim()).filter(s => s);
    }
    
    if (formData['system.modifications'] && typeof formData['system.modifications'] === 'string') {
      formData['system.modifications'] = formData['system.modifications'].split(',').map(s => s.trim()).filter(s => s);
    }

    // Process nested object data properly
    const processedData = foundry.utils.expandObject(formData);
    console.log('After expandObject:', processedData);
    
    // CRITICAL FIX: Ensure we don't overwrite existing nested data
    // If we're updating move data, preserve existing nested objects
    if (this.item.type === 'move' && processedData.system) {
      const currentSystem = this.item.system;
      
      // Preserve existing success object while allowing updates
      if (processedData.system.success) {
        processedData.system.success = foundry.utils.mergeObject(
          currentSystem.success || { value: 10, text: '' }, 
          processedData.system.success || {}
        );
      }
      
      // Preserve existing partial object while allowing updates  
      if (processedData.system.partial) {
        processedData.system.partial = foundry.utils.mergeObject(
          currentSystem.partial || { value: 7, text: '' }, 
          processedData.system.partial || {}
        );
      }
      
      // Preserve existing failure object while allowing updates
      if (processedData.system.failure) {
        processedData.system.failure = foundry.utils.mergeObject(
          currentSystem.failure || { text: '' }, 
          processedData.system.failure || {}
        );
      }
    }
    
    // Update the object
    return this.object.update(processedData);
  }

  /** @override */
  async _onSubmit(event, options = {}) {
    // Prevent the default form submission behavior
    event.preventDefault();
    
    // Get the form data
    const formData = this._getSubmitData();
    
    // Update immediately without waiting
    return this._updateObject(event, formData);
  }
}
