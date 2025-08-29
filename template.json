/**
 * Simplified _prepareItemTypeData - replace the move section only
 */
_prepareItemTypeData(context) {
  const itemData = context.item;

  if (itemData.type === 'move') {
    // Set default moveType if missing
    if (!itemData.system.moveType) {
      itemData.system.moveType = 'basic';
    }

    // Prepare stat options for moves
    context.statOptions = [];
    const statKeys = ['might', 'hustle', 'brains', 'smooth', 'soul'];
    for (const key of statKeys) {
      context.statOptions.push({
        key: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        selected: itemData.system.stat === key
      });
    }
  }

  // ... keep all your existing code for gear, thang, vehicle, xtech types unchanged
}
