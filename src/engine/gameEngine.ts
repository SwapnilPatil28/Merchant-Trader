// ============================================================
// GAME ENGINE — Pure state transformation functions
// All functions return new state objects (immutable pattern)
// ============================================================

import type {
  GameState, PlayerState, TownMarket, InventorySlot,
  ItemId, TownId, Season, Guard, VehicleTier, Weather, WorldEvent,
} from '../types/game';
import { TOWNS, TOWN_IDS } from '../data/towns';
import { ITEMS } from '../data/items';
import { VEHICLES, SEASON_LENGTH_DAYS } from '../data/vehicles';
import { getRoute, ROUTES } from '../data/routes';
import { rollForEvent } from '../data/events';

// ─── PRICE CALCULATION ────────────────────────────────────────────────────

export function calcPrice(itemId: ItemId, supply: number, reputation?: number, skills?: string[]): number {
  const item = ITEMS[itemId];
  const rawPrice = item.basePrice * (item.baseDemand / Math.max(1, supply));
  const min = item.basePrice * 0.25;
  const max = item.basePrice * 4.0;
  let price = Math.max(min, Math.min(max, rawPrice));
  // Reputation discount/markup: ±10% max at ±100 rep
  if (reputation) {
    const repMod = 1 - (reputation / 1000); // +100 rep = 10% discount, -100 rep = 10% markup
    price *= repMod;
  }
  // Haggler skill: 8% buy price reduction (applied by caller only when buying)
  if (skills?.includes('haggler')) {
    price *= 0.92;
  }
  return Math.round(price);
}

// ─── SEASONAL MODIFIERS ───────────────────────────────────────────────────

interface SeasonModifier {
  productionMult: Partial<Record<ItemId, number>>;
  consumptionMult: Partial<Record<ItemId, number>>;
}

export const SEASON_MODIFIERS: Record<Season, SeasonModifier> = {
  Spring: {
    productionMult: { wheat: 1.5, wood: 1.2, herbs: 1.8 },
    consumptionMult: { tools: 2.5, wheat: 1.2, rope: 1.5 },
  },
  Summer: {
    productionMult: { wheat: 1.3, spices: 1.4, silk: 1.2, fish: 1.5, wine: 1.3 },
    consumptionMult: { water: 2.5, food: 1.3, salt: 1.5, wine: 1.5 },
  },
  Autumn: {
    productionMult: { wheat: 1.8, livestock: 1.3, furs: 1.2, wine: 1.6 },
    consumptionMult: { food: 1.5, wood: 1.3, salt: 1.3, books: 1.5 },
  },
  Winter: {
    productionMult: { wheat: 0.1, livestock: 0.5, food: 0.2, fish: 0.4, herbs: 0.3, wine: 0.5 },
    consumptionMult: { wood: 3.0, furs: 2.5, food: 2.0, wheat: 1.5, wine: 2.0, herbs: 1.8 },
  },
};

// ─── INITIAL STATE ────────────────────────────────────────────────────

// ─── WEATHER SYSTEM ──────────────────────────────────────────────────────

const WEATHER_TYPES: Weather[] = ['clear', 'rain', 'fog', 'storm'];

export const WEATHER_INFO: Record<Weather, { emoji: string; name: string; dangerMod: number; speedMod: number; description: string }> = {
  clear: { emoji: '☀️', name: 'Clear', dangerMod: 0, speedMod: 0, description: 'Fair skies and good traveling weather.' },
  rain:  { emoji: '🌧️', name: 'Rain', dangerMod: 5, speedMod: 0, description: 'Muddy roads slow progress. Visibility reduced.' },
  fog:   { emoji: '🌫️', name: 'Fog', dangerMod: 12, speedMod: 0, description: 'Thick fog blankets the road. Ambushes are easier.' },
  storm: { emoji: '⛈️', name: 'Storm', dangerMod: 15, speedMod: 1, description: 'Howling wind and rain. Dangerous and slow.' },
};

// Season-weighted weather probability
const SEASON_WEATHER_WEIGHTS: Record<Season, Record<Weather, number>> = {
  Spring: { clear: 35, rain: 35, fog: 20, storm: 10 },
  Summer: { clear: 55, rain: 15, fog: 10, storm: 20 },
  Autumn: { clear: 25, rain: 30, fog: 30, storm: 15 },
  Winter: { clear: 20, rain: 15, fog: 25, storm: 40 },
};

function rollWeather(season: Season): Weather {
  const weights = SEASON_WEATHER_WEIGHTS[season];
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (const w of WEATHER_TYPES) {
    roll -= weights[w];
    if (roll <= 0) return w;
  }
  return 'clear';
}

