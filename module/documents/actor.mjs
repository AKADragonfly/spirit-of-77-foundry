/**
 * Extend the base Actor document to implement Spirit of '77 specific logic.
 * 
 * Based on patterns from the PbtA system by asacolips-projects.
 * Enhanced with Spirit of '77 specific mechanics including harm, scars,
 * and enhanced roll mechanics.
 * 
 * @extends {Actor}
 */
export class Spirit77Actor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from a macro).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.spirit77 || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;

    // Apply scar penalties to stats
    this._applyScars(systemData);
    
    // Calculate effective stat values
    for (const [key, stat] of Object.entries(systemData.stats || {})) {
      stat.effective = this.getStatValue(key);
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    const systemData = actorData.system;
    
    // NPCs have different harm max
    systemData.harm.max = 5;
  }

  /**
   * Apply scar penalties to stats
   */
  _applyScars(systemData) {
    // Reset all scar penalties first
    for (const stat of Object.values(systemData.stats || {})) {
      stat.scarPenalty = 0;
    }
    
    // Apply active scar penalties
    for (const [key, scar] of Object.entries(systemData.scars || {})) {
      if (scar.active) {
        const statKey = scar.stat; // Use the stat directly from scar definition
        const stat = systemData.stats[statKey];
        if (stat) {
          stat.scarPenalty = -1;
        }
      }
    }
  }

  /**
   * Get the effective value of a stat after applying penalties
   */
  getStatValue(statKey) {
    const stat = this.system.stats[statKey];
    if (!stat) return 0;
    
    let value = stat.value || 0;
    value += stat.scarPenalty || 0;
    
    return value;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.stats) {
      for (let [k, v] of Object.entries(data.stats)) {
        data[k] = this.getStatValue(k);
      }
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /**
   * Roll a stat check - SIMPLIFIED VERSION
   */
  async rollStat(statKey, options = {}) {
    const stat = this.system.stats[statKey];
    if (!stat) return;

    // Get values directly without complex roll data
    const statValue = parseInt(stat.value || 0) + parseInt(stat.scarPenalty || 0);
    const tempModifier = parseInt(this.system.resources?.modifiers?.temporary || 0);
    const somethingExtra = this.system.resources?.modifiers?.somethingExtra || false;
    
    let diceFormula = '2d6';
    let rollType = 'normal';
    
    // Check for "Something Less" penalty (4+ harm)
    if (this.system.harm.value >= 4) {
      diceFormula = '3d6kl2'; // Roll 3 dice, keep lowest 2
      rollType = 'somethingLess';
    }
    
    // Check for "Something Extra" 
    if (somethingExtra) {
      if (this.system.harm.value >= 4) {
        // Something Extra and Something Less cancel out
        diceFormula = '2d6';
        rollType = 'cancelOut';
      } else {
        diceFormula = '3d6kh2'; // Roll 3 dice, keep highest 2
        rollType = 'somethingExtra';
      }
    }
    
    // Build the complete formula with static values
    let totalModifier = statValue + tempModifier;
    let rollFormula = `${diceFormula} + ${totalModifier}`;
    
    console.log('Roll formula:', rollFormula); // Debug log

    const roll = new Roll(rollFormula);
    await roll.evaluateSync();

    // Determine result type
    let resultType = 'failure';
    if (roll.total >= 10) resultType = 'success';
    else if (roll.total >= 7) resultType = 'partial';

    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this }),
      roll: roll,
      content: await this._formatRollMessage(statKey, roll, resultType, rollType, statValue, tempModifier),
      sound: CONFIG.sounds.dice
    };

    // Reset temporary modifiers after use
    await this.update({
      'system.resources.modifiers.temporary': 0,
      'system.resources.modifiers.somethingExtra': false
    });

    return ChatMessage.create(messageData);
  }

  /**
   * Format roll result message with dice breakdown
   */
  async _formatRollMessage(statKey, roll, resultType, rollType, statValue, tempModifier = 0) {
    const stat = this.system.stats[statKey];
    
    // Get individual die results for tooltip
    const diceResults = roll.dice[0]?.results?.map(r => r.result) || [];
    let diceBreakdown = '';
    
    if (rollType === 'somethingExtra') {
      const kept = roll.dice[0]?.results?.filter(r => r.active)?.map(r => r.result) || [];
      diceBreakdown = `Rolled: [${diceResults.join(', ')}] → Kept highest: [${kept.join(', ')}]`;
    } else if (rollType === 'somethingLess') {
      const kept = roll.dice[0]?.results?.filter(r => r.active)?.map(r => r.result) || [];
      diceBreakdown = `Rolled: [${diceResults.join(', ')}] → Kept lowest: [${kept.join(', ')}]`;
    } else {
      diceBreakdown = `Rolled: [${diceResults.join(', ')}]`;
    }
    
    let rollDescription = '';
    if (rollType === 'somethingLess') {
      rollDescription = ' (Something Less)';
    } else if (rollType === 'somethingExtra') {
      rollDescription = ' (Something Extra)';
    } else if (rollType === 'cancelOut') {
      rollDescription = ' (Extra & Less cancel)';
    }
    
    let modifierText = '';
    let modifierBreakdown = `${statValue} (stat)`;
    
    if (tempModifier !== 0) {
      modifierText = ` ${tempModifier > 0 ? '+' : ''}${tempModifier}`;
      modifierBreakdown += ` + ${tempModifier} (temp)`;
    }
    
    const totalBreakdown = `${diceBreakdown} + ${modifierBreakdown} = ${roll.total}`;
    
    return `
      <div class="spirit77-roll">
        <div class="roll-header">
          <strong>${this.name}</strong> rolls ${stat.label}${rollDescription}${modifierText}
        </div>
        <div class="roll-result ${resultType}" title="${totalBreakdown}">
          ${roll.total} - ${resultType.charAt(0).toUpperCase() + resultType.slice(1)}
          <div class="roll-breakdown" style="font-size: 0.8em; color: #666; margin-top: 4px;">
            ${totalBreakdown}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Apply harm to the character
   */
  async applyHarm(amount) {
    const currentHarm = this.system.harm.value;
    const newHarm = Math.min(currentHarm + amount, 8);
    
    await this.update({ 'system.harm.value': newHarm });
    
    // Trigger sheet refresh to update UI
    if (this.sheet && this.sheet.rendered) {
      this.sheet.render(false);
    }
    
    return newHarm;
  }

  /**
   * Heal harm
   */
  async healHarm(amount) {
    const currentHarm = this.system.harm.value;
    const newHarm = Math.max(currentHarm - amount, 0);
    
    await this.update({ 'system.harm.value': newHarm });
    
    // Trigger sheet refresh to update UI
    if (this.sheet && this.sheet.rendered) {
      this.sheet.render(false);
    }
    
    return newHarm;
  }

  /**
   * Apply a scar instead of taking harm
   */
  async applyScar(scarType) {
    const scarPath = `system.scars.${scarType}.active`;
    await this.update({ [scarPath]: true });
    
    // Trigger sheet refresh to update effective stats
    if (this.sheet && this.sheet.rendered) {
      this.sheet.render(false);
    }
    
    return true;
  }

  /**
   * Remove a scar
   */
  async removeScar(scarType) {
    const scarPath = `system.scars.${scarType}.active`;
    await this.update({ [scarPath]: false });
    
    // Trigger sheet refresh to update effective stats
    if (this.sheet && this.sheet.rendered) {
      this.sheet.render(false);
    }
    
    return true;
  }

  /**
   * Toggle scar status
   */
  async toggleScar(scarType) {
    const currentState = this.system.scars[scarType]?.active || false;
    return currentState ? this.removeScar(scarType) : this.applyScar(scarType);
  }
}
