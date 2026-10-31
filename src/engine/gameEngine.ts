// ============================================================
// GAME ENGINE — Pure state transformation functions
// All functions return new state objects (immutable pattern)
// ============================================================

import type {
  GameState, PlayerState, TownMarket, InventorySlot,
  ItemId, TownId, Season, Guard, VehicleTier,
} from '../types/game';
import { TOWNS, TOWN_IDS } from '../data/towns';
import { ITEMS } from '../data/items';
import { VEHICLES, SEASON_LENGTH_DAYS } from '../data/vehicles';
import { getRoute } from '../data/routes';
import { rollForEvent } from '../data/events';

// ─── PRICE CALCULATION ────────────────────────────────────────────────────

export function calcPrice(itemId: ItemId, supply: number): number {
  const item = ITEMS[itemId];
  const rawPrice = item.basePrice * (item.baseDemand / Math.max(1, supply));
  const min = item.basePrice * 0.25;
  const max = item.basePrice * 4.0;
  return Math.round(Math.max(min, Math.min(max, rawPrice)));
}

// ─── SEASONAL MODIFIERS ───────────────────────────────────────────────────

interface SeasonModifier {
  productionMult: Partial<Record<ItemId, number>>;
  consumptionMult: Partial<Record<ItemId, number>>;
}

export const SEASON_MODIFIERS: Record<Season, SeasonModifier> = {
  Spring: {
    productionMult: { wheat: 1.5, wood: 1.2 },
    consumptionMult: { tools: 2.5, wheat: 1.2 },
  },
  Summer: {
    productionMult: { wheat: 1.3, spices: 1.4, silk: 1.2 },
    consumptionMult: { water: 2.5, food: 1.3 },
  },
  Autumn: {
    productionMult: { wheat: 1.8, livestock: 1.3, furs: 1.2 },
    consumptionMult: { food: 1.5, wood: 1.3 },
  },
  Winter: {
    productionMult: { wheat: 0.1, livestock: 0.5, food: 0.2 },
    consumptionMult: { wood: 3.0, furs: 2.5, food: 2.0, wheat: 1.5 },
  },
};

// ─── INITIAL STATE ────────────────────────────────────────────────────────

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
  };
}

export function buildInitialState(): GameState {
  return {
    screen: 'title',
    player: buildInitialPlayer(),
    markets: buildInitialMarkets(),
    currentDay: 1,
    season: 'Spring',
    dayOfSeason: 0,
    travelState: null,
    pendingEvent: null,
    lastEventResolution: null,
    messageLog: ['Your journey as a merchant begins. Buy low, sell high!'],
  };
}

// ─── MARKET TICK ──────────────────────────────────────────────────────────

export function tickMarkets(state: GameState): GameState {
  const modifier = SEASON_MODIFIERS[state.season];
  const newMarkets = { ...state.markets };

  for (const townId of TOWN_IDS) {
    const town = TOWNS[townId];
    const market = { ...newMarkets[townId] };
    const newSupplies = { ...market.supplies };

    for (const prod of town.productions) {
      const { itemId, productionRate, consumptionRate } = prod;
      const prodMult = modifier.productionMult[itemId] ?? 1;
      const consMult = modifier.consumptionMult[itemId] ?? 1;
      const netChange = Math.round(productionRate * prodMult) - Math.round(consumptionRate * consMult);
      newSupplies[itemId] = Math.max(0, (newSupplies[itemId] ?? 0) + netChange);
    }

    market.supplies = newSupplies;
    newMarkets[townId] = market;
  }

  return { ...state, markets: newMarkets };
}

// ─── SEASON TICK ─────────────────────────────────────────────────────────

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

export function advanceSeason(state: GameState): GameState {
  const newDayOfSeason = state.dayOfSeason + 1;
  if (newDayOfSeason >= SEASON_LENGTH_DAYS) {
    const idx = SEASONS.indexOf(state.season);
    const newSeason = SEASONS[(idx + 1) % SEASONS.length];
    return { ...state, dayOfSeason: 0, season: newSeason };
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
  const foodNeeded = vehicle.foodUpkeepPerDay + guards.length;
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

  // Roll for event
  const event = rollForEvent(route.dangerRating);
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
  return {
    ...state,
    screen: 'town',
    player: { ...state.player, currentTownId: dest },
    travelState: null,
    messageLog: messages.slice(-20),
  };
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

  const newPlayer = { ...state.player, gold, food, inventory, guards };
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
  const price = calcPrice(itemId, supply);
  const totalCost = price * quantity;
  const vehicle = VEHICLES[state.player.vehicleTier];
  const currentSlots = state.player.inventory.reduce((s, i) => s + i.quantity, 0);

  if (supply < quantity) return { state, error: 'Not enough supply in market.' };
  if (state.player.gold < totalCost) return { state, error: 'Not enough Gold.' };
  if (currentSlots + quantity > vehicle.cargoSlots) return { state, error: 'Not enough cargo space.' };

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
  const sellPrice = calcPrice(itemId, supply);
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
  const newPlayer = {
    ...state.player,
    gold: state.player.gold + totalEarned,
    inventory: newInventory,
    totalProfit: state.player.totalProfit + profit,
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

  const messages = [...state.messageLog, `🚀 Departing for ${TOWNS[destination].name}. Journey: ${route.distance} days.`];
  return {
    state: {
      ...state,
      screen: 'travel',
      travelState: {
        destination,
        daysRemaining: route.distance,
        totalDays: route.distance,
        currentRouteId: `${route.from}:${route.to}`,
        eventPending: false,
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

  // 4. Advance travel
  afterMarkets = advanceTravelDay(afterMarkets);

  // 5. Increment day
  const finalState = {
    ...afterMarkets,
    currentDay: afterMarkets.currentDay + 1,
    player: {
      ...afterMarkets.player,
      totalDays: afterMarkets.player.totalDays + 1,
    },
  };

  return { state: finalState, messages: allMessages };
}

