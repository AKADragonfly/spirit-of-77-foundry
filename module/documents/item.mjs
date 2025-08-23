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
    
    // CRITICAL: Only prepare move data if it doesn't already exist properly
    if (this.type === 'move') {
      this._ensureMoveDataStructure();
    }
  }

  /** @override */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.spirit77 || {};

    // Make separate methods for each Item type (move, equipment, weapon) to keep
    // things organized.
    this._prepareEquipmentData(itemData);
    this._prepareWeaponData(itemData);
  }

  /**
   * Ensure move data structure exists without overwriting existing data
   * CRITICAL FIX: Only create missing structure, never overwrite existing text
   */
  _ensureMoveDataStructure() {
    const systemData = this.system;
    
    console.log('_ensureMoveDataStructure called with systemData:', systemData);
    
    // Only create structure if completely missing, never touch existing data
    let needsUpdate = false;
    const updateData = {};
    
    if (!systemData.success || typeof systemData.success !== 'object') {
      console.log('Creating missing success object');
      updateData['system.success'] = { value: 10, text: '' };
      needsUpdate = true;
    } else if (systemData.success && typeof systemData.success.value === 'undefined') {
      console.log('Adding missing success.value');
      updateData['system.success.value'] = 10;
      needsUpdate = true;
    }
    
    if (!systemData.partial || typeof systemData.partial !== 'object') {
      console.log('Creating missing partial object');
      updateData['system.partial'] = { value: 7, text: '' };
      needsUpdate = true;
    } else if (systemData.partial && typeof systemData.partial.value === 'undefined') {
      console.log('Adding missing partial.value');
      updateData['system.partial.value'] = 7;
      needsUpdate = true;
    }
    
    if (!systemData.failure || typeof systemData.failure !== 'object') {
      console.log('Creating missing failure object');
      updateData['system.failure'] = { text: '' };
      needsUpdate = true;
    }
    
    // Only set defaults for completely missing values
    if (!systemData.stat) {
      updateData['system.stat'] = 'might';
      needsUpdate = true;
    }
    if (!systemData.moveType) {
      updateData['system.moveType'] = 'basic';
      needsUpdate = true;
    }
    
    // Apply updates asynchronously if needed
    if (needsUpdate) {
      console.log('Applying structure updates:', updateData);
      // Use setTimeout to prevent recursion during data preparation
      setTimeout(() => {
        this.update(updateData);
      }, 1);
    }
    
    console.log('Final systemData after _ensureMoveDataStructure:', systemData);
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
   * Roll a move - FIXED VERSION WITH BETTER ERROR HANDLING
   */
  async rollMove() {
    if (this.type !== 'move') return;

    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This move has no associated actor!");
      return;
    }

    const statKey = this.system.stat;
    if (!statKey || !actor.system.stats[statKey]) {
      ui.notifications.error(`Invalid stat "${statKey}" for move "${this.name}"`);
      return;
    }

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
      
      // Try the modern async method first, then fall back to sync
      try {
        await roll.evaluate({ async: true });
      } catch (asyncError) {
        console.warn('Move async roll failed, trying sync:', asyncError);
        try {
          roll.evaluateSync();
        } catch (syncError) {
          console.error('Both async and sync roll failed:', asyncError, syncError);
          throw new Error('Roll evaluation failed completely');
        }
      }

      // Determine result type
      let resultType = 'failure';
      let resultText = this.system.failure?.text || '';
      
      if (roll.total >= (this.system.success?.value || 10)) {
        resultType = 'success';
        resultText = this.system.success?.text || '';
      } else if (roll.total >= (this.system.partial?.value || 7)) {
        resultType = 'partial';
        resultText = this.system.partial?.text || '';
      }

      const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        roll: roll,
        content: await this._formatMoveRollMessage(roll, resultType, resultText, rollType, statValue, tempModifier, moveModifier),
        sound: CONFIG.sounds.dice
      };

      // Reset temporary modifiers after use
      try {
        await actor.update({
          'system.resources.modifiers.temporary': 0,
          'system.resources.modifiers.somethingExtra': false
        });
      } catch (updateError) {
        console.warn('Failed to reset temporary modifiers:', updateError);
      }

      return ChatMessage.create(messageData);
      
    } catch (error) {
      console.error('Move roll failed completely:', error);
      ui.notifications.error(`Move roll failed: ${error.message}`);
      
      // Manual fallback - create a basic chat message with manual dice
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const manualRoll = die1 + die2 + totalModifier;
      
      let resultType = 'failure';
      let resultText = this.system.failure?.text || '';
      
      if (manualRoll >= (this.system.success?.value || 10)) {
        resultType = 'success';
        resultText = this.system.success?.text || '';
      } else if (manualRoll >= (this.system.partial?.value || 7)) {
        resultType = 'partial';
        resultText = this.system.partial?.text || '';
      }
      
      const stat = actor.system.stats[statKey];
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: `
          <div class="spirit77-move-roll">
            <div class="roll-header">
              <strong>${actor.name}</strong> uses <em>${this.name}</em> (Manual Roll - System Issue)
            </div>
            <div class="roll-stat">
              Rolling ${stat.label} (${statValue})
            </div>
            <div class="roll-result ${resultType}">
              <strong>[${die1}, ${die2}] + ${totalModifier} = ${manualRoll} - ${resultType.charAt(0).toUpperCase() + resultType.slice(1)}</strong>
            </div>
            ${resultText ? `<div class="roll-description">${resultText}</div>` : ''}
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
