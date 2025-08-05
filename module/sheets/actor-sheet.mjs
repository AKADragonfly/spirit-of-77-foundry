import { SPIRIT77 } from "../helpers/config.mjs";

/**
 * Extend the basic ActorSheet with Spirit of '77 specific functionality
 * 
 * Sheet structure and patterns inspired by the PbtA system implementation
 * by asacolips-projects, customized for Spirit of '77 RPG mechanics and
 * 1970s aesthetic.
 * 
 * @extends {ActorSheet}
 */
export class Spirit77ActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["spirit77", "sheet", "actor"],
      template: "systems/spirit-of-77/templates/actor/actor-sheet.hbs",
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "rapsheet" }]
    });
  }

  /** @override */
  get template() {
    return `systems/spirit-of-77/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Register capitalize helper if not already registered
    if (!Handlebars.helpers.capitalize) {
      Handlebars.registerHelper('capitalize', function(str) {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      });
    }

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Add configuration data
    context.config = CONFIG.SPIRIT77;

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle stats
    for (let [k, v] of Object.entries(context.system.stats)) {
      v.label = game.i18n.localize(CONFIG.SPIRIT77.stats[k]) ?? k;
      v.effectiveValue = this.actor.getStatValue(k);
    }

    // Handle harm levels
    context.harmLevels = [];
    for (let i = 0; i <= 8; i++) {
      context.harmLevels.push({
        value: i,
        label: game.i18n.localize(CONFIG.SPIRIT77.harmLevels[i]),
        current: context.system.harm.value === i
      });
    }

    // Prepare scars
    for (let [k, v] of Object.entries(context.system.scars)) {
      v.label = game.i18n.localize(CONFIG.SPIRIT77.scarTypes[k]?.label) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const moves = {
      basic: [],
      role: [],
      story: []
    };
    const gear = [];
    const thangs = [];
    const vehicles = [];
    const xtech = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to moves.
      if (i.type === 'move') {
        const moveType = i.system.moveType || 'basic';
        if (moves[moveType]) {
          moves[moveType].push(i);
        }
      }
      // Append to gear.
      else if (i.type === 'gear') {
        gear.push(i);
      }
      // Append to thangs.
      else if (i.type === 'thang') {
        thangs.push(i);
      }
      // Append to vehicles.
      else if (i.type === 'vehicle') {
        vehicles.push(i);
      }
      // Append to xtech.
      else if (i.type === 'xtech') {
        xtech.push(i);
      }
    }

    // Assign and return
    context.moves = moves;
    context.gear = gear;
    context.thangs = thangs;
    context.vehicles = vehicles;
    context.xtech = xtech;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Scar toggles
    html.find('.scar-toggle').click(this._onScarToggle.bind(this));

    // Harm adjustment buttons
    html.find('.harm-adjust').click(this._onHarmAdjust.bind(this));
    
    // Something Extra toggle
    html.find('.something-extra-toggle').click(this._onSomethingExtraToggle.bind(this));
    
    // Temporary modifier input
    html.find('.temp-modifier').change(this._onTempModifierChange.bind(this));
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Get move type if specified
    const moveType = header.dataset.moveType || 'basic';
    
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    
    // Initialize a default name.
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    
    // Set move type for moves
    if (type === 'move') {
      itemData.system.moveType = moveType;
    }
    
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];
    delete itemData.system["moveType"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }

    // Handle stat rolls
    if (dataset.stat) {
      return this.actor.rollStat(dataset.stat);
    }
  }

  /**
   * Handle toggling scars
   * @param {Event} event   The originating click event
   * @private
   */
  async _onScarToggle(event) {
    event.preventDefault();
    const scar = event.currentTarget.dataset.scar;
    const currentValue = this.actor.system.scars[scar].active;
    const updateData = {};
    updateData[`system.scars.${scar}.active`] = !currentValue;
    return this.actor.update(updateData);
  }

  /**
   * Handle harm adjustment buttons
   * @param {Event} event   The originating click event
   * @private
   */
  async _onHarmAdjust(event) {
    event.preventDefault();
    const adjustment = parseInt(event.currentTarget.dataset.adjustment);
    const currentHarm = this.actor.system.harm.value;
    const newHarm = Math.max(0, Math.min(8, currentHarm + adjustment));
    return this.actor.update({ 'system.harm.value': newHarm });
  }
  
  /**
   * Handle Something Extra toggle
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSomethingExtraToggle(event) {
    event.preventDefault();
    const currentValue = this.actor.system.resources.modifiers.somethingExtra;
    return this.actor.update({ 'system.resources.modifiers.somethingExtra': !currentValue });
  }
  
  /**
   * Handle temporary modifier changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onTempModifierChange(event) {
    event.preventDefault();
    const value = parseInt(event.currentTarget.value) || 0;
    return this.actor.update({ 'system.resources.modifiers.temporary': value });
  }
}
