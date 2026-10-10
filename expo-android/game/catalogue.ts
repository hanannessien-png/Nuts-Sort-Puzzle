import type { PowerPack, ShopItem } from './types';

export const POWER_PRICES = { hint: 50, undo: 50, extraBolt: 100 } as const;

/** Fixed-price stock packs. Larger packs save 10%; only single units may be earned by ad. */
export const POWER_PACKS: PowerPack[] = [
  { id: 'pack-hint-1', kind: 'hint', count: 1, price: 50, name: 'Hint', description: 'Shows one verified next move.' },
  { id: 'pack-hint-5', kind: 'hint', count: 5, price: 225, name: 'Hint Pack', description: 'Five hints. Save 10%.' },
  { id: 'pack-undo-1', kind: 'undo', count: 1, price: 50, name: 'Undo', description: 'Takes back your last move.' },
  { id: 'pack-undo-5', kind: 'undo', count: 5, price: 225, name: 'Undo Pack', description: 'Five undos. Save 10%.' },
  { id: 'pack-bolt-1', kind: 'extraBolt', count: 1, price: 100, name: 'Extra Bolt', description: 'Adds one empty bolt to the board.' },
  { id: 'pack-bolt-3', kind: 'extraBolt', count: 3, price: 270, name: 'Bolt Pack', description: 'Three extra bolts. Save 10%.' },
];

export const CATALOG: ShopItem[] = [
  { id: 'theme-light', name: 'The Original', description: 'A little warmth. A fresh start.', category: 'themes', price: 0, rarity: 'Classic', appearance: 'default' },
  { id: 'nuts-classic', name: 'Classic Nuts', description: 'Colorful, soft-edged hexagons.', category: 'nuts', price: 0, rarity: 'Classic', appearance: 'default' },
  { id: 'bolts-classic', name: 'Ivory Bolts', description: 'Simple, smooth and familiar.', category: 'bolts', price: 0, rarity: 'Classic', appearance: 'default' },
  { id: 'bases-classic', name: 'Original Base', description: 'A home for every color.', category: 'bases', price: 0, rarity: 'Classic', appearance: 'default' },
  { id: 'theme-midnight', name: 'Midnight', description: 'An inky dark theme for quiet evenings.', category: 'themes', price: 300, rarity: 'Rare', appearance: 'midnight' },
  { id: 'theme-ocean', name: 'Ocean Breeze', description: 'A refreshing wash of sea and sky.', category: 'themes', price: 200, rarity: 'Classic', appearance: 'ocean' },
  { id: 'theme-blossom', name: 'Cherry Blossom', description: 'Soft pinks, a little spring, all year.', category: 'themes', price: 250, rarity: 'Rare', appearance: 'blossom' },
  { id: 'nuts-candy', name: 'Candy Glaze', description: 'Glossy highlights in your favorite colors.', category: 'nuts', price: 150, rarity: 'Classic', appearance: 'candy' },
  { id: 'nuts-pearl', name: 'Pearl Finish', description: 'Shimmering rims and a satin finish.', category: 'nuts', price: 500, rarity: 'Epic', appearance: 'pearl' },
  { id: 'bolts-brass', name: 'Brushed Brass', description: 'A warm metallic twist.', category: 'bolts', price: 100, rarity: 'Classic', appearance: 'brass' },
  { id: 'bolts-silver', name: 'Silver Thread', description: 'Bright, finely threaded metal.', category: 'bolts', price: 250, rarity: 'Rare', appearance: 'silver' },
  { id: 'bases-walnut', name: 'Walnut Workshop', description: 'Rich wooden bases, beautifully simple.', category: 'bases', price: 150, rarity: 'Classic', appearance: 'walnut' },
  { id: 'bases-marble', name: 'Cloud Marble', description: 'A polished stone pedestal.', category: 'bases', price: 400, rarity: 'Epic', appearance: 'marble' },
  { id: 'bundle-ocean', name: 'Seaside Set', description: 'Ocean Breeze + Candy Glaze + Brushed Brass + Walnut Workshop. Save 15%.', category: 'bundles', price: 510, rarity: 'Rare', appearance: 'ocean', includes: ['theme-ocean', 'nuts-candy', 'bolts-brass', 'bases-walnut'] },
  { id: 'bundle-midnight', name: 'Midnight Collection', description: 'Midnight + Pearl Finish + Silver Thread + Cloud Marble. Save 15%.', category: 'bundles', price: 1233, rarity: 'Epic', appearance: 'midnight', includes: ['theme-midnight', 'nuts-pearl', 'bolts-silver', 'bases-marble'] },
];

export function itemPrice(item: ShopItem, owned: string[]): number {
  if (owned.includes(item.id)) return 0;
  if (!item.includes) return item.price;
  const remaining = item.includes
    .filter(id => !owned.includes(id))
    .reduce((sum, id) => sum + (CATALOG.find(i => i.id === id)?.price ?? 0), 0);
  return remaining ? Math.max(50, Math.round(remaining * 0.85)) : 0;
}

export function equipPurchased(
  equipped: { themes: string; nuts: string; bolts: string; bases: string },
  item: ShopItem,
) {
  const result = { ...equipped };
  for (const id of item.includes ?? [item.id]) {
    const included = CATALOG.find(i => i.id === id);
    if (included && included.category !== 'bundles') result[included.category] = id;
  }
  return result;
}