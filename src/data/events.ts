import type { GameEvent, GameState, EventResolution } from '../types/game';

function noLoss(): EventResolution {
  return { success: true, message: '', goldDelta: 0, foodDelta: 0, cargoLossPct: 0, guardsLost: 0, loot: 0 };
}

function guardPower(state: GameState): number {
  return state.player.guards.reduce((sum, g) => sum + g.power, 0);
}

function cargoCount(state: GameState): number {
  return state.player.inventory.reduce((sum, s) => sum + s.quantity, 0);
}

export const EVENTS: GameEvent[] = [
  // ─── BANDIT AMBUSH ───────────────────────────────────────────────────────────
  {
    id: 'bandit_ambush',
    title: 'Bandit Ambush!',
    emoji: '🗡️',
    description: 'A band of rough-looking outlaws emerges from the tree line, blocking the path. Their leader grins, hand resting on his blade. "Toll time, merchant. Pay up, or else."',
    threatLevel: 15,
    choices: [
      {
        id: 'pay',
        label: '💰 Pay the Toll',
        description: 'Hand over 100 Gold and continue unmolested.',
        resolve: (state): EventResolution => {
          const goldLost = Math.min(100, state.player.gold);
          return { ...noLoss(), success: true, goldDelta: -goldLost, message: `You paid ${goldLost} Gold. The bandits let you pass.` };
        },
      },
      {
        id: 'flee',
        label: '🏃 Flee!',
        description: '50% chance to escape. 50% chance to lose 50% of your cargo.',
        resolve: (state): EventResolution => {
          const roll = Math.random();
          if (roll > 0.5) {
            return { ...noLoss(), success: true, message: 'You spurred your cart and fled into the undergrowth! The bandits give up the chase.' };
          } else {
            const pct = 0.5;
            return { ...noLoss(), success: false, cargoLossPct: pct, message: `You tried to flee but the bandits caught you, making off with half your cargo (${Math.floor(cargoCount(state) * pct)} units)!` };
          }
        },
      },
      {
        id: 'fight',
        label: '⚔️ Fight!',
        description: 'Pit your guards against the bandits. Win to gain loot.',
        resolve: (state): EventResolution => {
          const power = guardPower(state);
          const threat = 15;
          if (power >= threat) {
            return { ...noLoss(), success: true, loot: 50, message: `Your guards cut through the bandits! You find 50 Gold on the fallen outlaws.` };
          } else {
            return { ...noLoss(), success: false, cargoLossPct: 0.5, guardsLost: state.player.guards.length, message: 'Outnumbered and overpowered, your guards are routed. The bandits take half your cargo and all your guards desert in shame.' };
          }
        },
      },
    ],
  },

  // ─── WOLF PACK ────────────────────────────────────────────────────────────
  {
    id: 'wolf_pack',
    title: 'Wolf Pack!',
    emoji: '🐺',
    description: 'A pack of starving wolves surrounds your camp in the night, eyes glinting in the firelight. They are hungry and desperate.',
    threatLevel: 8,
    choices: [
      {
        id: 'scare',
        label: '🔥 Light Torches',
        description: 'Use your Food supply to make a fire. May drive them off.',
        resolve: (state): EventResolution => {
          const foodCost = Math.min(3, state.player.food);
          return { ...noLoss(), success: true, foodDelta: -foodCost, message: `You build a roaring fire and burn ${foodCost} rations. The wolves slink back into the dark.` };
        },
      },
      {
        id: 'fight_wolves',
        label: '⚔️ Fight them off',
        description: 'Your guards engage the pack.',
        resolve: (state): EventResolution => {
          const power = guardPower(state);
          if (power >= 8) {
            return { ...noLoss(), success: true, loot: 20, message: 'Your guards dispatch the wolves. You salvage 20 Gold worth of pelts from the bodies.' };
          } else {
            return { ...noLoss(), success: false, cargoLossPct: 0.2, message: 'The wolves scatter but not before raiding some of your food cargo (20% lost).' };
          }
        },
      },
      {
        id: 'sacrifice_cargo',
        label: '🍖 Throw food scraps',
        description: 'Sacrifice some Food to distract them.',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, foodDelta: -5, message: 'You toss scraps of food into the dark. The wolves are satisfied and leave.' };
        },
      },
    ],
  },

  // ─── CORRUPT GUARD ───────────────────────────────────────────────────────
  {
    id: 'corrupt_guard',
    title: 'Corrupt City Guard',
    emoji: '👮',
    description: 'A city guardsman steps onto the road, hand outstretched. "These goods look suspicious. Either you pay the inspection fee, or I hold you here for a week."',
    threatLevel: 10,
    choices: [
      {
        id: 'bribe',
        label: '💰 Pay the Bribe',
        description: 'Pay 75 Gold to be on your way.',
        resolve: (state): EventResolution => {
          const gold = Math.min(75, state.player.gold);
          return { ...noLoss(), success: true, goldDelta: -gold, message: `You slip ${gold} Gold into his palm. He tips his hat and steps aside.` };
        },
      },
      {
        id: 'argue',
        label: '🗣️ Argue Your Rights',
        description: '40% he backs down. 60% he detains you, costing 2 days upkeep.',
        resolve: (state): EventResolution => {
          if (Math.random() < 0.4) {
            return { ...noLoss(), success: true, message: 'You wave your merchant charter in his face. Flustered, he lets you pass.' };
          }
          const goldLoss = state.player.guards.reduce((s, g) => s + g.dailyWage * 2, 0);
          return { ...noLoss(), success: false, goldDelta: -goldLoss, foodDelta: -2, message: `The guard detains you for 2 days "processing." You lose ${goldLoss} Gold in wages and 2 Food.` };
        },
      },
      {
        id: 'intimidate',
        label: '🛡️ Intimidate With Guards',
        description: 'High guard count impresses him.',
        resolve: (state): EventResolution => {
          if (state.player.guards.length >= 2) {
            return { ...noLoss(), success: true, message: 'Your armed escort makes the corrupt guard think twice. He nods and steps aside.' };
          }
          const gold = Math.min(75, state.player.gold);
          return { ...noLoss(), success: false, goldDelta: -gold, message: 'Your lone guard is unimpressive. You end up paying the full bribe.' };
        },
      },
    ],
  },

  // ─── BLIZZARD ─────────────────────────────────────────────────────────────
  {
    id: 'blizzard',
    title: 'Sudden Blizzard!',
    emoji: '❄️',
    description: 'Dark clouds roll in with terrifying speed. Within minutes, a howling blizzard buries the road in white. You must decide how to wait it out.',
    threatLevel: 0,
    choices: [
      {
        id: 'hunker',
        label: '🏕️ Make Camp',
        description: 'Hunker down. Costs 3 Food and 1 extra Travel Day.',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, foodDelta: -3, message: 'You make a warm camp and wait out the storm. Costs 3 Food. The road is clear by morning.' };
        },
      },
      {
        id: 'push_through',
        label: '❄️ Push Through',
        description: '30% chance to make it. 70% risk losing 20% cargo to frostbite.',
        resolve: (): EventResolution => {
          if (Math.random() < 0.3) {
            return { ...noLoss(), success: true, message: 'Against all odds, you find shelter before the worst hits. No damage done!' };
          }
          return { ...noLoss(), success: false, cargoLossPct: 0.2, message: 'The cold ruins 20% of your cargo. Perishables and fragile goods are destroyed.' };
        },
      },
    ],
  },

  // ─── STRANDED TRAVELER ───────────────────────────────────────────────────
  {
    id: 'stranded_traveler',
    title: 'A Stranded Traveler',
    emoji: '🧑‍💼',
    description: 'A well-dressed merchant sits beside a broken wagon on the roadside, looking utterly defeated. "Please, kind traveler — I will pay handsomely for safe passage to the next town."',
    threatLevel: 0,
    choices: [
      {
        id: 'help',
        label: '🤝 Help Them',
        description: 'Escort them to the next town for a reward of 80–150 Gold.',
        resolve: (): EventResolution => {
          const reward = 80 + Math.floor(Math.random() * 70);
          return { ...noLoss(), success: true, goldDelta: reward, message: `You share your cart with the merchant. Upon arrival they press ${reward} Gold into your hand with heartfelt thanks.` };
        },
      },
      {
        id: 'ignore',
        label: '🚶 Pass Them By',
        description: 'Not your problem. Continue on your way.',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, message: 'You nod sympathetically and continue down the road.' };
        },
      },
      {
        id: 'rob',
        label: '😈 Rob Them',
        description: 'Take their remaining valuables. Gain 50-100 Gold, but gain a "Wanted" reputation (higher danger for 5 days).',
        resolve: (): EventResolution => {
          const loot = 50 + Math.floor(Math.random() * 50);
          return { ...noLoss(), success: true, loot, message: `You relieve the unfortunate merchant of ${loot} Gold. Easy money, but your conscience stings.` };
        },
      },
    ],
  },

  // ─── BROKEN WHEEL ─────────────────────────────────────────────────────────
  {
    id: 'broken_wheel',
    title: 'Broken Wagon Wheel!',
    emoji: '🔧',
    description: 'With a sickening crack, your wagon lurches to a stop. A wheel has shattered on a hidden stone. Without repairs, you cannot continue.',
    threatLevel: 0,
    choices: [
      {
        id: 'pay_repair',
        label: '💰 Pay a Passing Craftsman',
        description: 'A fortunate coincidence — a craftsman is nearby. Pay 80 Gold for immediate repairs.',
        resolve: (state): EventResolution => {
          const cost = Math.min(80, state.player.gold);
          return { ...noLoss(), success: true, goldDelta: -cost, message: `You pay ${cost} Gold and the craftsman has you rolling again within the hour.` };
        },
      },
      {
        id: 'self_repair',
        label: '🔨 Attempt Self-Repair',
        description: '60% chance to fix it yourself. 40% chance of making it worse, losing 1 day.',
        resolve: (): EventResolution => {
          if (Math.random() < 0.6) {
            return { ...noLoss(), success: true, message: 'With some rope and a spare board, you manage a rough repair. It holds! Onward!' };
          }
          return { ...noLoss(), success: false, foodDelta: -2, message: 'Your repair attempt fails. You waste a day and consume 2 Food waiting for a solution.' };
        },
      },
    ],
  },

  // ─── HIDDEN TREASURE ──────────────────────────────────────────────────────
  {
    id: 'hidden_treasure',
    title: 'Hidden Treasure!',
    emoji: '💰',
    description: 'Your cart wheel catches on something buried in the mud. Digging it out, you uncover a weathered chest overgrown with vines. It is locked.',
    threatLevel: 0,
    choices: [
      {
        id: 'force_open',
        label: '🔨 Force It Open',
        description: 'Smash the lock. 70% chance of a jackpot, 30% chance it\'s trapped.',
        resolve: (): EventResolution => {
          if (Math.random() < 0.7) {
            const loot = 100 + Math.floor(Math.random() * 200);
            return { ...noLoss(), success: true, loot, message: `Inside you find a cache of ${loot} Gold! Someone has been saving for a rainy day.` };
          }
          return { ...noLoss(), success: false, goldDelta: -30, message: 'The chest was a trap! A spring mechanism fires, injuring one of your guards. You pay 30 Gold for treatment.' };
        },
      },
      {
        id: 'leave_it',
        label: '🚶 Leave It Alone',
        description: 'Rebury the chest. Might not be worth the risk.',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, message: 'Wisdom prevails. You rebury the chest and press on. Better safe than sorry.' };
        },
      },
    ],
  },

  // ─── WANDERING MERCHANT ───────────────────────────────────────────────────
  {
    id: 'wandering_merchant',
    title: 'Wandering Merchant',
    emoji: '🤝',
    description: 'A cheerful merchant waves you down from the roadside. "Traveler! I\'ve got wares — perhaps we can do business right here on the road?"',
    threatLevel: 0,
    choices: [
      {
        id: 'trade',
        label: '🛍️ Browse Their Wares',
        description: 'Trade some of your Gold for discounted goods (gain 20 Gold equivalent in value).',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, goldDelta: -30, loot: 50, message: 'You trade with the wandering merchant. A good deal! You spend 30 Gold but receive goods worth 50.' };
        },
      },
      {
        id: 'pass',
        label: '🚶 Keep Moving',
        description: 'You have places to be.',
        resolve: (): EventResolution => {
          return { ...noLoss(), success: true, message: 'You share a friendly wave and continue down the road.' };
        },
      },
    ],
  },
];

// ─── Danger-rated event pools ──────────────────────────────────────────────
const DANGER_EVENTS = ['bandit_ambush', 'wolf_pack', 'corrupt_guard', 'blizzard', 'broken_wheel'];
const FORTUNE_EVENTS = ['stranded_traveler', 'hidden_treasure', 'wandering_merchant'];

export function rollForEvent(dangerRating: number): GameEvent | null {
  // Base chance from danger rating
  const dangerRoll = Math.random() * 100;
  if (dangerRoll < dangerRating) {
    // Triggered a danger event
    const pool = EVENTS.filter(e => DANGER_EVENTS.includes(e.id));
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Small chance of fortune event regardless
  if (Math.random() < 0.08) {
    const pool = EVENTS.filter(e => FORTUNE_EVENTS.includes(e.id));
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

