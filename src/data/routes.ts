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
  valley_farm:    { x: 0.30, y: 0.45 },
  mountain_forge: { x: 0.20, y: 0.22 },
  desert_bazaar:  { x: 0.65, y: 0.72 },
  deepwood_camp:  { x: 0.18, y: 0.65 },
  capital_city:   { x: 0.55, y: 0.30 },
};

