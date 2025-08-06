/**
 * Prepare Move type specific data
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