function generateRouteWeather(season: Season): Record<string, Weather> {
  const weather: Record<string, Weather> = {};
  for (const route of ROUTES) {
    const key = [route.from, route.to].sort().join(':');
    weather[key] = rollWeather(season);
  }
  return weather;
}

export function getRouteWeather(state: GameState, fromTown: TownId, toTown: TownId): Weather {
  const key = [fromTown, toTown].sort().join(':');
  return state.routeWeather[key] ?? 'clear';
}

// ─── INITIAL STATE (original) ─────────────────────────────────────────────

export function buildInitialMarkets(): Record<TownId, TownMarket> {
  const markets = {} as Record<TownId, TownMarket>;
  for (const townId of TOWN_IDS) {
    const town = TOWNS[townId];
    const supplies = {} as Record<ItemId, number>;
    // Initialize to 0
    for (const itemId of Object.keys(ITEMS) as ItemId[]) {
      supplies[itemId] = 0;
    }
    // Set initial supplies
    for (const prod of town.productions) {
      supplies[prod.itemId] = prod.initialSupply;
    }
    markets[townId] = { townId, supplies };
  }
  return markets;
}

export function buildInitialPlayer(): PlayerState {
  return {
    gold: 200,
    food: 10,
    currentTownId: 'valley_farm',
    inventory: [],
    vehicleTier: 1,
    guards: [],
    totalDays: 0,
    totalProfit: 0,
    totalTradesMade: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    totalCargoLost: 0,
    totalGuardsLost: 0,
    totalEventsfaced: 0,
    totalContractsCompleted: 0,
    townsVisited: ['valley_farm'],
    reputation: {},
    skills: [],
    xp: 0,
    level: 1,
  };
}

export function buildInitialState(): GameState {
  const season: Season = 'Spring';
  return {
    screen: 'title',
    player: buildInitialPlayer(),
    markets: buildInitialMarkets(),
    currentDay: 1,
    season,
    dayOfSeason: 0,
    travelState: null,
    pendingEvent: null,
    lastEventResolution: null,
    messageLog: ['Your journey as a merchant begins. Buy low, sell high!'],
    routeWeather: generateRouteWeather(season),
    priceHistory: buildInitialPriceHistory(),
    contracts: [],
    activeContracts: [],
    activeWorldEvents: [],
  };
}

const PRICE_HISTORY_LENGTH = 15;

function buildInitialPriceHistory(): Record<TownId, Partial<Record<ItemId, number[]>>> {
  const history = {} as Record<TownId, Partial<Record<ItemId, number[]>>>;
  for (const townId of TOWN_IDS) {
    history[townId] = {};
    const town = TOWNS[townId];
    for (const prod of town.productions) {
      const price = calcPrice(prod.itemId, prod.initialSupply);
      history[townId][prod.itemId] = [price];
    }
  }
  return history;
}

// ─── MARKET TICK ──────────────────────────────────────────────────────────

export function tickMarkets(state: GameState): GameState {
  const modifier = SEASON_MODIFIERS[state.season];
  const newMarkets = { ...state.markets };
  const newHistory = { ...state.priceHistory };

  for (const townId of TOWN_IDS) {
    const town = TOWNS[townId];
    const market = { ...newMarkets[townId] };
    const newSupplies = { ...market.supplies };
    const townHistory = { ...newHistory[townId] };

    for (const prod of town.productions) {
      const { itemId, productionRate, consumptionRate } = prod;
      let prodMult = modifier.productionMult[itemId] ?? 1;
      let consMult = modifier.consumptionMult[itemId] ?? 1;

      // Apply active world event modifiers for this town
      for (const event of state.activeWorldEvents) {
        if (event.affectedTowns.includes(townId)) {
          if (event.productionMultiplier[itemId] !== undefined) {
            prodMult *= event.productionMultiplier[itemId]!;
          }
          if (event.demandMultiplier[itemId] !== undefined) {
            consMult *= event.demandMultiplier[itemId]!;
          }
        }
      }

      const netChange = Math.round(productionRate * prodMult) - Math.round(consumptionRate * consMult);
      newSupplies[itemId] = Math.max(0, (newSupplies[itemId] ?? 0) + netChange);

      // Record price history
      const price = calcPrice(itemId, newSupplies[itemId]);
      const existing = townHistory[itemId] ?? [];
      townHistory[itemId] = [...existing.slice(-(PRICE_HISTORY_LENGTH - 1)), price];
    }

    market.supplies = newSupplies;
    newMarkets[townId] = market;
    newHistory[townId] = townHistory;
  }

  return { ...state, markets: newMarkets, priceHistory: newHistory };
}

