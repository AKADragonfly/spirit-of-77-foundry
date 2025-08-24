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
      submitOnChange: false,  // Keep your original setting
      submitOnClose: true     // Keep your original setting
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
    console.log('FULL ITEM DATA:', JSON.stringify(itemData, null, 2));

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
      // Prepare weapon range options for gear (if it's a weapon)
      context.rangeOptions = [];
      const ranges = ['close', 'near', 'far']; // Removed 'reach' as ChatGPT noted
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
   * CHATGPT'S APPROACH: Simple and focused _updateObject
   */
  async _updateObject(event, formData) {
    console.log('Form submission - Raw form data:', formData);

    // 1) Coerce comma-separated lists to arrays where appropriate
    //    (only applies to types that actually have these props)
    if (typeof formData['system.traits'] === 'string') {
      formData['system.traits'] = formData['system.traits']
        .split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof formData['system.modifications'] === 'string') {
      formData['system.modifications'] = formData['system.modifications']
        .split(',').map(s => s.trim()).filter(Boolean);
    }

    // 2) Expand dot-paths into a nested object so Foundry updates correctly
    const expanded = foundry.utils.expandObject(formData);
    console.log('After expandObject:', expanded);

    // 3) Type coercion for move fields so numbers stay numbers
    if (this.item.type === 'move') {
      const sys = expanded.system ?? (expanded.system = {});
      sys.modifier = Number(sys.modifier ?? 0) || 0;

      if (sys.success) sys.success.value = Number(sys.success.value ?? 10);
      if (sys.partial) sys.partial.value = Number(sys.partial.value ?? 7);
      // success.text / partial.text / failure.text remain strings (OK)
    }

    console.log('Final expanded data being saved:', expanded);

    // 4) Persist
    return await this.item.update(expanded);
  }
}
