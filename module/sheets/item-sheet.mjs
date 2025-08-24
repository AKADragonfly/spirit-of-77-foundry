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
      submitOnChange: true,  // CRITICAL: Enable auto-save on changes
      submitOnClose: true,   // Ensure data saves when closing
      closeOnSubmit: false   // Don't close when submitting
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

    console.log('=== ITEM SHEET getData ===');
    console.log('Item type:', itemData.type);
    console.log('Item system data:', itemData.system);
    console.log('Full item data structure:', JSON.stringify(itemData, null, 2));

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

    console.log('Final context being passed to template:', context);

    return context;
  }

  /**
   * Prepare type-specific data
   */
  _prepareItemTypeData(context) {
    const itemData = context.item;

    if (itemData.type === 'move') {
      // CRITICAL: Ensure all move data exists with defaults
      if (!itemData.system.success) itemData.system.success = { value: 10, text: '' };
      if (!itemData.system.partial) itemData.system.partial = { value: 7, text: '' };
      if (!itemData.system.failure) itemData.system.failure = { text: '' };
      
      console.log('Move data after defaults:', itemData.system);
      
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
    
    // CRITICAL: Add explicit change handlers for form fields
    html.find('input, select, textarea').change(this._onFieldChange.bind(this));
  }

  /**
   * Handle field changes and force immediate save
   */
  async _onFieldChange(event) {
    console.log('Field changed:', event.target.name, 'New value:', event.target.value);
    
    // Force submit the form to save changes immediately
    if (this.isEditable && !this._submitting) {
      this._submitting = true;
      try {
        await this.submit();
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        this._submitting = false;
      }
    }
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
   * CRITICAL: Completely rewritten update method to handle move data properly
   */
  async _updateObject(event, formData) {
    console.log('=== _updateObject called ===');
    console.log('Event:', event);
    console.log('Raw form data:', formData);
    console.log('Current item data before update:', this.item.system);
    
    // Handle comma-separated arrays for traits and modifications
    if (formData['system.traits'] && typeof formData['system.traits'] === 'string') {
      formData['system.traits'] = formData['system.traits'].split(',').map(s => s.trim()).filter(s => s);
    }
    
    if (formData['system.modifications'] && typeof formData['system.modifications'] === 'string') {
      formData['system.modifications'] = formData['system.modifications'].split(',').map(s => s.trim()).filter(s => s);
    }

    // CRITICAL: Special handling for move data
    if (this.item.type === 'move') {
      console.log('Processing move data...');
      
      // Ensure success/partial/failure objects are properly structured
      const processedData = {};
      
      for (const [key, value] of Object.entries(formData)) {
        if (key.startsWith('system.success.') || key.startsWith('system.partial.') || key.startsWith('system.failure.')) {
          // These are nested object properties
          const parts = key.split('.');
          if (!processedData.system) processedData.system = {};
          if (!processedData.system[parts[1]]) processedData.system[parts[1]] = {};
          
          // Convert numbers where appropriate
          let processedValue = value;
          if (parts[2] === 'value' && typeof value === 'string') {
            processedValue = parseInt(value) || 0;
          }
          
          processedData.system[parts[1]][parts[2]] = processedValue;
        } else {
          // Direct property
          processedData[key] = value;
        }
      }
      
      console.log('Processed move data:', processedData);
      
      // Apply the update
      return this.object.update(processedData);
    } else {
      // For non-move items, use standard processing
      const processedData = foundry.utils.expandObject(formData);
      console.log('Standard processed data:', processedData);
      
      return this.object.update(processedData);
    }
  }

  /**
   * Override the close method to ensure data is saved
   */
  async close(options = {}) {
    // Force a final save before closing
    if (this.isEditable && this.element.length > 0) {
      try {
        await this.submit();
      } catch (error) {
        console.warn('Error saving data on close:', error);
      }
    }
    
    return super.close(options);
  }
}