// ─── SEASON TICK ─────────────────────────────────────────────────────────

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export function advanceSeason(state: GameState): GameState {
  const newDayOfSeason = state.dayOfSeason + 1;
  if (newDayOfSeason >= SEASON_LENGTH_DAYS) {
    const idx = SEASONS.indexOf(state.season);
    const newSeason = SEASONS[(idx + 1) % SEASONS.length];
    return {
      ...state,
      dayOfSeason: 0,
      season: newSeason,
      routeWeather: generateRouteWeather(newSeason),
    };
  }
  // Re-roll weather every 5 days within a season
  if (newDayOfSeason % 5 === 0) {
    return {
      ...state,
      dayOfSeason: newDayOfSeason,
      routeWeather: generateRouteWeather(state.season),
    };
  }
  return { ...state, dayOfSeason: newDayOfSeason };
}

// ─── TRAVEL UPKEEP ───────────────────────────────────────────────────────

export function applyDailyUpkeep(state: GameState): { state: GameState; messages: string[] } {
  const messages: string[] = [];
  const vehicle = VEHICLES[state.player.vehicleTier];
  let food = state.player.food;
  let gold = state.player.gold;
  const guards = [...state.player.guards];

  // Food consumption: vehicle base + 1 per guard
  // Iron Stomach skill: reduce food consumption by 1
  const ironStomachReduction = hasSkill(state, 'iron_stomach') ? 1 : 0;
  const foodNeeded = Math.max(0, vehicle.foodUpkeepPerDay + guards.length - ironStomachReduction);
  if (food >= foodNeeded) {
    food -= foodNeeded;
  } else {
    // Starvation
    const deficit = foodNeeded - food;
    food = 0;
    messages.push(`⚠️ You ran out of food! (${deficit} rations short)`);
    // Random desertion chance per missing ration
    for (let i = 0; i < deficit && guards.length > 0; i++) {
      if (Math.random() < 0.5) {
        const deserter = guards.pop()!;
        messages.push(`💀 ${deserter.name} deserted due to starvation!`);
      }
    }
  }

  // Gold wages
  const wagesNeeded = guards.reduce((sum, g) => sum + g.dailyWage, 0);
  if (gold >= wagesNeeded) {
    gold -= wagesNeeded;
  } else {
    messages.push(`⚠️ You couldn't pay full wages! Guards are restless.`);
    gold = 0;
  }

  const newPlayer = { ...state.player, food, gold, guards };
  return { state: { ...state, player: newPlayer }, messages };
}

// ─── TRAVEL ADVANCE ──────────────────────────────────────────────────────

export function advanceTravelDay(state: GameState): GameState {
  if (!state.travelState) return state;

  const route = getRoute(state.player.currentTownId, state.travelState.destination);
  if (!route) return state;

  // Weather modifies danger
  const weather = state.travelState.weather;
  const weatherInfo = WEATHER_INFO[weather];
  // Scout's Eye skill: reduce danger by 10%
  const scoutReduction = hasSkill(state, 'scouts_eye') ? 10 : 0;
  const effectiveDanger = Math.max(0, route.dangerRating + weatherInfo.dangerMod - scoutReduction);

  // Roll for event with weather-modified danger
  const event = rollForEvent(effectiveDanger);
  if (event) {
    return {
      ...state,
      pendingEvent: event,
      travelState: { ...state.travelState, eventPending: true },
    };
  }

  const newDaysRemaining = state.travelState.daysRemaining - 1;
  const arrived = newDaysRemaining <= 0;

  if (arrived) {
    return arriveAtDestination(state);
  }

  return {
    ...state,
    travelState: { ...state.travelState, daysRemaining: newDaysRemaining },
  };
}

function arriveAtDestination(state: GameState): GameState {
  const dest = state.travelState!.destination;
  const messages = [...state.messageLog, `🏘️ You arrived at ${TOWNS[dest].name}!`];
  const visited = state.player.townsVisited.includes(dest)
    ? state.player.townsVisited
    : [...state.player.townsVisited, dest];

  let newState: GameState = {
    ...state,
    screen: 'town',
    player: { ...state.player, currentTownId: dest, townsVisited: visited },
    travelState: null,
    messageLog: messages.slice(-20),
  };

  // Check and complete contracts on arrival
  newState = checkContractsOnArrival(newState);

  // Generate fresh contracts for the tavern
  newState = { ...newState, contracts: generateContracts(newState) };

  return newState;
}

