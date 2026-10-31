import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { GameState, ItemId, TownId, VehicleTier } from '../types/game';
import type { Guard } from '../types/game';
import type { EventResolution } from '../types/game';
import {
  buildInitialState,
  buyItem,
  sellItem,
  startTravel,
  hireGuard,
  fireGuard,
  upgradeVehicle,
  resolveEventAndContinue,
  performDayTick,
  checkGameOver,
  buyFood,
  acceptContract,
  generateContracts,
  learnSkill,
} from '../engine/gameEngine';

// ─── LocalStorage Save/Load ─────────────────────────────────────────────

const SAVE_KEY = 'merchants-ledger-save';
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  state: GameState;
  savedAt: string;
}

function saveToStorage(state: GameState): void {
  // Don't save title, game_over, or victory screens
  if (state.screen === 'title') return;

  try {
    const data: SaveData = {
      version: SAVE_VERSION,
      state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const data: SaveData = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) return null;

    // Basic validation: must have player and markets
    const s = data.state;
    if (!s.player || !s.markets || !s.currentDay) return null;

    // Migrate older saves that may be missing new fields
    s.player.totalTradesMade ??= 0;
    s.player.totalGoldEarned ??= 0;
    s.player.totalGoldSpent ??= 0;
    s.player.totalCargoLost ??= 0;
    s.player.totalGuardsLost ??= 0;
    s.player.totalEventsfaced ??= 0;
    s.player.totalContractsCompleted ??= 0;
    s.player.townsVisited ??= [s.player.currentTownId];
    s.player.reputation ??= {};
    s.player.skills ??= [];
    s.player.xp ??= 0;
    s.player.level ??= 1;
    s.routeWeather ??= {};
    s.priceHistory ??= {} as typeof s.priceHistory;
    s.contracts ??= [];
    s.activeContracts ??= [];
    s.activeWorldEvents ??= [];

    // Clear any pending events from a mid-travel save (they hold function refs
    // that can't survive serialization)
    s.pendingEvent = null;
    s.lastEventResolution = null;

    // If saved mid-travel, bring player back to their origin town
    if (s.travelState) {
      s.screen = 'town';
      s.travelState = null;
    }

    return s;
  } catch {
    return null;
  }
}

