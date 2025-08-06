/**
 * Extend the base Item document to implement Spirit of '77 specific logic.
 * @extends {Item}
 */
export class Spirit77Item extends Item {

  /** @override */
  prepareData() {
    // Prepare data for the item. Calling the super version of this executes
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

  /** @override */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.spirit77 || {};

    // Make separate methods for each Item type (move, equipment, weapon) to keep
    // things organized.
    this._prepareMoveData(itemData);
    this._prepareEquipmentData(itemData);
    this._prepareWeaponData(itemData);
  }

  /**
   * Prepare Move type specific data - FIXED VERSION
   */
  _prepareMoveData(itemData) {
    if (itemData.type !== 'move') return;

    const systemData = itemData.system;
    
    // ONLY set defaults if the values are actually missing from the data
    // Use more robust checking to avoid overriding saved values
    
    if (!systemData.hasOwnProperty('success') || systemData.success === null || systemData.success === undefined) {
      systemData.success = { value: 10, text: '' };
    } else if (typeof systemData.success !== 'object') {
      systemData.success = { value: 10, text: '' };
    } else {
      // Ensure nested properties exist
      if (!systemData.success.hasOwnProperty('value')) systemData.success.value = 10;
      if (!systemData.success.hasOwnProperty('text')) systemData.success.text = '';
    }
    
    if (!systemData.hasOwnProperty('partial') || systemData.partial === null || systemData.partial === undefined) {
      systemData.partial = { value: 7, text: '' };
    } else if (typeof systemData.partial !== 'object') {
      systemData.partial = { value: 7, text: '' };
    } else {
      // Ensure nested properties exist
      if (!systemData.partial.hasOwnProperty('value')) systemData.partial.value = 7;
      if (!systemData.partial.hasOwnProperty('text')) systemData.partial.text = '';
    }
    
    if (!systemData.hasOwnProperty('failure') || systemData.failure === null || systemData.failure === undefined) {
      systemData.failure = { text: '' };
    } else if (typeof systemData.failure !== 'object') {
      systemData.failure = { text: '' };
    } else {
      // Ensure nested properties exist
      if (!systemData.failure.hasOwnProperty('text')) systemData.failure.text = '';
    }
    
    if (!systemData.hasOwnProperty('modifier') || systemData.modifier === null || systemData.modifier === undefined) {
      systemData.modifier = '';
    }
    
    if (!systemData.hasOwnProperty('modifierDescription') || systemData.modifierDescription === null || systemData.modifierDescription === undefined) {
      systemData.modifierDescription = '';
    }
    
    // CRITICAL FIX: Only set stat to 'might' if it's truly missing or invalid
    // Don't override valid saved values
    if (!systemData.hasOwnProperty('stat') || systemData.stat === null || systemData.stat === undefined || systemData.stat === '') {
      systemData.stat = 'might';
    } else {
      // Validate that the stat is one of the valid options
      const validStats = ['might', 'hustle', 'brains', 'smooth', 'soul'];
      if (!validStats.includes(systemData.stat)) {
        systemData.stat = 'might';
      }
    }
    
    if (!systemData.hasOwnProperty('moveType') || systemData.moveType === null || systemData.moveType === undefined) {
      systemData.moveType = 'basic';
    }
  }

  /**
   * Prepare Equipment type specific data
   */
  _prepareEquipmentData(itemData) {
    if (itemData.type !== 'equipment') return;

    const systemData = itemData.system;
    // Add any equipment-specific calculations here
  }

  /**
   * Prepare Weapon type specific data
   */
  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;

    const systemData = itemData.system;
    // Add any weapon-specific calculations here
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.rollFormula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Handle moves with roll formulas
      if (item.type === 'move') {
        return this.rollMove();
      }

