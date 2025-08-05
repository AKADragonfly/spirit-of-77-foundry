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

      // Prepare move type options
      context.moveTypeOptions = [];
      for (let [key, label] of Object.entries(CONFIG.SPIRIT77.moveTypes)) {
        context.moveTypeOptions.push({
          key: key,
          label: game.i18n.localize(label),
          selected: itemData.system.moveType === key
        });
      }
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

    // Roll handlers, click handlers, etc. would go here.
  }
}