export function resolveEventAndContinue(state: GameState, resolution: ReturnType<typeof import('../data/events').EVENTS[0]['choices'][0]['resolve']>): GameState {
  const messages = [...state.messageLog, resolution.message];

  let { gold, food, inventory, guards } = state.player;

  // Apply gold delta
  gold = Math.max(0, gold + resolution.goldDelta + resolution.loot);

  // Apply food delta
  food = Math.max(0, food + resolution.foodDelta);

  // Apply cargo loss
  if (resolution.cargoLossPct > 0) {
    inventory = applyCargoLoss(inventory, resolution.cargoLossPct);
  }

  // Apply guard loss
  if (resolution.guardsLost > 0) {
    guards = guards.slice(resolution.guardsLost);
  }

  const newPlayer = {
    ...state.player,
    gold, food, inventory, guards,
    totalEventsfaced: state.player.totalEventsfaced + 1,
    totalCargoLost: state.player.totalCargoLost + (resolution.cargoLossPct > 0 ? Math.floor(state.player.inventory.reduce((s, i) => s + i.quantity, 0) * resolution.cargoLossPct) : 0),
    totalGuardsLost: state.player.totalGuardsLost + resolution.guardsLost,
  };
  const newTravelState = state.travelState
    ? { ...state.travelState, daysRemaining: state.travelState.daysRemaining - 1, eventPending: false }
    : null;

  const arrived = newTravelState && newTravelState.daysRemaining <= 0;

  let newState: GameState = {
    ...state,
    player: newPlayer,
    travelState: newTravelState,
    pendingEvent: null,
    lastEventResolution: resolution,
    messageLog: messages.slice(-20),
  };

  if (arrived) {
    newState = arriveAtDestination(newState);
  }

  return newState;
}

function applyCargoLoss(inventory: InventorySlot[], pct: number): InventorySlot[] {
  return inventory
    .map(slot => {
      const lost = Math.floor(slot.quantity * pct);
      return { ...slot, quantity: slot.quantity - lost };
    })
    .filter(slot => slot.quantity > 0);
}

// ─── TRADING ─────────────────────────────────────────────────────────────

export function buyItem(
  state: GameState,
  itemId: ItemId,
  quantity: number,
): { state: GameState; error?: string } {
  const townId = state.player.currentTownId;
  const market = state.markets[townId];
  const supply = market.supplies[itemId] ?? 0;
  const rep = state.player.reputation[townId] ?? 0;
  // Apply haggler skill to buy prices
  const price = calcPrice(itemId, supply, rep, state.player.skills);
  const totalCost = price * quantity;
  const vehicle = VEHICLES[state.player.vehicleTier];
  // Bulk Trader skill: +5 cargo slots
  const bonusSlots = hasSkill(state, 'bulk_trader') ? 5 : 0;
  const maxSlots = vehicle.cargoSlots + bonusSlots;
  const currentSlots = state.player.inventory.reduce((s, i) => s + i.quantity, 0);

  if (supply < quantity) return { state, error: 'Not enough supply in market.' };
  if (state.player.gold < totalCost) return { state, error: 'Not enough Gold.' };
  if (currentSlots + quantity > maxSlots) return { state, error: 'Not enough cargo space.' };

  // Update market supply
  const newSupplies = { ...market.supplies, [itemId]: supply - quantity };
  const newMarket = { ...market, supplies: newSupplies };
  const newMarkets = { ...state.markets, [townId]: newMarket };

  // Update player inventory
  const existingSlot = state.player.inventory.find(s => s.itemId === itemId);
  let newInventory: InventorySlot[];
  if (existingSlot) {
    const totalQty = existingSlot.quantity + quantity;
    const avgCost = (existingSlot.purchasePrice * existingSlot.quantity + price * quantity) / totalQty;
    newInventory = state.player.inventory.map(s =>
      s.itemId === itemId ? { ...s, quantity: totalQty, purchasePrice: avgCost } : s
    );
  } else {
    newInventory = [...state.player.inventory, { itemId, quantity, purchasePrice: price }];
  }

  const newPlayer = {
    ...state.player,
    gold: state.player.gold - totalCost,
    inventory: newInventory,
    totalTradesMade: state.player.totalTradesMade + 1,
    totalGoldSpent: state.player.totalGoldSpent + totalCost,
    xp: state.player.xp + Math.floor(totalCost / 10),
  };

  const messages = [...state.messageLog, `🛒 Bought ${quantity}x ${ITEMS[itemId].name} for ${totalCost} Gold (${price}g each).`];

  return {
    state: {
      ...state,
      player: newPlayer,
      markets: newMarkets,
      messageLog: messages.slice(-20),
    },
  };
}

