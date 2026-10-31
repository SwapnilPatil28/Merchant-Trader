import type { Route, TownId } from '../types/game';

// Routes are bidirectional — the engine handles both directions
export const ROUTES: Route[] = [
  {
    from: 'valley_farm',
    to: 'mountain_forge',
    distance: 4,
    dangerRating: 25,
    terrainDescription: 'A winding mountain pass. Cold and treacherous.',
  },
  {
    from: 'valley_farm',
    to: 'capital_city',
    distance: 3,
    dangerRating: 15,
    terrainDescription: 'The Royal Road. Well-traveled but not without risk.',
  },
  {
    from: 'valley_farm',
    to: 'deepwood_camp',
    distance: 3,
    dangerRating: 20,
    terrainDescription: 'A forest trail. Wolves and worse lurk in the dark.',
  },
  {
    from: 'mountain_forge',
    to: 'desert_bazaar',
    distance: 5,
    dangerRating: 30,
    terrainDescription: 'Barren rocky terrain giving way to sand. Bandits are common.',
  },
  {
    from: 'desert_bazaar',
    to: 'capital_city',
    distance: 4,
    dangerRating: 20,
    terrainDescription: 'The Spice Road. Profitable and moderately dangerous.',
  },
  {
    from: 'deepwood_camp',
    to: 'mountain_forge',
    distance: 4,
    dangerRating: 30,
    terrainDescription: 'A hidden path through dense forest and steep inclines.',
  },
  {
    from: 'deepwood_camp',
    to: 'capital_city',
    distance: 4,
    dangerRating: 22,
    terrainDescription: 'The Lumber Road. Rough but passable.',
  },
  {
    from: 'capital_city',
    to: 'desert_bazaar',
    distance: 4,
    dangerRating: 18,
    terrainDescription: 'The Grand Merchant Way. Patrols keep it mostly safe.',
  },
  // ─── NEW TOWN ROUTES ──────────────────────────────────
  {
    from: 'port_harbor',
    to: 'capital_city',
    distance: 3,
    dangerRating: 12,
    terrainDescription: 'The Coastal Highway. Well-patrolled and bustling with trade.',
  },
  {
    from: 'port_harbor',
    to: 'desert_bazaar',
    distance: 5,
    dangerRating: 25,
    terrainDescription: 'The Sea-Sand Passage. Exposed cliffs give way to arid dunes.',
  },
  {
    from: 'port_harbor',
    to: 'valley_farm',
    distance: 3,
    dangerRating: 10,
    terrainDescription: 'A pleasant riverside road. Fishermen wave as you pass.',
  },
  {
    from: 'monastery',
    to: 'valley_farm',
    distance: 3,
    dangerRating: 8,
    terrainDescription: 'The Pilgrim\'s Path. Peaceful and well-maintained by monks.',
  },
  {
    from: 'monastery',
    to: 'capital_city',
    distance: 4,
    dangerRating: 14,
    terrainDescription: 'The Abbey Road. Rolling hills and occasional pilgrims.',
  },
  {
    from: 'monastery',
    to: 'deepwood_camp',
    distance: 4,
    dangerRating: 18,
    terrainDescription: 'A narrow trail through the forest foothills. Quiet but eerie.',
  },
  {
    from: 'border_fort',
    to: 'mountain_forge',
    distance: 3,
    dangerRating: 28,
    terrainDescription: 'The Iron Road. Military supply line through hostile passes.',
  },
  {
    from: 'border_fort',
    to: 'deepwood_camp',
    distance: 3,
    dangerRating: 35,
    terrainDescription: 'A treacherous frontier path. Bandits, wolves, and worse.',
  },
  {
    from: 'border_fort',
    to: 'capital_city',
    distance: 5,
    dangerRating: 22,
    terrainDescription: 'The King\'s March. Long but strategically important.',
  },
];

// Build a lookup map: "townA:townB" -> Route (normalized alphabetically)
const routeMap: Record<string, Route> = {};
for (const route of ROUTES) {
  const key = [route.from, route.to].sort().join(':');
  routeMap[key] = route;
}

export function getRoute(a: TownId, b: TownId): Route | null {
  const key = [a, b].sort().join(':');
  return routeMap[key] ?? null;
}

// Map positions for the world map display (normalized 0-1)
export const TOWN_MAP_POSITIONS: Record<TownId, { x: number; y: number }> = {
  valley_farm:    { x: 0.28, y: 0.42 },
  mountain_forge: { x: 0.22, y: 0.18 },
  desert_bazaar:  { x: 0.72, y: 0.70 },
  deepwood_camp:  { x: 0.15, y: 0.65 },
  capital_city:   { x: 0.50, y: 0.32 },
  port_harbor:    { x: 0.52, y: 0.60 },
  monastery:      { x: 0.32, y: 0.72 },
  border_fort:    { x: 0.80, y: 0.22 },
};

