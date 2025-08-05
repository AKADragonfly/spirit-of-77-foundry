/**
 * Spirit of '77 System for Foundry VTT
 * 
 * A custom system implementation for the Spirit of '77 RPG.
 * 
 * ATTRIBUTION:
 * This system is built upon the excellent foundation provided by:
 * - PbtA System by asacolips-projects (https://github.com/asacolips-projects/pbta)
 * - Monsters of the Week for PbtA by Rangertheman (https://github.com/Rangertheman/motw-for-pbta)
 * 
 * Spirit of '77 RPG is created by David Schirduan and Joshua Macy.
 * This is an unofficial fan-created system implementation.
 * 
 * @author Your Name
 * @license MIT
 */

// Import document classes
import { Spirit77Actor } from "./documents/actor.mjs";
import { Spirit77Item } from "./documents/item.mjs";

// Import sheet classes
import { Spirit77ActorSheet } from "./sheets/actor-sheet.mjs";
import { Spirit77ItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants
import { SPIRIT77 } from "./helpers/config.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  
  const item = data.data;

  // Create the macro command
  const command = `game.spirit77.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "spirit77.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Roll an item macro.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {
  // Add utility classes to the global game object
  game.spirit77 = {
    Spirit77Actor,
    Spirit77Item,
    rollItemMacro
  };

  // Add custom constants for configuration
  CONFIG.SPIRIT77 = SPIRIT77;

  // Define custom Document classes
  CONFIG.Actor.documentClass = Spirit77Actor;
  CONFIG.Item.documentClass = Spirit77Item;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("spirit77", Spirit77ActorSheet, {
    types: ["character", "npc"],
    makeDefault: true
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("spirit77", Spirit77ItemSheet, {
    types: ["move", "gear", "thang", "vehicle", "xtech"],
    makeDefault: true
  });

  // Preload Handlebars templates
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