export function sellItem(
  state: GameState,
  itemId: ItemId,
  quantity: number,
): { state: GameState; error?: string } {
  const townId = state.player.currentTownId;
  const market = state.markets[townId];
  const supply = market.supplies[itemId] ?? 0;
  const rep = state.player.reputation[townId] ?? 0;
  const sellPrice = calcPrice(itemId, supply, rep);
  const totalEarned = sellPrice * quantity;

  const slot = state.player.inventory.find(s => s.itemId === itemId);
  if (!slot || slot.quantity < quantity) return { state, error: 'You don\'t have that many.' };

  // Update market
  const newSupplies = { ...market.supplies, [itemId]: supply + quantity };
  const newMarket = { ...market, supplies: newSupplies };
  const newMarkets = { ...state.markets, [townId]: newMarket };

  // Update inventory
  const newInventory = state.player.inventory
    .map(s => s.itemId === itemId ? { ...s, quantity: s.quantity - quantity } : s)
    .filter(s => s.quantity > 0);

  const profit = totalEarned - slot.purchasePrice * quantity;
  // Silver Tongue skill: double reputation gains
  const repMultiplier = hasSkill(state, 'silver_tongue') ? 2 : 1;
  const repGain = profit > 0 ? Math.min(5, Math.floor(profit / 50)) * repMultiplier : 0;
  const currentRep = state.player.reputation[townId] ?? 0;
  const newPlayer = {
    ...state.player,
    gold: state.player.gold + totalEarned,
    inventory: newInventory,
    totalProfit: state.player.totalProfit + profit,
    totalTradesMade: state.player.totalTradesMade + 1,
    totalGoldEarned: state.player.totalGoldEarned + totalEarned,
    xp: state.player.xp + Math.floor(totalEarned / 5),
    reputation: {
      ...state.player.reputation,
      [townId]: Math.min(100, currentRep + repGain),
    },
  };

  const profitStr = profit >= 0 ? `+${Math.round(profit)}g profit` : `${Math.round(profit)}g loss`;
  const messages = [...state.messageLog, `💰 Sold ${quantity}x ${ITEMS[itemId].name} for ${totalEarned} Gold (${profitStr}).`];

  return {
    state: {
      ...state,
      player: newPlayer,
      markets: newMarkets,
      messageLog: messages.slice(-20),
    },
  };
}

// ─── START TRAVEL ─────────────────────────────────────────────────────────

export function startTravel(state: GameState, destination: TownId): { state: GameState; error?: string } {
  const route = getRoute(state.player.currentTownId, destination);
  if (!route) return { state, error: 'No route to that town.' };
  if (destination === state.player.currentTownId) return { state, error: 'You are already there.' };

  const weather = getRouteWeather(state, state.player.currentTownId, destination);
  const weatherInfo = WEATHER_INFO[weather];
  // Pathfinder skill: reduce route distance by 1 (min 1)
  const pathfinderReduction = hasSkill(state, 'pathfinder') ? 1 : 0;
  const totalDistance = Math.max(1, route.distance + weatherInfo.speedMod - pathfinderReduction);

  const weatherMsg = weather !== 'clear' ? ` ${weatherInfo.emoji} Weather: ${weatherInfo.name} — ${weatherInfo.description}` : '';
  const messages = [...state.messageLog, `🚀 Departing for ${TOWNS[destination].name}. Journey: ${totalDistance} days.${weatherMsg}`];

  return {
    state: {
      ...state,
      screen: 'travel',
      travelState: {
        destination,
        daysRemaining: totalDistance,
        totalDays: totalDistance,
        currentRouteId: `${route.from}:${route.to}`,
        eventPending: false,
        weather,
      },
      messageLog: messages.slice(-20),
    },
  };
}

// ─── GUARD HIRING ────────────────────────────────────────────────────────

export function hireGuard(state: GameState, guard: Guard): { state: GameState; error?: string } {
  const vehicle = VEHICLES[state.player.vehicleTier];
  if (state.player.guards.length >= vehicle.maxGuards) {
    return { state, error: `Your ${vehicle.name} can only hold ${vehicle.maxGuards} guard(s).` };
  }
  if (state.player.gold < guard.dailyWage * 5) {
    return { state, error: 'Not enough gold to hire this guard.' };
  }
  const hireCost = guard.dailyWage * 5; // 5-day advance payment
  const newPlayer = {
    ...state.player,
    gold: state.player.gold - hireCost,
    guards: [...state.player.guards, guard],
  };
  const messages = [...state.messageLog, `🛡️ Hired ${guard.name} for ${hireCost} Gold (5-day advance).`];
  return { state: { ...state, player: newPlayer, messageLog: messages.slice(-20) } };
}

export function fireGuard(state: GameState, guardId: string): GameState {
  const newPlayer = {
    ...state.player,
    guards: state.player.guards.filter(g => g.id !== guardId),
  };
  return { ...state, player: newPlayer };
}

// ─── VEHICLE UPGRADE ─────────────────────────────────────────────────────

