import { useGame } from '../context/GameContext';
import { GUARD_TIERS, GUARD_NAMES, VEHICLES } from '../data/vehicles';
import type { Guard } from '../types/game';
import { useMemo } from 'react';

export function TavernScreen() {
  const { state, hireGuard, fireGuard, setScreen } = useGame();
  const vehicle = VEHICLES[state.player.vehicleTier];
  const guardsAtMax = state.player.guards.length >= vehicle.maxGuards;

  // Generate available guards for hire (random each visit — memoized per render)
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
      background: `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(/images/towns/tavern_interior.png) center/cover`,
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
        <h2 style={{ fontSize: '1.3rem' }}>🍺 The Tavern — Hire Guards</h2>
        <button className="btn" onClick={() => setScreen('town')}>← Back to Town</button>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Available for hire */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '8px' }}>⚔️ Available for Hire</h3>
          <p style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '12px' }}>
            Hiring costs 5 days' wages upfront. Guards consume 1 food/day and their daily wage on the road.
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
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '4px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>
                        🛡️ {guard.name}
                        <span className={`badge ${guard.tier === 2 ? 'badge-gold' : 'badge-blue'}`} style={{ marginLeft: '8px' }}>
                          {tierDef.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginTop: '2px' }}>
                        ⚔️ Power: {guard.power} · 🪙 Wage: {guard.dailyWage}g/day · Hire cost: {hireCost}g
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
        </div>

        {/* Current guards */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '8px' }}>
            🛡️ Your Guards ({state.player.guards.length}/{vehicle.maxGuards})
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '12px' }}>
            Total power: ⚔️ {state.player.guards.reduce((s, g) => s + g.power, 0)} · 
            Daily wages: 🪙 {state.player.guards.reduce((s, g) => s + g.dailyWage, 0)}g
          </p>

          {state.player.guards.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
              No guards hired. You're traveling alone — watch out for bandits!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.player.guards.map(guard => {
                const tierDef = GUARD_TIERS.find(t => t.tier === guard.tier)!;
                return (
                  <div key={guard.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '4px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>
                        🛡️ {guard.name}
                        <span className={`badge ${guard.tier === 2 ? 'badge-gold' : 'badge-blue'}`} style={{ marginLeft: '8px' }}>
                          {tierDef.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginTop: '2px' }}>
                        ⚔️ Power: {guard.power} · 🪙 Wage: {guard.dailyWage}g/day
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => fireGuard(guard.id)}>
                      Dismiss
                    </button>
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
