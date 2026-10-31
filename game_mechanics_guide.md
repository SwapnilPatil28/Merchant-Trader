# The Merchant's Ledger: Game Mechanics & System Guide

This document explains the internal logic, mathematical formulas, and progression systems that drive the 2D merchant simulation game. 

---

## 1. The Core Game Loop
The game operates on a continuous cycle of risk-reward decision-making:
1. **Buy:** Purchase goods in a town where supply is high (and prices are low).
2. **Equip:** Ensure you have enough Food and Gold to survive the journey, and Guards to protect the cargo.
3. **Travel:** Select a destination. Time passes, upkeep is consumed, and random events threaten the cargo.
4. **Sell:** Arrive at the destination where the goods are in demand (and prices are high) to make a profit.
5. **Reinvest:** Spend profits on larger carts or more guards to handle bigger, more dangerous shipments.

---

## 2. The Dynamic Economy System

The heart of the game is a node-based economy running on a global "Tick" system. One Tick equals One In-Game Day.

### The Price Formula
Every item in the game has a `BasePrice`. The actual price a town will buy or sell that item for fluctuates based on this formula:
**Current Price = Base Price * (Base Demand / Current Supply)**

*To prevent extreme economy breaks, the price should be clamped between 25% and 400% of the Base Price.*

### Supply and Demand Mechanics
Every town has hidden stats for every item:
*   **Production Rate:** How much of this item the town generates per day (e.g., The Valley Farm produces +5 Wheat per day).
*   **Consumption Rate:** How much of this item the town uses per day (e.g., The Mountain Forge consumes -3 Wheat per day).

### The Mathematical Example
Let's look at **Wheat** (Base Price: 10 Gold, Base Demand: 50).

**Scenario A: The Valley Farm (Producer)**
*   Because they produce wheat, their `Current Supply` is very high (e.g., 200).
*   *Math:* 10 * (50 / 200) = 10 * 0.25 = **2.5 Gold.**
*   *Result:* Wheat is incredibly cheap here. You buy 10 Wheat for 25 Gold.

**Scenario B: The Mountain Forge (Consumer)**
*   Because they can't grow food, their `Current Supply` is dangerously low (e.g., 10).
*   *Math:* 10 * (50 / 10) = 10 * 5 = 50 Gold (Clamped to max 400%, so **40 Gold**).
*   *Result:* Wheat is highly desired. You sell your 10 Wheat for 400 Gold. 
*   *Profit:* 375 Gold.

### Seasonal Shifts
Every 30 in-game days, the Season changes. Seasons act as global modifiers to Production and Consumption.
*   *Winter:* Food production is reduced by 90%. Wood consumption increases by 200%.
*   *Spring:* Tool consumption increases by 150% (planting season).
*   *Summer:* Water/Fluid consumption increases in Desert biomes.

---

## 3. The Travel and Upkeep System

Travel is not instant; it requires resources and exposes the player to danger.

### Distance and Time
Each route between two towns has a specific `Distance`.
*   1 unit of Distance = 1 Day of Travel.

### Daily Upkeep
Every day spent on the road automatically deducts resources from the player's inventory:
*   **Food:** -1 per day (Base) + -1 per Animal/Guard.
*   **Gold (Wages):** Deducts X Gold per hired Guard.

*Starvation Mechanic:* If Food reaches 0 during a trip, a penalty event triggers every day (e.g., "A guard deserts," or "You are forced to eat 1 unit of livestock cargo").

---

## 4. The Event and Risk System

Whenever the player travels, the game checks for random encounters.

### Triggering Events
Every route has a `Danger Rating` (e.g., 20%). Each day of travel, the game rolls a 100-sided die. If the roll is under the Danger Rating, the travel pauses, and an Event UI pops up.

### Resolving Events
Events present choices that test the player's preparations.
**Example Event: Bandit Ambush**
*   **Choice A: Pay the Toll.** Deducts 100 Gold. Journey continues safely.
*   **Choice B: Flee.** 50% RNG chance to escape. 50% chance to lose 50% of your cargo.
*   **Choice C: Fight.** Compares player's `Guard Power` (Number of guards * Guard Tier) against the Bandit's `Threat Level`. 
    *   If `Guard Power` > `Threat Level`: You win, gain 50 Gold in loot.
    *   If `Guard Power` < `Threat Level`: You lose the fight, lose all guards, and lose 50% of cargo.

---

## 5. Player Progression

To make more money, the player must carry more goods. Upgrading the vehicle is the primary progression mechanic.

| Vehicle Tier | Cargo Slots | Base Upkeep (Food/Day) | Max Guards Allowed | Cost to Buy |
| :--- | :--- | :--- | :--- | :--- |
| 1. Backpack | 5 | 1 | 0 | Free (Start) |
| 2. Pushcart | 15 | 1 | 1 | 500 Gold |
| 3. Horse Wagon | 30 | 2 (Horse eats) | 3 | 2,500 Gold |
| 4. Caravan | 60 | 4 (Multiple horses) | 8 | 10,000 Gold |

*Strategic Note:* A player might have the gold to buy a Caravan, but if they cannot afford the massive daily Food and Gold upkeep for the required guards, they will quickly go bankrupt on the road.

---

## 6. Win and Loss Conditions

*   **Loss State (Bankruptcy):** If the player reaches a town with 0 Gold, 0 Cargo, and no Food, they cannot make trades or survive travel. The game is over.
*   **Win State (Retirement):** The Capital City offers a "Buy a Merchant Estate" option for an astronomical price (e.g., 100,000 Gold). Purchasing this triggers the victory screen, celebrating the player's rise from a penniless wanderer to a trade baron.