function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_SCREEN'; screen: GameState['screen'] }
  | { type: 'BUY_ITEM'; itemId: ItemId; quantity: number }
  | { type: 'SELL_ITEM'; itemId: ItemId; quantity: number }
  | { type: 'BUY_FOOD'; quantity: number }
  | { type: 'START_TRAVEL'; destination: TownId }
  | { type: 'HIRE_GUARD'; guard: Guard }
  | { type: 'FIRE_GUARD'; guardId: string }
  | { type: 'UPGRADE_VEHICLE'; tier: VehicleTier }
  | { type: 'RESOLVE_EVENT'; resolution: EventResolution }
  | { type: 'DAY_TICK' }
  | { type: 'RESET' }
  | { type: 'LOAD_SAVE'; savedState: GameState }
  | { type: 'ACCEPT_CONTRACT'; contractId: string }
  | { type: 'REFRESH_CONTRACTS' }
  | { type: 'LEARN_SKILL'; skillId: string }
  | { type: 'BUY_ESTATE' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'BUY_ITEM': {
      const { state: newState } = buyItem(state, action.itemId, action.quantity);
      return checkGameOver(newState);
    }
    case 'SELL_ITEM': {
      const { state: newState } = sellItem(state, action.itemId, action.quantity);
      return checkGameOver(newState);
    }
    case 'BUY_FOOD': {
      const { state: newState } = buyFood(state, action.quantity);
      return checkGameOver(newState);
    }
    case 'START_TRAVEL': {
      const { state: newState } = startTravel(state, action.destination);
      return newState;
    }
    case 'HIRE_GUARD': {
      const { state: newState } = hireGuard(state, action.guard);
      return newState;
    }
    case 'FIRE_GUARD':
      return fireGuard(state, action.guardId);
    case 'UPGRADE_VEHICLE': {
      const { state: newState } = upgradeVehicle(state, action.tier);
      return newState;
    }
    case 'RESOLVE_EVENT':
      return resolveEventAndContinue(state, action.resolution);
    case 'DAY_TICK': {
      const { state: newState } = performDayTick(state);
      return checkGameOver(newState);
    }
    case 'RESET': {
      clearSave();
      return buildInitialState();
    }
    case 'LOAD_SAVE':
      return action.savedState;
    case 'ACCEPT_CONTRACT': {
      const { state: newState } = acceptContract(state, action.contractId);
      return newState;
    }
    case 'REFRESH_CONTRACTS':
      return { ...state, contracts: generateContracts(state) };
    case 'LEARN_SKILL': {
      const { state: newState } = learnSkill(state, action.skillId);
      return newState;
    }
    case 'BUY_ESTATE': {
      if (state.player.gold < 100_000 || state.player.currentTownId !== 'capital_city') return state;
      const messages = [...state.messageLog, '🏰 You purchased a grand Merchant Estate in the Capital City! You win!'];
      return {
        ...state,
        screen: 'victory',
        player: { ...state.player, gold: state.player.gold - 100_000 },
        messageLog: messages.slice(-20),
      };
    }
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  buyItem: (itemId: ItemId, qty: number) => void;
  sellItem: (itemId: ItemId, qty: number) => void;
  buyFood: (qty: number) => void;
  startTravel: (dest: TownId) => void;
  hireGuard: (guard: Guard) => void;
  fireGuard: (guardId: string) => void;
  upgradeVehicle: (tier: VehicleTier) => void;
  resolveEvent: (resolution: EventResolution) => void;
  dayTick: () => void;
  setScreen: (screen: GameState['screen']) => void;
  reset: () => void;
  hasSave: boolean;
  loadSave: () => void;
  acceptContract: (contractId: string) => void;
  refreshContracts: () => void;
  learnSkill: (skillId: string) => void;
  buyEstate: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function getInitialState(): GameState {
  // Always start at title — player chooses to continue or new game
  return buildInitialState();
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // Auto-save on every meaningful state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const hasSave = loadFromStorage() !== null;

  const ctx: GameContextValue = {
    state,
    dispatch,
    buyItem: useCallback((itemId, qty) => dispatch({ type: 'BUY_ITEM', itemId, quantity: qty }), []),
    sellItem: useCallback((itemId, qty) => dispatch({ type: 'SELL_ITEM', itemId, quantity: qty }), []),
    buyFood: useCallback((qty) => dispatch({ type: 'BUY_FOOD', quantity: qty }), []),
    startTravel: useCallback((dest) => dispatch({ type: 'START_TRAVEL', destination: dest }), []),
    hireGuard: useCallback((guard) => dispatch({ type: 'HIRE_GUARD', guard }), []),
    fireGuard: useCallback((guardId) => dispatch({ type: 'FIRE_GUARD', guardId }), []),
    upgradeVehicle: useCallback((tier) => dispatch({ type: 'UPGRADE_VEHICLE', tier }), []),
    resolveEvent: useCallback((resolution) => dispatch({ type: 'RESOLVE_EVENT', resolution }), []),
    dayTick: useCallback(() => dispatch({ type: 'DAY_TICK' }), []),
    setScreen: useCallback((screen) => dispatch({ type: 'SET_SCREEN', screen }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    hasSave,
    loadSave: useCallback(() => {
      const saved = loadFromStorage();
      if (saved) {
        dispatch({ type: 'LOAD_SAVE', savedState: saved });
      }
    }, []),
    acceptContract: useCallback((contractId: string) => dispatch({ type: 'ACCEPT_CONTRACT', contractId }), []),
    refreshContracts: useCallback(() => dispatch({ type: 'REFRESH_CONTRACTS' }), []),
    learnSkill: useCallback((skillId: string) => dispatch({ type: 'LEARN_SKILL', skillId }), []),
    buyEstate: useCallback(() => dispatch({ type: 'BUY_ESTATE' }), []),
  };

  return <GameContext.Provider value={ctx}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
