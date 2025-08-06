import { SPIRIT77 } from "../helpers/config.mjs";

/**
 * Extend the basic ItemSheet with Spirit of '77 specific functionality
 * @extends {ItemSheet}
 */
export class Spirit77ItemSheet extends ItemSheet {

  constructor(...args) {
    super(...args);
    
    // Debounce timer for updates
    this._updateTimer = null;
    this._pendingUpdates = {};
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["spirit77", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      submitOnChange: true,
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
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    console.log('Item data in getData:', itemData.system); // Debug log

    // Retrieve the roll data for TinyMCE editors.
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
    }

    if (itemData.type === 'thang') {
      // Prepare thang type options
      context.thangTypeOptions = [];
      const thangTypes = ['aptitude', 'contact', 'gear', 'ride'];
      for (const key of thangTypes) {
        context.thangTypeOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
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
      // Prepare vehicle type options
      context.vehicleTypeOptions = [];
      const vehicleTypes = ['sedan', 'truck', 'motorcycle', 'van'];
      for (const key of vehicleTypes) {
        context.vehicleTypeOptions.push({
          key: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          selected: itemData.system.vehicleType === key
        });
      }
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Handle form field changes with debouncing
    html.find('input, select, textarea').on('input change', this._onFieldChange.bind(this));
    
    // Handle form submission
    html.find('form').on('submit', this._onSubmit.bind(this));
  }

  /**
   * Handle individual field changes with debouncing
   * @param {Event} event   The originating change event
   * @private
   */
  _onFieldChange(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const field = element.name;
    let value = element.value;
    
    // Handle different input types
    if (element.type === 'checkbox') {
      value = element.checked;
    } else if (element.type === 'number') {
      value = parseFloat(value) || 0;
    }
    
    console.log('Field changed:', field, '=', value); // Debug log
    
    // Store the pending update
    this._pendingUpdates[field] = value;
    
    // Clear existing timer
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
    }
    
    // Set new timer for debounced update
    this._updateTimer = setTimeout(() => {
      this._applyPendingUpdates();
    }, 300); // 300ms delay
  }

  /**
   * Apply all pending updates
   * @private
   */
  async _applyPendingUpdates() {
    if (Object.keys(this._pendingUpdates).length === 0) return;
    
    console.log('Applying pending updates:', this._pendingUpdates); // Debug log
    
    try {
      // Make a copy of pending updates
      const updateData = foundry.utils.deepClone(this._pendingUpdates);
      
      // Clear pending updates
      this._pendingUpdates = {};
      
      // Apply the update
      await this.object.update(updateData, { diff: false, recursive: false });
      
      console.log('Batch update successful'); // Debug log
      
    } catch (error) {
      console.error('Batch update failed:', error);
      // Restore failed updates to pending
      Object.assign(this._pendingUpdates, updateData);
    }
  }

  /**
   * Handle form submission
   * @param {Event} event   The originating submit event
   * @private
   */
  async _onSubmit(event) {
    event.preventDefault();
    
    // Apply any pending updates first
    await this._applyPendingUpdates();
    
    // Then proceed with normal form submission
    return super._onSubmit(event);
  }

  /**
   * Handle form submission data processing
   * @param {Event} event      The form submission event  
   * @param {Object} formData  The form data object
   * @private
   */
  async _updateObject(event, formData) {
    console.log('_updateObject called with:', formData); // Debug log
    
    // Process the form data
    const processedData = {};
    
    for (const [key, value] of Object.entries(formData)) {
      // Handle number fields
      if (key.includes('.value') && typeof value === 'string') {
        processedData[key] = parseInt(value) || 0;
      }
      // Handle text fields
      else {
        processedData[key] = value || '';
      }
    }
    
    console.log('Processed form data:', processedData); // Debug log
    
    // Update the object
    return this.object.update(processedData, { diff: false, recursive: false });
  }

  /** @override */
  async close(options = {}) {
    // Apply any pending updates before closing
    await this._applyPendingUpdates();
    
    // Clear the timer
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = null;
    }
    
    return super.close(options);
  }
}