export function buyFood(
  state: GameState,
  quantity: number,
): { state: GameState; error?: string } {
  const townId = state.player.currentTownId;
  const market = state.markets[townId];
  const supply = market.supplies['food'] ?? 0;
  const price = calcPrice('food', supply);
  const totalCost = price * quantity;

  if (supply < quantity) return { state, error: 'Not enough food in market.' };
  if (state.player.gold < totalCost) return { state, error: 'Not enough Gold.' };

  // Update market supply
  const newSupplies = { ...market.supplies, food: supply - quantity };
  const newMarket = { ...market, supplies: newSupplies };
  const newMarkets = { ...state.markets, [townId]: newMarket };

  const newPlayer = {
    ...state.player,
    gold: state.player.gold - totalCost,
    food: state.player.food + quantity,
  };

  const messages = [...state.messageLog, `🍞 Bought ${quantity} rations for ${totalCost} Gold (${price}g each). Food: ${newPlayer.food}`];

  return {
    state: {
      ...state,
      player: newPlayer,
      markets: newMarkets,
      messageLog: messages.slice(-20),
    },
  };
}

export function upgradeVehicle(state: GameState, tier: VehicleTier): { state: GameState; error?: string } {
  const vehicle = VEHICLES[tier];
  if (tier <= state.player.vehicleTier) return { state, error: 'You already have this tier or better.' };
  if (state.player.gold < vehicle.cost) return { state, error: `Need ${vehicle.cost} Gold. You have ${state.player.gold}.` };

  // Check guard capacity
  const newGuardCap = vehicle.maxGuards;
  let guards = state.player.guards;
  let messages = [...state.messageLog];

  if (guards.length > newGuardCap) {
    const released = guards.slice(newGuardCap);
    guards = guards.slice(0, newGuardCap);
    for (const g of released) messages.push(`🚶 ${g.name} was released — no room in the new vehicle.`);
  }

  const newPlayer = {
    ...state.player,
    gold: state.player.gold - vehicle.cost,
    vehicleTier: tier,
    guards,
  };

  messages.push(`🚗 Upgraded to ${vehicle.name}! ${vehicle.cargoSlots} cargo slots.`);
  return { state: { ...state, player: newPlayer, messageLog: messages.slice(-20) } };
}

// ─── BANKRUPTCY / WIN CHECK ───────────────────────────────────────────────

export function checkGameOver(state: GameState): GameState {
  const { gold, food, inventory } = state.player;
  const cargoValue = inventory.reduce((sum, slot) => {
    const supply = state.markets[state.player.currentTownId].supplies[slot.itemId] ?? 1;
    return sum + calcPrice(slot.itemId, supply) * slot.quantity;
  }, 0);

  if (gold === 0 && food === 0 && cargoValue === 0 && state.screen === 'town') {
    return { ...state, screen: 'game_over' };
  }
  return state;
}

// ─── FULL DAY TICK (called by travel timer) ───────────────────────────────

export function performDayTick(state: GameState): { state: GameState; messages: string[] } {
  const allMessages: string[] = [];

  // 1. Apply upkeep
  const { state: afterUpkeep, messages: upkeepMsgs } = applyDailyUpkeep(state);
  allMessages.push(...upkeepMsgs);

  // 2. Advance season
  let afterSeason = advanceSeason(afterUpkeep);

  // 3. Tick markets
  let afterMarkets = tickMarkets(afterSeason);

  // 3.5. Tick world events
  afterMarkets = tickWorldEvents(afterMarkets);

  // 4. Advance travel
  afterMarkets = advanceTravelDay(afterMarkets);

  // 5. Increment day + level up check
  const newLevel = getPlayerLevel(afterMarkets.player.xp);
  const finalState = {
    ...afterMarkets,
    currentDay: afterMarkets.currentDay + 1,
    player: {
      ...afterMarkets.player,
      totalDays: afterMarkets.player.totalDays + 1,
      level: newLevel,
    },
  };

  return { state: finalState, messages: allMessages };
}

// ─── CONTRACTS ────────────────────────────────────────────────────────────

import type { Contract } from '../types/game';

// Items that can be part of delivery contracts
const CONTRACT_ITEMS: ItemId[] = [
  'wheat', 'livestock', 'iron', 'tools', 'weapons', 'spices', 'silk',
  'wood', 'furs', 'cloth', 'fish', 'salt', 'wine', 'herbs', 'books',
];

export function generateContracts(state: GameState): Contract[] {
  const currentTown = state.player.currentTownId;
  const contracts: Contract[] = [];

  // Generate 2-4 contracts
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const itemId = CONTRACT_ITEMS[Math.floor(Math.random() * CONTRACT_ITEMS.length)];
    // Pick a destination that's not current town
    const destinations = TOWN_IDS.filter(id => id !== currentTown);
    const destination = destinations[Math.floor(Math.random() * destinations.length)];

    const item = ITEMS[itemId];
    const quantity = 3 + Math.floor(Math.random() * 12);
    const baseReward = item.basePrice * quantity * 1.5;
    const reward = Math.round(baseReward + Math.random() * baseReward * 0.5);
    const deadline = state.currentDay + 10 + Math.floor(Math.random() * 20);

    contracts.push({
      id: `contract-${state.currentDay}-${i}`,
      itemId,
      quantity,
      destination,
      reward,
      deadlineDay: deadline,
      issuedAt: currentTown,
    });
  }

  return contracts;
}

