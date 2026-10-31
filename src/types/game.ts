// ============================================================
// CORE GAME TYPES
// ============================================================

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type TownId = 'valley_farm' | 'mountain_forge' | 'desert_bazaar' | 'deepwood_camp' | 'capital_city';
export type ItemId =
  | 'wheat' | 'livestock' | 'iron' | 'tools' | 'weapons'
  | 'spices' | 'silk' | 'water' | 'wood' | 'furs'
  | 'luxury_goods' | 'cloth' | 'food' | 'gold_coin';

export type VehicleTier = 1 | 2 | 3 | 4;
export type GameScreen = 'title' | 'town' | 'map' | 'tavern' | 'wainwright' | 'travel' | 'event' | 'game_over' | 'victory';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  emoji: string;
  basePrice: number;
  baseDemand: number;
  description: string;
}

export interface TownProduction {
  itemId: ItemId;
  productionRate: number;  // units per day added to supply
  consumptionRate: number; // units per day removed from supply
  initialSupply: number;
}

export interface TownDefinition {
  id: TownId;
  name: string;
  emoji: string;
  description: string;
  biome: string;
  backgroundGradient: string[];
  productions: TownProduction[];
  rumorItems: ItemId[]; // items to show rumors about
}

export interface Route {
  from: TownId;
  to: TownId;
  distance: number;   // days of travel
  dangerRating: number; // 0-100 percent
  terrainDescription: string;
}

export interface TownMarket {
  townId: TownId;
  supplies: Record<ItemId, number>;
}

export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
  purchasePrice: number; // average cost basis per unit
}

export interface Guard {
  id: string;
  name: string;
  tier: number;       // 1 = basic, 2 = veteran
  power: number;      // combat contribution
  dailyWage: number;  // gold per day
}

export interface VehicleDefinition {
  tier: VehicleTier;
  name: string;
  emoji: string;
  cargoSlots: number;
  foodUpkeepPerDay: number;
  goldUpkeepPerDay: number; // base (without guards)
  maxGuards: number;
  cost: number;
}

export interface PlayerState {
  gold: number;
  food: number;
  currentTownId: TownId;
  inventory: InventorySlot[];
  vehicleTier: VehicleTier;
  guards: Guard[];
  totalDays: number;
  totalProfit: number;
}

export interface TravelState {
  destination: TownId;
  daysRemaining: number;
  totalDays: number;
  currentRouteId: string;
  eventPending: boolean;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  threatLevel: number;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  resolve: (state: GameState) => EventResolution;
}

export interface EventResolution {
  success: boolean;
  message: string;
  goldDelta: number;
  foodDelta: number;
  cargoLossPct: number;  // 0-1
  guardsLost: number;
  loot: number;
}

export interface GameState {
  screen: GameScreen;
  player: PlayerState;
  markets: Record<TownId, TownMarket>;
  currentDay: number;
  season: Season;
  dayOfSeason: number;   // 0-29
  travelState: TravelState | null;
  pendingEvent: GameEvent | null;
  lastEventResolution: EventResolution | null;
  messageLog: string[];
}

