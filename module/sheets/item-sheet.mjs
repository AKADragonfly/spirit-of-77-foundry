import { SPIRIT77 } from "../helpers/config.mjs";

/**
 * Extend the basic ItemSheet with Spirit of '77 specific functionality
 * @extends {ItemSheet}
 */
export class Spirit77ItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["spirit77", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/spirit-of-77/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

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
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.stats)) {
        context.statOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.stat === key
        });
      }

      // Note: Removed moveTypeOptions since it's redundant - move type is set by creation button
    }

    if (itemData.type === 'gear') {
      // Prepare weapon range options for gear (if it's a weapon)
      context.rangeOptions = [];
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.weaponRanges)) {
        context.rangeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.range === key
        });
      }
    }

    if (itemData.type === 'thang') {
      // Prepare thang type options
      context.thangTypeOptions = [];
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.thangTypes)) {
        context.thangTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.thangType === key
        });
      }

      // Prepare stat options for thangs
      context.statOptions = [];
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.stats)) {
        context.statOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.rollStat === key
        });
      }
    }

    if (itemData.type === 'vehicle') {
      // Prepare vehicle type options
      context.vehicleTypeOptions = [];
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.vehicleTypes)) {
        context.vehicleTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
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

    // Handle form field changes for immediate feedback
    html.find('input, select, textarea').change(this._onFieldChange.bind(this));
    html.find('input, select, textarea').blur(this._onFieldChange.bind(this));
    
    // Handle enter key presses
    html.find('input, textarea').keydown(this._onKeyDown.bind(this));
  }

  /**
   * Handle individual field changes for immediate saving
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFieldChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const field = element.name;
    const value = element.type === 'checkbox' ? element.checked : 
                  element.type === 'number' ? parseFloat(element.value) || 0 : 
                  element.value;
    
    // Create update object
    const updateData = {};
    updateData[field] = value;
    
    console.log('Updating field:', field, 'with value:', value); // Debug log
    
    // Update the item
    try {
      await this.object.update(updateData);
      console.log('Update successful'); // Debug log
    } catch (error) {
      console.error('Update failed:', error);
    }
  }

  /**
   * Handle key down events
   * @param {Event} event   The originating keydown event
   * @private
   */
  async _onKeyDown(event) {
    // Handle Enter key
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await this._onFieldChange(event);
    }
  }

  /**
   * Handle form submission - CRITICAL FOR DATA PERSISTENCE
   * @param {Event} event      The form submission event  
   * @param {Object} formData  The form data object
   * @private
   */
  async _updateObject(event, formData) {
    console.log('Form submission data:', formData); // Debug log
    
    // Handle special number field conversions
    if (formData['system.success.value'] !== undefined) {
      formData['system.success.value'] = parseInt(formData['system.success.value']) || 10;
    }
    if (formData['system.partial.value'] !== undefined) {
      formData['system.partial.value'] = parseInt(formData['system.partial.value']) || 7;
    }
    
    // Handle modifier field - ensure it's a string
    if (formData['system.modifier'] !== undefined) {
      formData['system.modifier'] = String(formData['system.modifier'] || '');
    }
    
    // Handle modifierDescription field
    if (formData['system.modifierDescription'] !== undefined) {
      formData['system.modifierDescription'] = String(formData['system.modifierDescription'] || '');
    }
    
    // Ensure all text fields are strings
    const textFields = [
      'system.description',
      'system.success.text', 
      'system.partial.text',
      'system.failure.text'
    ];
    
    for (const field of textFields) {
      if (formData[field] !== undefined) {
        formData[field] = String(formData[field] || '');
      }
    }
    
    console.log('Processed form data:', formData); // Debug log
    
    // Update the object using the parent class method
    return super._updateObject(event, formData);
  }
}