export function acceptContract(state: GameState, contractId: string): { state: GameState; error?: string } {
  const contract = state.contracts.find(c => c.id === contractId);
  if (!contract) return { state, error: 'Contract not found.' };
  if (state.activeContracts.length >= 3) return { state, error: 'You can only have 3 active contracts.' };

  const messages = [...state.messageLog,
    `📜 Accepted contract: Deliver ${contract.quantity}x ${ITEMS[contract.itemId].name} to ${TOWNS[contract.destination].name} by Day ${contract.deadlineDay} for ${contract.reward}g.`
  ];

  return {
    state: {
      ...state,
      contracts: state.contracts.filter(c => c.id !== contractId),
      activeContracts: [...state.activeContracts, contract],
      messageLog: messages.slice(-20),
    },
  };
}

export function checkContractsOnArrival(state: GameState): GameState {
  const currentTown = state.player.currentTownId;
  let { gold, inventory } = state.player;
  const completedIds: string[] = [];
  const messages = [...state.messageLog];

  for (const contract of state.activeContracts) {
    if (contract.destination !== currentTown) continue;

    // Check if player has the goods
    const slot = inventory.find(s => s.itemId === contract.itemId);
    if (!slot || slot.quantity < contract.quantity) continue;

    // Check deadline
    if (state.currentDay > contract.deadlineDay) {
      messages.push(`📜 ❌ Contract expired: ${ITEMS[contract.itemId].name} delivery to ${TOWNS[contract.destination].name}.`);
      completedIds.push(contract.id);
      continue;
    }

    // Complete the contract!
    // Merchant Lord skill: +25% contract rewards
    const rewardBonus = hasSkill(state, 'merchant_lord') ? 1.25 : 1;
    const finalReward = Math.round(contract.reward * rewardBonus);
    gold += finalReward;
    inventory = inventory.map(s =>
      s.itemId === contract.itemId ? { ...s, quantity: s.quantity - contract.quantity } : s
    ).filter(s => s.quantity > 0);
    completedIds.push(contract.id);
    messages.push(`📜 ✅ Contract completed! Delivered ${contract.quantity}x ${ITEMS[contract.itemId].name}. Reward: +${finalReward}g!`);
  }

  // Remove expired contracts too
  const expired = state.activeContracts.filter(
    c => !completedIds.includes(c.id) && state.currentDay > c.deadlineDay
  );
  for (const c of expired) {
    messages.push(`📜 ❌ Contract expired: ${ITEMS[c.itemId].name} to ${TOWNS[c.destination].name}.`);
    completedIds.push(c.id);
  }

  if (completedIds.length === 0) return state;

  return {
    ...state,
    player: {
      ...state.player,
      gold,
      inventory,
      totalContractsCompleted: state.player.totalContractsCompleted + completedIds.length,
    },
    activeContracts: state.activeContracts.filter(c => !completedIds.includes(c.id)),
    messageLog: messages.slice(-20),
  };
}

// ─── WORLD EVENTS ─────────────────────────────────────────────────────────

const WORLD_EVENT_TEMPLATES: Omit<WorldEvent, 'id' | 'startDay' | 'endDay' | 'affectedTowns'>[] = [
  {
    title: 'Harvest Festival',
    emoji: '🎉',
    description: 'A grand celebration! Demand for Spices, Wine, and Luxury Goods surges.',
    type: 'festival',
    demandMultiplier: { spices: 2.5, wine: 2.0, luxury_goods: 2.0, food: 1.5 },
    productionMultiplier: {},
    dangerModifier: -5,
  },
  {
    title: 'Plague Outbreak',
    emoji: '☠️',
    description: 'Sickness spreads. Herbs are desperately needed. Consumption drops.',
    type: 'plague',
    demandMultiplier: { herbs: 3.0, wine: 0.5, luxury_goods: 0.3 },
    productionMultiplier: { wheat: 0.5, food: 0.5, livestock: 0.5 },
    dangerModifier: 10,
  },
  {
    title: 'Border Conflict',
    emoji: '⚔️',
    description: 'War drums echo. Weapons and Iron are in high demand. Routes become dangerous.',
    type: 'war',
    demandMultiplier: { weapons: 3.0, iron: 2.5, food: 2.0, rope: 1.5 },
    productionMultiplier: { luxury_goods: 0.3, silk: 0.5, cloth: 0.7 },
    dangerModifier: 15,
  },
  {
    title: 'Famine',
    emoji: '🥀',
    description: 'Crops have failed. Food and Wheat fetch astronomical prices.',
    type: 'famine',
    demandMultiplier: { wheat: 3.5, food: 3.0, livestock: 2.0, fish: 2.0 },
    productionMultiplier: { wheat: 0.1, food: 0.2 },
    dangerModifier: 8,
  },
  {
    title: 'Trade Boom',
    emoji: '📈',
    description: 'A merchant guild opens new trade routes! All production increases.',
    type: 'boom',
    demandMultiplier: { luxury_goods: 1.5 },
    productionMultiplier: { wheat: 1.5, iron: 1.5, wood: 1.5, cloth: 1.5, fish: 1.3 },
    dangerModifier: -8,
  },
];

