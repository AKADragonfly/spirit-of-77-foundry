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
      submitOnChange: false,
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
      // Ensure move has proper defaults
      if (!itemData.system.moveType) {
        itemData.system.moveType = 'basic';
      }
      if (!itemData.system.success) {
        itemData.system.success = { value: 10, text: '' };
      }
      if (!itemData.system.partial) {
        itemData.system.partial = { value: 7, text: '' };
      }
      if (!itemData.system.failure) {
        itemData.system.failure = { text: '' };
      }

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
      // Prepare weapon range options for gear
      context.rangeOptions = [];
      const ranges = ['close', 'near', 'far'];
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
   * FIXED: Comprehensive _updateObject method with extensive debugging
   */
  async _updateObject(event, formData) {
    console.log('=== UPDATE OBJECT START ===');
    console.log('Raw form data:', formData);
    console.log('Current item system data:', this.item.system);

    // Create update data starting with current system data
    const currentSystem = foundry.utils.deepClone(this.item.system);
    console.log('Current system clone:', currentSystem);

    // Build update object manually to avoid data loss
    const updateData = {};

    // Handle name separately
    if (formData.name !== undefined) {
      updateData.name = formData.name;
    }

    // Build system updates by preserving existing data and only updating changed fields
    const systemUpdates = {};

    // Process each form field
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith('system.')) {
        const fieldPath = key.substring(7); // Remove 'system.' prefix
        
        // Handle nested fields properly
        if (fieldPath.includes('.')) {
          const [mainField, subField] = fieldPath.split('.', 2);
          if (!systemUpdates[mainField]) {
            systemUpdates[mainField] = foundry.utils.deepClone(currentSystem[mainField] || {});
          }
          systemUpdates[mainField][subField] = value;
        } else {
          systemUpdates[fieldPath] = value;
        }
      }
    }

    console.log('System updates:', systemUpdates);

    // Handle move-specific processing
    if (this.item.type === 'move') {
      // Ensure moveType is preserved
      if (!systemUpdates.moveType && currentSystem.moveType) {
        systemUpdates.moveType = currentSystem.moveType;
      }

      // Ensure nested objects exist with proper structure
      if (!systemUpdates.success) {
        systemUpdates.success = currentSystem.success || { value: 10, text: '' };
      }
      if (!systemUpdates.partial) {
        systemUpdates.partial = currentSystem.partial || { value: 7, text: '' };
      }
      if (!systemUpdates.failure) {
        systemUpdates.failure = currentSystem.failure || { text: '' };
      }

      // Convert numeric fields
      if (systemUpdates.modifier !== undefined) {
        if (typeof systemUpdates.modifier === 'string') {
          systemUpdates.modifier = systemUpdates.modifier.trim() === '' ? '' : (parseInt(systemUpdates.modifier) || 0);
        }
      }

      if (systemUpdates.success?.value !== undefined) {
        systemUpdates.success.value = parseInt(systemUpdates.success.value) || 10;
      }
      if (systemUpdates.partial?.value !== undefined) {
        systemUpdates.partial.value = parseInt(systemUpdates.partial.value) || 7;
      }
    }

    // Handle array fields
    if (systemUpdates.traits && typeof systemUpdates.traits === 'string') {
      systemUpdates.traits = systemUpdates.traits.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    if (systemUpdates.modifications && typeof systemUpdates.modifications === 'string') {
      systemUpdates.modifications = systemUpdates.modifications.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    // Only include system in update if we have system updates
    if (Object.keys(systemUpdates).length > 0) {
      updateData.system = systemUpdates;
    }

    console.log('Final update data:', updateData);
    console.log('=== UPDATE OBJECT END ===');

    // Use direct item update
    try {
      const result = await this.item.update(updateData);
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }
}
