# ⚖️ The Merchant's Ledger

A 2D menu-driven economic simulator where you play as a traveling merchant navigating a dynamic supply-and-demand economy, managing cargo space, and surviving text-based road events.

![Title Screen](public/images/ui/title_bg.jpg)

## 🎮 Play

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🏗️ Tech Stack

- **React 18** + **TypeScript** — UI and game state
- **Vite** — dev server and bundler
- **HTML5/CSS** — dark fantasy parchment theme
- **AI-Generated Art** — watercolor concept art backgrounds and portraits

## 🗺️ Game Overview

**Core Loop:** Buy low → Travel → Sell high → Upgrade → Repeat

### Towns
| Town | Produces | Demands |
|------|----------|---------|
| 🌾 Valley Farm | Wheat, Livestock, Food | Tools, Iron |
| ⛏️ Mountain Forge | Iron, Tools, Weapons | Wheat, Cloth, Food |
| 🏜️ Desert Bazaar | Spices, Silk | Water, Tools, Livestock |
| 🌲 Deepwood Camp | Timber, Furs | Weapons, Wheat |
| 🏰 Capital City | Luxury Goods, Cloth | Spices, Furs, Iron |

### Economy
Prices follow a dynamic supply/demand formula: `Price = BasePrice × (BaseDemand / CurrentSupply)`, clamped between 25%–400% of base. Towns produce and consume goods every in-game day. Seasons rotate every 30 days with global modifiers — Winter crushes food production, Spring spikes tool demand.

### Travel
Select a destination on the world map. Each route has a distance (days) and danger rating. Every travel day consumes food and guard wages. Random events (bandits, blizzards, treasure) trigger based on the route's danger.

### Progression
| Vehicle | Cargo | Max Guards | Cost |
|---------|-------|------------|------|
| 🎒 Backpack | 5 | 0 | Free |
| 🛒 Pushcart | 15 | 1 | 500g |
| 🐴 Horse Wagon | 30 | 3 | 2,500g |
| 🏕️ Caravan | 60 | 8 | 10,000g |

### Win Condition
Buy the Merchant Estate in the Capital City for **100,000 Gold**.

## 📁 Project Structure

```
src/
├── types/game.ts          # All TypeScript types
├── data/                  # Static game data
│   ├── items.ts           # 14 tradeable goods
│   ├── towns.ts           # 5 towns with production rates
│   ├── routes.ts          # Route distances and danger
│   ├── vehicles.ts        # 4 vehicle tiers
│   └── events.ts          # 8 random road events
├── engine/gameEngine.ts   # Pure state machine (economy, trade, combat)
├── context/GameContext.tsx # React reducer + localStorage auto-save
├── components/            # HUD, MessageLog
├── screens/               # Title, Town, Map, Travel, Event, Tavern, Wainwright, GameOver, Victory
└── styles/global.css      # Dark fantasy parchment theme
```

## 📜 License

MIT
