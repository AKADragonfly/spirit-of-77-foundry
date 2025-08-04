/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/spirit-of-77/templates/actor/parts/actor-moves.hbs",
    "systems/spirit-of-77/templates/actor/parts/actor-gear.hbs",

    // Item partials
    "systems/spirit-of-77/templates/item/parts/item-effects.hbs",
  ]);
};