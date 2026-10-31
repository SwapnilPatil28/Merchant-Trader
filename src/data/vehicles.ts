import type { VehicleDefinition, VehicleTier } from '../types/game';

export const VEHICLES: Record<VehicleTier, VehicleDefinition> = {
  1: {
    tier: 1,
    name: 'Traveler\'s Backpack',
    emoji: '🎒',
    cargoSlots: 5,
    foodUpkeepPerDay: 1,
    goldUpkeepPerDay: 0,
    maxGuards: 0,
    cost: 0,
  },
  2: {
    tier: 2,
    name: 'Pushcart',
    emoji: '🛒',
    cargoSlots: 15,
    foodUpkeepPerDay: 1,
    goldUpkeepPerDay: 0,
    maxGuards: 1,
    cost: 500,
  },
  3: {
    tier: 3,
    name: 'Horse Wagon',
    emoji: '🐴',
    cargoSlots: 30,
    foodUpkeepPerDay: 2,
    goldUpkeepPerDay: 0,
    maxGuards: 3,
    cost: 2500,
  },
  4: {
    tier: 4,
    name: 'Merchant Caravan',
    emoji: '🏕️',
    cargoSlots: 60,
    foodUpkeepPerDay: 4,
    goldUpkeepPerDay: 0,
    maxGuards: 8,
    cost: 10000,
  },
};

export const GUARD_NAMES = [
  'Aldric', 'Brynn', 'Corvus', 'Dara', 'Emric',
  'Fiona', 'Gareth', 'Hilda', 'Ivan', 'Jora',
  'Kael', 'Lyra', 'Mord', 'Nessa', 'Osric',
];

export interface GuardTierDef {
  tier: number;
  name: string;
  power: number;
  dailyWage: number;
  hireCost: number;
}

export const GUARD_TIERS: GuardTierDef[] = [
  { tier: 1, name: 'Sellsword',  power: 5,  dailyWage: 5,  hireCost: 50  },
  { tier: 2, name: 'Veteran',    power: 12, dailyWage: 12, hireCost: 150 },
];

export const WIN_CONDITION_GOLD = 100_000;
export const MERCHANT_ESTATE_COST = 100_000;
export const SEASON_LENGTH_DAYS = 30;

