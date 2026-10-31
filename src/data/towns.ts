import type { TownDefinition, TownId } from '../types/game';

export const TOWNS: Record<TownId, TownDefinition> = {
  valley_farm: {
    id: 'valley_farm',
    name: 'The Valley Farm',
    emoji: '🌾',
    biome: 'Farmland',
    description: 'Rolling green hills dotted with thatched-roof cottages and golden wheat fields. The smell of fresh bread lingers in the air.',
    backgroundGradient: ['#2d5a1b', '#4a7c35', '#6b9e50', '#8bc35a'],
    rumorItems: ['wheat', 'livestock', 'tools', 'iron'],
    productions: [
      { itemId: 'wheat',     productionRate: 8,  consumptionRate: 1, initialSupply: 180 },
      { itemId: 'livestock', productionRate: 4,  consumptionRate: 1, initialSupply: 120 },
      { itemId: 'food',      productionRate: 6,  consumptionRate: 2, initialSupply: 150 },
      { itemId: 'tools',     productionRate: 0,  consumptionRate: 3, initialSupply: 30  },
      { itemId: 'iron',      productionRate: 0,  consumptionRate: 2, initialSupply: 20  },
      { itemId: 'cloth',     productionRate: 1,  consumptionRate: 2, initialSupply: 40  },
      { itemId: 'wood',      productionRate: 2,  consumptionRate: 1, initialSupply: 60  },
    ],
  },

  mountain_forge: {
    id: 'mountain_forge',
    name: 'The Mountain Forge',
    emoji: '⛏️',
    biome: 'Mountains',
    description: 'Snow-capped peaks loom over stone doorways carved into the rock face. The clang of hammers and the orange glow of forges never cease.',
    backgroundGradient: ['#3a3a4a', '#5a5a7a', '#7a6a8a', '#4a3a5a'],
    rumorItems: ['iron', 'tools', 'weapons', 'wheat'],
    productions: [
      { itemId: 'iron',      productionRate: 8,  consumptionRate: 1, initialSupply: 160 },
      { itemId: 'tools',     productionRate: 5,  consumptionRate: 1, initialSupply: 100 },
      { itemId: 'weapons',   productionRate: 3,  consumptionRate: 1, initialSupply: 80  },
      { itemId: 'wheat',     productionRate: 0,  consumptionRate: 4, initialSupply: 20  },
      { itemId: 'cloth',     productionRate: 0,  consumptionRate: 3, initialSupply: 25  },
      { itemId: 'food',      productionRate: 0,  consumptionRate: 4, initialSupply: 30  },
      { itemId: 'wood',      productionRate: 3,  consumptionRate: 4, initialSupply: 40  },
    ],
  },

  desert_bazaar: {
    id: 'desert_bazaar',
    name: 'The Desert Bazaar',
    emoji: '🏜️',
    biome: 'Desert',
    description: 'Vibrant silk tents ripple in the hot wind. Sandstone towers rise from golden dunes. Merchants from distant lands hawk their exotic wares.',
    backgroundGradient: ['#c8852a', '#e8a83a', '#f0c050', '#d4974e'],
    rumorItems: ['spices', 'silk', 'water', 'tools'],
    productions: [
      { itemId: 'spices',    productionRate: 6,  consumptionRate: 1, initialSupply: 140 },
      { itemId: 'silk',      productionRate: 4,  consumptionRate: 1, initialSupply: 100 },
      { itemId: 'water',     productionRate: 2,  consumptionRate: 8, initialSupply: 20  },
      { itemId: 'tools',     productionRate: 0,  consumptionRate: 4, initialSupply: 25  },
      { itemId: 'livestock', productionRate: 0,  consumptionRate: 3, initialSupply: 20  },
      { itemId: 'food',      productionRate: 1,  consumptionRate: 5, initialSupply: 20  },
      { itemId: 'cloth',     productionRate: 2,  consumptionRate: 2, initialSupply: 60  },
    ],
  },

  deepwood_camp: {
    id: 'deepwood_camp',
    name: 'The Deepwood Camp',
    emoji: '🌲',
    biome: 'Forest',
    description: 'Massive ancient trees tower over wooden palisades. Muddy paths wind between log cabins. The dim canopy filters a haunting green light.',
    backgroundGradient: ['#1a3a1a', '#2a5a2a', '#3a7a3a', '#1e4a2a'],
    rumorItems: ['wood', 'furs', 'weapons', 'wheat'],
    productions: [
      { itemId: 'wood',      productionRate: 10, consumptionRate: 2, initialSupply: 200 },
      { itemId: 'furs',      productionRate: 5,  consumptionRate: 1, initialSupply: 120 },
      { itemId: 'weapons',   productionRate: 0,  consumptionRate: 4, initialSupply: 20  },
      { itemId: 'wheat',     productionRate: 0,  consumptionRate: 3, initialSupply: 25  },
      { itemId: 'food',      productionRate: 2,  consumptionRate: 3, initialSupply: 40  },
      { itemId: 'iron',      productionRate: 0,  consumptionRate: 2, initialSupply: 30  },
    ],
  },

  capital_city: {
    id: 'capital_city',
    name: 'The Capital City',
    emoji: '🏰',
    biome: 'Urban',
    description: 'Towering stone walls surround bustling cobblestone streets. Wealthy merchant houses and noble estates line the grand boulevards.',
    backgroundGradient: ['#4a3a2a', '#6a5a4a', '#8a7a6a', '#5a4a3a'],
    rumorItems: ['luxury_goods', 'cloth', 'spices', 'furs', 'iron'],
    productions: [
      { itemId: 'luxury_goods', productionRate: 4, consumptionRate: 1, initialSupply: 80 },
      { itemId: 'cloth',        productionRate: 5, consumptionRate: 2, initialSupply: 120 },
      { itemId: 'spices',       productionRate: 0, consumptionRate: 5, initialSupply: 25  },
      { itemId: 'furs',         productionRate: 0, consumptionRate: 4, initialSupply: 20  },
      { itemId: 'iron',         productionRate: 0, consumptionRate: 3, initialSupply: 30  },
      { itemId: 'food',         productionRate: 2, consumptionRate: 6, initialSupply: 40  },
      { itemId: 'wheat',        productionRate: 0, consumptionRate: 4, initialSupply: 30  },
      { itemId: 'water',        productionRate: 3, consumptionRate: 2, initialSupply: 80  },
    ],
  },
};

export const TOWN_IDS = Object.keys(TOWNS) as TownId[];

