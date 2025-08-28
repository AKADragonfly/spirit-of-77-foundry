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
   * FIXED: Simple and reliable _updateObject method
   */
  async _updateObject(event, formData) {
    console.log('Form submission - Raw form data:', formData);

    // Handle array fields that come in as comma-separated strings
    if (formData['system.traits'] && typeof formData['system.traits'] === 'string') {
      formData['system.traits'] = formData['system.traits']
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    if (formData['system.modifications'] && typeof formData['system.modifications'] === 'string') {
      formData['system.modifications'] = formData['system.modifications']
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // Convert string numbers to actual numbers for specific fields
    if (formData['system.modifier']) {
      const modifier = formData['system.modifier'];
      if (typeof modifier === 'string' && modifier.trim() !== '') {
        formData['system.modifier'] = parseInt(modifier) || 0;
      }
    }

    if (formData['system.success.value']) {
      formData['system.success.value'] = parseInt(formData['system.success.value']) || 10;
    }

    if (formData['system.partial.value']) {
      formData['system.partial.value'] = parseInt(formData['system.partial.value']) || 7;
    }

    console.log('Final form data being saved:', formData);

    // Let Foundry handle the rest - don't use expandObject
    return super._updateObject(event, formData);
  }
}