      // For other items, do a basic roll with fallback system
      try {
        const roll = new Roll(this.system.rollFormula);
        
        // Try the old async method first
        try {
          await roll.evaluate({ async: true });
        } catch (asyncError) {
          console.warn('Item async roll failed, trying sync:', asyncError);
          roll.evaluateSync();
        }

        roll.toMessage({
          speaker: speaker,
          rollMode: rollMode,
          flavor: label,
        });
        return roll;
        
      } catch (error) {
        console.error('Item roll failed completely:', error);
        ChatMessage.create({
          speaker: speaker,
          rollMode: rollMode,
          flavor: label,
          content: `${item.system.description ?? ''} (Roll failed due to Foundry issue)`
        });
      }
    }
  }

  /**
   * Roll a move - USING SAME FALLBACK SYSTEM AS ACTOR
   */
  async rollMove() {
    if (this.type !== 'move') return;

    const actor = this.actor;
    if (!actor) return;

    const statKey = this.system.stat;
    const statValue = actor.getStatValue(statKey);
    const tempModifier = parseInt(actor.system.resources?.modifiers?.temporary || 0);
    const moveModifier = this.system.modifier ? parseInt(this.system.modifier) || 0 : 0;
    const somethingExtra = actor.system.resources?.modifiers?.somethingExtra || false;
    
    let diceFormula = '2d6';
    let rollType = 'normal';
    
    // Check for "Something Less" penalty (4+ harm)
    if (actor.system.harm.value >= 4) {
      diceFormula = '3d6kl2'; // Roll 3 dice, keep lowest 2
      rollType = 'somethingLess';
    }
    
    // Check for "Something Extra" 
    if (somethingExtra) {
      if (actor.system.harm.value >= 4) {
        // Something Extra and Something Less cancel out
        diceFormula = '2d6';
        rollType = 'cancelOut';
      } else {
        diceFormula = '3d6kh2'; // Roll 3 dice, keep highest 2
        rollType = 'somethingExtra';
      }
    }
    
    // Build the complete formula with static values
    let totalModifier = statValue + tempModifier + moveModifier;
    let rollFormula = `${diceFormula} + ${totalModifier}`;
    
    console.log('Move roll formula:', rollFormula);

    try {
      const roll = new Roll(rollFormula);
      
      // Try the old async method first
      try {
        await roll.evaluate({ async: true });
      } catch (asyncError) {
        console.warn('Move async roll failed, trying sync:', asyncError);
        roll.evaluateSync();
      }

      // Determine result type
      let resultType = 'failure';
      let resultText = this.system.success?.text || '';
      
      if (roll.total >= (this.system.success?.value || 10)) {
        resultType = 'success';
        resultText = this.system.success?.text || '';
      } else if (roll.total >= (this.system.partial?.value || 7)) {
        resultType = 'partial';
        resultText = this.system.partial?.text || '';
      } else {
        resultText = this.system.failure?.text || '';
      }

      const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        content: await this._formatMoveRollMessage(roll, resultType, resultText, rollType, statValue, tempModifier, moveModifier),
        sound: CONFIG.sounds.dice
      };

      // Reset temporary modifiers after use
      await actor.update({
        'system.resources.modifiers.temporary': 0,
        'system.resources.modifiers.somethingExtra': false
      });

      return ChatMessage.create(messageData);
      
    } catch (error) {
      console.error('Move roll failed completely:', error);
      
      // Manual fallback - create a basic chat message
      const manualRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + totalModifier;
      let resultType = 'failure';
      if (manualRoll >= (this.system.success?.value || 10)) resultType = 'success';
      else if (manualRoll >= (this.system.partial?.value || 7)) resultType = 'partial';
      
      const stat = actor.system.stats[statKey];
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: `
          <div class="spirit77-move-roll">
            <div class="roll-header">
              <strong>${actor.name}</strong> uses <em>${this.name}</em> (Manual Roll - Foundry Issue)
            </div>
            <div class="roll-stat">
              Rolling ${stat.label} (${statValue})
            </div>
            <div class="roll-result ${resultType}">
              <strong>${manualRoll} - ${resultType.charAt(0).toUpperCase() + resultType.slice(1)}</strong>
            </div>
          </div>
        `
      });
    }
  }

  /**
   * Format move roll result message with dice breakdown
   */
  async _formatMoveRollMessage(roll, resultType, resultText, rollType, statValue, tempModifier = 0, moveModifier = 0) {
    const actor = this.actor;
    const statKey = this.system.stat;
    const stat = actor.system.stats[statKey];
    
    // Get individual die results for breakdown
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
    let modifierBreakdown = `${statValue} (${stat.label})`;
    
    if (tempModifier !== 0) {
      modifierText += ` ${tempModifier > 0 ? '+' : ''}${tempModifier} (temp)`;
      modifierBreakdown += ` + ${tempModifier} (temp)`;
    }
    if (moveModifier !== 0) {
      modifierText += ` ${moveModifier > 0 ? '+' : ''}${moveModifier} (move)`;
      modifierBreakdown += ` + ${moveModifier} (move)`;
    }
    
    const totalBreakdown = `${diceBreakdown} + ${modifierBreakdown} = ${roll.total}`;
    
    return `
      <div class="spirit77-move-roll">
        <div class="roll-header">
          <strong>${actor.name}</strong> uses <em>${this.name}</em>
        </div>
        <div class="roll-stat">
          Rolling ${stat.label} (${statValue})${rollDescription}${modifierText}
        </div>
        <div class="roll-result ${resultType}" title="${totalBreakdown}">
          <strong>${roll.total} - ${resultType.charAt(0).toUpperCase() + resultType.slice(1)}</strong>
          <div class="roll-breakdown" style="font-size: 0.8em; color: #666; margin-top: 4px;">
            ${totalBreakdown}
          </div>
        </div>
        ${resultText ? `<div class="roll-description">${resultText}</div>` : ''}
      </div>
    `;
  }
}
