import { useGame } from '../context/GameContext';
import { TOWNS } from '../data/towns';
import { calcPrice, hasSkill } from '../engine/gameEngine';
import { ITEMS } from '../data/items';
import type { ItemId } from '../types/game';
import { useState } from 'react';
import { VEHICLES } from '../data/vehicles';
import { getTownImage } from '../data/images';
import { Sparkline } from '../components/Sparkline';

export function TownScreen() {
  const { state, setScreen, buyEstate } = useGame();
  const town = TOWNS[state.player.currentTownId];
  const market = state.markets[state.player.currentTownId];
  const vehicle = VEHICLES[state.player.vehicleTier];
  // Bulk Trader skill: +5 cargo slots
  const bonusSlots = hasSkill(state, 'bulk_trader') ? 5 : 0;
  const effectiveMaxSlots = vehicle.cargoSlots + bonusSlots;
  const slotsUsed = state.player.inventory.reduce((s, i) => s + i.quantity, 0);

  // Use AI-generated town background with fallback gradient
  const bgImage = getTownImage(state.player.currentTownId);
  const gradient = `linear-gradient(160deg, ${town.backgroundGradient.join(', ')})`;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: bgImage
        ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%), url(${bgImage}) center/cover`
        : gradient,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Town banner */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '28px' }}>{town.emoji}</span>
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>{town.name}</h2>
          <p style={{ fontSize: '13px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>{town.description}</p>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Market Panel */}
        <MarketPanel market={market} slotsUsed={slotsUsed} maxSlots={effectiveMaxSlots} playerGold={state.player.gold} />

        {/* Player Inventory Panel */}
        <InventoryPanel slotsUsed={slotsUsed} maxSlots={effectiveMaxSlots} />
      </div>

      {/* Footer Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.6)',
        borderTop: '1px solid var(--panel-border)',
        flexWrap: 'wrap',
      }}>
        <button className="btn" onClick={() => setScreen('tavern')}>🍺 Tavern <span style={{ fontSize: '12px', opacity: 0.7 }}>(Guards & Contracts)</span></button>
        <button className="btn" onClick={() => setScreen('wainwright')}>🔧 Wainwright <span style={{ fontSize: '12px', opacity: 0.7 }}>(Upgrade Vehicle)</span></button>
        <button className="btn" onClick={() => setScreen('stats')}>📊 Ledger <span style={{ fontSize: '12px', opacity: 0.7 }}>(Stats & Skills)</span></button>
        <button className="btn btn-gold" onClick={() => setScreen('map')}>🗺️ Open Map</button>
        {state.player.currentTownId === 'capital_city' && state.player.gold >= 100_000 && (
          <button className="btn" style={{ background: 'linear-gradient(180deg, #5a3a00, #3a2000)', borderColor: 'var(--gold-light)' }}
            onClick={buyEstate}>
            🏰 Buy Merchant Estate (100,000g)
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Market Panel ───────────────────────────────────────────────────────────

function MarketPanel({ market, slotsUsed, maxSlots, playerGold }: {
  market: { supplies: Record<ItemId, number> };
  slotsUsed: number; maxSlots: number; playerGold: number;
}) {
  const { buyItem, state } = useGame();
  const [qty, setQty] = useState<Record<ItemId, number>>({} as Record<ItemId, number>);
  const [flash, setFlash] = useState<string>('');

  const getQty = (id: ItemId) => qty[id] ?? 1;

  function handleBuy(itemId: ItemId) {
    const q = getQty(itemId);
    buyItem(itemId, q);
    setFlash(itemId);
    setTimeout(() => setFlash(''), 600);
  }

  const itemsWithStock = (Object.keys(market.supplies) as ItemId[])
    .filter(id => (market.supplies[id] ?? 0) > 0)
    .sort((a, b) => ITEMS[a].name.localeCompare(ITEMS[b].name));

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 style={{ marginBottom: '8px' }}>🏪 Town Market</h3>
      <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '8px' }}>
        Cargo: <span style={{ color: slotsUsed >= maxSlots ? '#ff8070' : 'var(--parchment)' }}>{slotsUsed}/{maxSlots} slots</span>
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Trend</th>
              <th>Qty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itemsWithStock.map(itemId => {
              const supply = market.supplies[itemId] ?? 0;
              const rep = state.player.reputation[state.player.currentTownId] ?? 0;
              const price = calcPrice(itemId, supply, rep, state.player.skills);
              const item = ITEMS[itemId];
              const q = getQty(itemId);
              const totalCost = price * q;
              const canAfford = playerGold >= totalCost;
              const hasSpace = slotsUsed + q <= maxSlots;
              const rowFlash = flash === itemId;
              const priceHist = state.priceHistory[state.player.currentTownId]?.[itemId] ?? [];

              return (
                <tr key={itemId} style={{ background: rowFlash ? 'rgba(200,150,42,0.15)' : undefined }}>
                  <td>
                    <span style={{ fontSize: '18px' }}>{item.emoji}</span>{' '}
                    <span style={{ fontSize: '13px' }}>{item.name}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{supply}</td>
                  <td>
                    <PriceDisplay price={price} basePrice={item.basePrice} />
                  </td>
                  <td style={{ width: '50px' }}>
                    <Sparkline data={priceHist} />
                  </td>
                  <td style={{ width: '60px' }}>
                    <input
                      type="number"
                      min={1}
                      max={Math.min(supply, maxSlots - slotsUsed, Math.floor(playerGold / price))}
                      value={q}
                      onChange={e => setQty(prev => ({ ...prev, [itemId]: Math.max(1, +e.target.value) }))}
                      style={{
                        width: '52px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '3px',
                        color: 'var(--parchment)',
                        padding: '2px 4px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-body)',
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-gold"
                      onClick={() => handleBuy(itemId)}
                      disabled={!canAfford || !hasSpace || supply < q}
                      title={!canAfford ? 'Not enough gold' : !hasSpace ? 'No cargo space' : `Buy ${q} for ${totalCost}g`}
                    >
                      Buy {totalCost}g
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {itemsWithStock.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--parchment-darker)', padding: '20px', fontStyle: 'italic' }}>
            The market shelves are bare.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Inventory Panel ─────────────────────────────────────────────────────────

function InventoryPanel({ slotsUsed, maxSlots }: { slotsUsed: number; maxSlots: number }) {
  const { state, sellItem } = useGame();
  const [qty, setQty] = useState<Record<ItemId, number>>({} as Record<ItemId, number>);

  const getQty = (id: ItemId) => qty[id] ?? 1;
  const market = state.markets[state.player.currentTownId];

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 style={{ marginBottom: '8px' }}>🎒 Your Cargo</h3>
      <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '8px' }}>
        {slotsUsed} / {maxSlots} slots used
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        {state.player.inventory.length === 0 ? (
          <p style={{ color: 'var(--parchment-darker)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
            Your pack is empty. Visit the market to buy goods.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Bought@</th>
                <th>Sell@</th>
                <th>P/L</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.player.inventory.map(slot => {
                const item = ITEMS[slot.itemId];
                const marketSupply = market.supplies[slot.itemId] ?? 1;
                const rep = state.player.reputation[state.player.currentTownId] ?? 0;
                const sellPrice = calcPrice(slot.itemId, marketSupply, rep);
                const q = getQty(slot.itemId);
                const profitPer = sellPrice - slot.purchasePrice;
                const totalProfit = profitPer * q;

                return (
                  <tr key={slot.itemId}>
                    <td>
                      <span style={{ fontSize: '18px' }}>{item.emoji}</span>{' '}
                      <span style={{ fontSize: '13px' }}>{item.name}</span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{slot.quantity}</td>
                    <td style={{ fontSize: '13px', color: 'var(--parchment-darker)' }}>{Math.round(slot.purchasePrice)}g</td>
                    <td><PriceDisplay price={sellPrice} basePrice={item.basePrice} /></td>
                    <td>
                      <span style={{ color: totalProfit >= 0 ? '#80d880' : '#ff8070', fontSize: '13px' }}>
                        {totalProfit >= 0 ? '+' : ''}{Math.round(totalProfit)}g
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min={1}
                          max={slot.quantity}
                          value={q}
                          onChange={e => setQty(prev => ({ ...prev, [slot.itemId]: Math.max(1, Math.min(slot.quantity, +e.target.value)) }))}
                          style={{
                            width: '44px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--panel-border)',
                            borderRadius: '3px',
                            color: 'var(--parchment)',
                            padding: '2px 4px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                        <button
                          className="btn btn-sm"
                          onClick={() => sellItem(slot.itemId, q)}
                          style={{ borderColor: profitPer > 0 ? 'var(--green-light)' : 'var(--red)' }}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Food purchase shortcut */}
      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--panel-border)' }}>
        <FoodPurchaseBar />
      </div>
    </div>
  );
}

function FoodPurchaseBar() {
  const { state, buyFood } = useGame();
  const market = state.markets[state.player.currentTownId];
  const foodSupply = market.supplies['food'] ?? 0;
  const foodPrice = calcPrice('food', foodSupply);
  const [qty, setQty] = useState(5);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', color: 'var(--parchment-darker)' }}>🍞 Buy Rations:</span>
      <input
        type="number" min={1} max={50} value={qty}
        onChange={e => setQty(Math.max(1, +e.target.value))}
        style={{
          width: '50px', background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--panel-border)', borderRadius: '3px',
          color: 'var(--parchment)', padding: '2px 4px', fontSize: '13px',
          fontFamily: 'var(--font-body)',
        }}
      />
      <button
        className="btn btn-sm"
        onClick={() => buyFood(qty)}
        disabled={state.player.gold < foodPrice * qty || foodSupply < qty}
      >
        Buy {qty} for {foodPrice * qty}g
      </button>
      <span style={{ fontSize: '12px', color: 'var(--parchment-darker)' }}>
        (Current food: {state.player.food})
      </span>
    </div>
  );
}

function PriceDisplay({ price, basePrice }: { price: number; basePrice: number }) {
  const ratio = price / basePrice;
  let color = 'var(--parchment)';
  let tag = '';
  if (ratio <= 0.5) { color = '#80d880'; tag = '↓↓'; }
  else if (ratio <= 0.85) { color = '#a0e0a0'; tag = '↓'; }
  else if (ratio >= 3.0) { color = '#ff6050'; tag = '↑↑'; }
  else if (ratio >= 2.0) { color = '#ff9080'; tag = '↑'; }

  return (
    <span style={{ color, fontSize: '13px', fontWeight: 600 }}>
      {price}g <span style={{ fontSize: '10px' }}>{tag}</span>
    </span>
  );
}

