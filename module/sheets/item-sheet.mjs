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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      submitOnChange: false,  // CHANGED FROM true TO false
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
   * Override the default update behavior - DEBUG VERSION
   */
  async _updateObject(event, formData) {
    console.log('=== DEBUG FORM SUBMISSION ===');
    console.log('Raw form data received:', formData);
    
    // Check specifically for the nested fields we care about
    console.log('system.success.text in formData:', formData['system.success.text']);
    console.log('system.success.value in formData:', formData['system.success.value']);
    console.log('system.partial.text in formData:', formData['system.partial.text']);
    console.log('system.partial.value in formData:', formData['system.partial.value']);
    console.log('system.failure.text in formData:', formData['system.failure.text']);
    console.log('system.modifier in formData:', formData['system.modifier']);
    console.log('system.modifierDescription in formData:', formData['system.modifierDescription']);
    
    // Show all form data keys
    console.log('All form data keys:', Object.keys(formData));
    
    // Process with expandObject
    const processedData = foundry.utils.expandObject(formData);
    console.log('After expandObject:', processedData);
    
    if (processedData.system) {
      console.log('Processed system data:', processedData.system);
      console.log('success object after processing:', processedData.system.success);
      console.log('partial object after processing:', processedData.system.partial);
      console.log('failure object after processing:', processedData.system.failure);
    }
    
    console.log('=== END DEBUG ===');
    
    // Update the object
    return this.object.update(processedData);
  }
}
