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
    // Retrieve the data structure from the base sheet
    const context = super.getData();

    // Use a safe clone of the actor data for further operations
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Register all necessary Handlebars helpers
    this._registerHandlebarsHelpers();

    // Prepare character data and items
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareNpcData(context);
    }

    // Add roll data for TinyMCE editors
    context.rollData = context.actor.getRollData();

    // Add configuration data
    context.config = CONFIG.SPIRIT77;

    return context;
  }

  /**
   * Register necessary Handlebars helpers
   */
  _registerHandlebarsHelpers() {
    // Register helpers only once
    if (!Handlebars.helpers.capitalize) {
      Handlebars.registerHelper('capitalize', function(str) {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      });
    }

    if (!Handlebars.helpers.eq) {
      Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
      });
    }

    if (!Handlebars.helpers.subtract) {
      Handlebars.registerHelper('subtract', function(a, b) {
        return (a || 0) - (b || 0);
      });
    }

    if (!Handlebars.helpers.gte) {
      Handlebars.registerHelper('gte', function(a, b) {
        return (a || 0) >= (b || 0);
      });
    }

    if (!Handlebars.helpers.join) {
      Handlebars.registerHelper('join', function(array, separator = ', ') {
        if (!Array.isArray(array)) return '';
        return array.join(separator);
      });
    }

    if (!Handlebars.helpers.times) {
      Handlebars.registerHelper('times', function(n, options) {
        let result = '';
        for (let i = 0; i < n; i++) {
          result += options.fn({ ...this, index: i });
        }
        return result;
      });
    }

    if (!Handlebars.helpers.lte) {
      Handlebars.registerHelper('lte', function(a, b) {
        return (a || 0) <= (b || 0);
      });
    }

    if (!Handlebars.helpers.gt) {
      Handlebars.registerHelper('gt', function(a, b) {
        return (a || 0) > (b || 0);
      });
    }

    if (!Handlebars.helpers.lookup) {
      Handlebars.registerHelper('lookup', function(obj, key) {
        return obj && obj[key];
      });
    }

    if (!Handlebars.helpers.unless) {
      Handlebars.registerHelper('unless', function(conditional, options) {
        if (!conditional) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      });
    }
  }

  /**
   * Organize and classify Items for Character sheets.
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

    // Prepare scars with proper mapping
    const scarMapping = {
      'brokeDown': 'broken',
      'outOfGas': 'gimped', 
      'uncool': 'ugly',
      'spaced': 'punchy',
      'uptight': 'whitebread'
    };

    for (let [k, v] of Object.entries(context.system.scars)) {
      const mappedKey = scarMapping[k] || k;
      v.label = game.i18n.localize(CONFIG.SPIRIT77.scarTypes[mappedKey]?.label) ?? k;
    }
  }

  /**
   * Prepare NPC-specific data
   */
  _prepareNpcData(context) {
    // Handle stats for NPCs
    for (let [k, v] of Object.entries(context.system.stats)) {
      v.label = game.i18n.localize(CONFIG.SPIRIT77.stats[k]) ?? k;
      v.effectiveValue = this.actor.getStatValue(k);
    }
  }

  /**
   * Organize and classify Items for sheets.
   */
  _prepareItems(context) {
    // Initialize containers
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
      
      // Append to moves
      if (i.type === 'move') {
        const moveType = i.system.moveType || 'basic';
        if (moves[moveType]) {
          moves[moveType].push(i);
        }
      }
      // Append to gear
      else if (i.type === 'gear') {
        gear.push(i);
      }
      // Append to thangs
      else if (i.type === 'thang') {
        thangs.push(i);
      }
      // Append to vehicles
      else if (i.type === 'vehicle') {
        vehicles.push(i);
      }
      // Append to xtech
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

    // Render the item sheet for viewing/editing prior to the editable check
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) {
        item.delete();
        li.slideUp(200, () => this.render(false));
      }
    });

    // Active Effect management
    html.find(".effect-control").click(ev => {
      if (typeof onManageActiveEffect === 'function') {
        onManageActiveEffect(ev, this.actor);
      }
    });

    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros
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
    
    // Harm level clicks (direct harm setting)
    html.find('.harm-level').click(this._onHarmLevelClick.bind(this));
    
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
    // Get the type of item to create
    const type = header.dataset.type;
    // Get move type if specified
    const moveType = header.dataset.moveType || 'basic';
    
    // Initialize a default name
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Prepare the item object with proper defaults
    const itemData = {
      name: name,
      type: type,
      system: {}
    };
    
    // Set type-specific defaults
    if (type === 'move') {
      itemData.system = {
        moveType: moveType,
        stat: 'might',
        modifier: '',
        modifierDescription: '',
        description: '',
        success: { value: 10, text: '' },
        partial: { value: 7, text: '' },
        failure: { text: '' }
      };
    } else if (type === 'gear') {
      itemData.system = {
        description: '',
        quantity: 1,
        harm: 0,
        armor: 0,
        range: 'close',
        traits: [],
        stock: 0,
        cost: '',
        notes: ''
      };
    } else if (type === 'thang') {
      itemData.system = {
        description: '',
        thangType: 'aptitude',
        permanent: true,
        mechanical: false,
        rollStat: 'smooth',
        rollBonus: 0,
        moveText: '',
        notes: ''
      };
    } else if (type === 'vehicle') {
      itemData.system = {
        description: '',
        vehicleType: 'sedan',
        make: '',
        model: '',
        year: '',
        power: 1,
        looks: 0,
        armor: 0,
        traits: [],
        notes: ''
      };
    } else if (type === 'xtech') {
      itemData.system = {
        description: '',
        baseType: 'gear',
        modifications: [],
        prototype: true,
        specialRules: '',
        notes: ''
      };
    }

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

    // Handle item rolls
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly
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
    const currentValue = this.actor.system.scars[scar]?.active || false;
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
   * Handle clicking harm levels directly
   * @param {Event} event   The originating click event
   * @private
   */
  async _onHarmLevelClick(event) {
    event.preventDefault();
    const harmValue = parseInt(event.currentTarget.dataset.harm);
    return this.actor.update({ 'system.harm.value': harmValue });
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
