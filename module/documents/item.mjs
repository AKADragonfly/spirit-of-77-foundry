/**
 * Extend the base Item document to implement Spirit of '77 specific logic.
 * @extends {Item}
 */
export class Spirit77Item extends Item {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // MINIMAL: Don't modify data during preparation
  }

  /** @override */
  prepareDerivedData() {
    // MINIMAL: Keep this simple
    const itemData = this;
    const systemData = itemData.system;
    
    this._prepareEquipmentData(itemData);
    this._prepareWeaponData(itemData);
  }

  /**
   * Prepare Equipment type specific data
   */
  _prepareEquipmentData(itemData) {
    if (itemData.type !== 'equipment') return;
  }

  /**
   * Prepare Weapon type specific data
   */
  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  /**
   * Handle clickable rolls.
   */
  async roll() {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    if (!this.system.rollFormula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    } else {
      if (item.type === 'move') {
        return this.rollMove();
      }

      try {
        const roll = new Roll(this.system.rollFormula);
        
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
   * Roll a move
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
    
    if (actor.system.harm.value >= 4) {
      diceFormula = '3d6kl2';
      rollType = 'somethingLess';
    }
    
    if (somethingExtra) {
      if (actor.system.harm.value >= 4) {
        diceFormula = '2d6';
        rollType = 'cancelOut';
      } else {
        diceFormula = '3d6kh2';
        rollType = 'somethingExtra';
      }
    }
    
    let totalModifier = statValue + tempModifier + moveModifier;
    let rollFormula = `${diceFormula} + ${totalModifier}`;
    
    console.log('Move roll formula:', rollFormula);

    try {
      const roll = new Roll(rollFormula);
      
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
    }
  }

  /**
   * Format move roll result message with dice breakdown
   */
  async _formatMoveRollMessage(roll, resultType, resultText, rollType, statValue, tempModifier = 0, moveModifier = 0) {
    const actor = this.actor;
    const statKey = this.system.stat;
    const stat = actor.system.stats[statKey];
    
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
