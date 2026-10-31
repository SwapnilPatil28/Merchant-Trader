import { useGame } from '../context/GameContext';
import { GUARD_TIERS, GUARD_NAMES, VEHICLES } from '../data/vehicles';
import { TOWNS } from '../data/towns';
import { ITEMS } from '../data/items';
import type { Guard } from '../types/game';
import { useMemo, useEffect } from 'react';

export function TavernScreen() {
  const { state, hireGuard, fireGuard, setScreen, acceptContract, refreshContracts } = useGame();
  const vehicle = VEHICLES[state.player.vehicleTier];
  const guardsAtMax = state.player.guards.length >= vehicle.maxGuards;

  // Generate contracts if none exist
  useEffect(() => {
    if (state.contracts.length === 0) {
      refreshContracts();
    }
  }, [state.contracts.length, refreshContracts]);

  // Generate available guards for hire
  const availableGuards = useMemo(() => {
    const guards: Guard[] = [];
    const usedNames = new Set(state.player.guards.map(g => g.name));
    const names = GUARD_NAMES.filter(n => !usedNames.has(n));

    for (let i = 0; i < 4 && i < names.length; i++) {
      const tierDef = GUARD_TIERS[Math.random() < 0.6 ? 0 : 1];
      guards.push({
        id: `guard-${Date.now()}-${i}`,
        name: names[i],
        tier: tierDef.tier,
        power: tierDef.power + Math.floor(Math.random() * 3),
        dailyWage: tierDef.dailyWage,
      });
    }
    return guards;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.player.currentTownId, state.currentDay]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), linear-gradient(160deg, #2a1608, #3a2010, #1a0e06), url(/images/towns/tavern_interior.jpg) center/cover`,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.7)',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: '1.3rem' }}>🍺 The Tavern</h2>
        <button className="btn" onClick={() => setScreen('town')}>← Back to Town</button>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Available for hire */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '8px' }}>⚔️ Hire Guards</h3>
          <p style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '12px' }}>
            Hiring costs 5 days' wages upfront.
          </p>

          {vehicle.maxGuards === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
              Your {vehicle.name} has no room for guards. Upgrade your vehicle first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableGuards.map(guard => {
                const hireCost = guard.dailyWage * 5;
                const canAfford = state.player.gold >= hireCost;
                const tierDef = GUARD_TIERS.find(t => t.tier === guard.tier)!;

                return (
                  <div key={guard.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '4px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        🛡️ {guard.name}
                        <span className={`badge ${guard.tier === 2 ? 'badge-gold' : 'badge-blue'}`} style={{ marginLeft: '6px' }}>
                          {tierDef.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--parchment-darker)', marginTop: '2px' }}>
                        ⚔️ {guard.power} · 🪙 {guard.dailyWage}g/day · Cost: {hireCost}g
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-gold"
                      disabled={guardsAtMax || !canAfford}
                      onClick={() => hireGuard(guard)}
                    >
                      Hire
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current guards */}
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
            <h3 style={{ marginBottom: '6px', fontSize: '1rem' }}>
              🛡️ Your Guards ({state.player.guards.length}/{vehicle.maxGuards})
            </h3>
            {state.player.guards.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
                No guards. Dangerous!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {state.player.guards.map(guard => (
                  <div key={guard.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px', fontSize: '13px',
                  }}>
                    <span>🛡️ {guard.name} (⚔️{guard.power})</span>
                    <button className="btn btn-sm btn-danger" onClick={() => fireGuard(guard.id)} style={{ padding: '2px 6px', fontSize: '11px' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contracts Board */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '8px' }}>📜 Bulletin Board — Contracts</h3>
          <p style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '12px' }}>
            Deliver goods to earn bonus gold. Max 3 active.
          </p>

          {state.contracts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
              No contracts available. Check back later.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.contracts.map(contract => {
                const item = ITEMS[contract.itemId];
                const destTown = TOWNS[contract.destination];
                const daysLeft = contract.deadlineDay - state.currentDay;
                const urgent = daysLeft <= 5;

                return (
                  <div key={contract.id} style={{
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${urgent ? 'var(--red)' : 'var(--panel-border)'}`,
                    borderRadius: '4px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>
                        {item.emoji} {contract.quantity}x {item.name}
                      </span>
                      <span className="badge badge-gold" style={{ fontSize: '12px' }}>
                        +{contract.reward}g
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--parchment-darker)' }}>
                      → {destTown.emoji} {destTown.name}
                    </div>
                    <div style={{ fontSize: '11px', color: urgent ? '#ff8070' : 'var(--parchment-darker)', marginTop: '2px' }}>
                      ⏰ {daysLeft} days remaining {urgent && '⚠️ URGENT'}
                    </div>
                    <button
                      className="btn btn-sm btn-gold"
                      style={{ marginTop: '6px', width: '100%', justifyContent: 'center' }}
                      disabled={state.activeContracts.length >= 3}
                      onClick={() => acceptContract(contract.id)}
                    >
                      Accept Contract
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Contracts */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '8px' }}>📋 Active Contracts ({state.activeContracts.length}/3)</h3>

          {state.activeContracts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
              No active contracts. Check the bulletin board!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.activeContracts.map(contract => {
                const item = ITEMS[contract.itemId];
                const destTown = TOWNS[contract.destination];
                const daysLeft = contract.deadlineDay - state.currentDay;
                const expired = daysLeft <= 0;
                const playerHas = state.player.inventory.find(s => s.itemId === contract.itemId)?.quantity ?? 0;
                const hasFull = playerHas >= contract.quantity;

                return (
                  <div key={contract.id} style={{
                    padding: '10px',
                    background: expired ? 'rgba(138,42,26,0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${expired ? 'var(--red)' : hasFull ? 'var(--green-light)' : 'var(--panel-border)'}`,
                    borderRadius: '4px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>
                        {item.emoji} {contract.quantity}x {item.name}
                      </span>
                      <span className="badge badge-gold">+{contract.reward}g</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--parchment-darker)' }}>
                      → {destTown.emoji} {destTown.name}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      <span style={{ color: hasFull ? '#80d880' : '#ff9080' }}>
                        📦 Have: {playerHas}/{contract.quantity}
                      </span>
                      {' · '}
                      <span style={{ color: expired ? '#ff6050' : daysLeft <= 5 ? '#ff9080' : 'var(--parchment-darker)' }}>
                        ⏰ {expired ? 'EXPIRED' : `${daysLeft} days left`}
                      </span>
                    </div>
                    {hasFull && !expired && (
                      <div style={{ fontSize: '11px', color: '#80d880', marginTop: '2px', fontStyle: 'italic' }}>
                        ✅ Ready to deliver at {destTown.name}!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