export function tickWorldEvents(state: GameState): GameState {
  let newState = state;
  const messages = [...state.messageLog];

  // Remove expired events
  const activeEvents = state.activeWorldEvents.filter(e => state.currentDay <= e.endDay);
  const expiredEvents = state.activeWorldEvents.filter(e => state.currentDay > e.endDay);
  for (const e of expiredEvents) {
    messages.push(`🌍 ${e.emoji} "${e.title}" has ended in ${e.affectedTowns.map(t => TOWNS[t].name).join(', ')}.`);
  }

  // Random chance to spawn a new event (every ~15 days on average)
  if (Math.random() < 0.07 && activeEvents.length < 2) {
    const template = WORLD_EVENT_TEMPLATES[Math.floor(Math.random() * WORLD_EVENT_TEMPLATES.length)];
    // Pick 1-2 affected towns
    const shuffled = [...TOWN_IDS].sort(() => Math.random() - 0.5);
    const numTowns = 1 + Math.floor(Math.random() * 2);
    const affected = shuffled.slice(0, numTowns);
    const duration = 8 + Math.floor(Math.random() * 12);

    const newEvent: WorldEvent = {
      ...template,
      id: `we-${state.currentDay}-${Math.random().toString(36).slice(2, 6)}`,
      startDay: state.currentDay,
      endDay: state.currentDay + duration,
      affectedTowns: affected,
    };

    activeEvents.push(newEvent);
    messages.push(`🌍 ${newEvent.emoji} ${newEvent.title}! Affects ${affected.map(t => TOWNS[t].name).join(', ')} for ${duration} days.`);
  }

  newState = { ...newState, activeWorldEvents: activeEvents, messageLog: messages.slice(-20) };
  return newState;
}

// ─── SKILLS / PERKS ────────────────────────────────────────────────────────

export interface SkillDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  levelRequired: number;
}

export const SKILLS: SkillDefinition[] = [
  { id: 'haggler',       name: 'Haggler',          emoji: '🗣️', description: 'All buy prices reduced by 8%.', levelRequired: 2 },
  { id: 'iron_stomach',  name: 'Iron Stomach',     emoji: '🍖', description: 'Daily food consumption reduced by 1.', levelRequired: 3 },
  { id: 'pathfinder',    name: 'Pathfinder',       emoji: '🧭', description: 'All routes take 1 less day (min 1).', levelRequired: 4 },
  { id: 'silver_tongue', name: 'Silver Tongue',    emoji: '💬', description: 'Reputation gains doubled.', levelRequired: 5 },
  { id: 'bulk_trader',   name: 'Bulk Trader',      emoji: '📦', description: '+5 cargo slots on every vehicle.', levelRequired: 6 },
  { id: 'scouts_eye',    name: "Scout's Eye",      emoji: '👁️', description: 'Route danger reduced by 10%.', levelRequired: 7 },
  { id: 'merchant_lord',  name: 'Merchant Lord',   emoji: '👑', description: 'Contract rewards increased by 25%.', levelRequired: 8 },
];

export function getPlayerLevel(xp: number): number {
  // Level thresholds: 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600...
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold += 100 * level;
  }
  return level;
}

export function getXpForNextLevel(xp: number): { current: number; needed: number } {
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold += 100 * level;
  }
  return { current: remaining, needed: threshold };
}

export function learnSkill(state: GameState, skillId: string): { state: GameState; error?: string } {
  const skill = SKILLS.find(s => s.id === skillId);
  if (!skill) return { state, error: 'Unknown skill.' };
  if (state.player.skills.includes(skillId)) return { state, error: 'Already learned.' };
  if (state.player.level < skill.levelRequired) return { state, error: `Requires level ${skill.levelRequired}.` };

  const messages = [...state.messageLog, `⭐ Learned new skill: ${skill.emoji} ${skill.name}!`];
  return {
    state: {
      ...state,
      player: { ...state.player, skills: [...state.player.skills, skillId] },
      messageLog: messages.slice(-20),
    },
  };
}

export function hasSkill(state: GameState, skillId: string): boolean {
  return state.player.skills.includes(skillId);
}



