/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return foundry.applications.handlebars.loadTemplates([
    // Actor partials.
    "systems/spirit-of-77/templates/actor/parts/actor-moves.hbs",
    "systems/spirit-of-77/templates/actor/parts/actor-gear.hbs",
    // Remove the missing item-effects.hbs template
  ]);
};
