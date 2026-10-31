import { useGame } from '../context/GameContext';
import { VEHICLES } from '../data/vehicles';
import { hasSkill } from '../engine/gameEngine';
import type { VehicleTier } from '../types/game';

export function WainwrightScreen() {
  const { state, upgradeVehicle, setScreen } = useGame();
  const currentTier = state.player.vehicleTier;
  const bonusSlots = hasSkill(state, 'bulk_trader') ? 5 : 0;

  const tiers = ([1, 2, 3, 4] as VehicleTier[]).map(t => VEHICLES[t]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #2a1a0a, #1a0e06, #2a2010)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: '1.3rem' }}>🔧 The Wainwright — Upgrade Vehicle</h2>
        <button className="btn" onClick={() => setScreen('town')}>← Back to Town</button>
      </div>

      {/* Vehicle tiers */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        padding: '16px',
        overflow: 'auto',
        alignContent: 'start',
      }}>
        {tiers.map(vehicle => {
          const isOwned = vehicle.tier <= currentTier;
          const isCurrent = vehicle.tier === currentTier;
          const isNext = vehicle.tier === currentTier + 1;
          const canAfford = state.player.gold >= vehicle.cost;

          return (
            <div
              key={vehicle.tier}
              className={`panel ${isCurrent ? 'panel-gold' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                opacity: isOwned && !isCurrent ? 0.5 : 1,
                position: 'relative',
              }}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="badge badge-gold" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  ✓ Current
                </div>
              )}

              {/* Vehicle icon */}
              <div style={{ textAlign: 'center', fontSize: '48px', padding: '8px' }}>
                {vehicle.emoji}
              </div>

              <h3 style={{ textAlign: 'center', color: isCurrent ? 'var(--gold-light)' : 'var(--parchment)' }}>
                {vehicle.name}
              </h3>

              <div className="divider" />

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                <StatRow icon="📦" label="Cargo Capacity" value={`${vehicle.cargoSlots}${bonusSlots > 0 ? ` +${bonusSlots}` : ''} slots`} />
                <StatRow icon="🍞" label="Food Upkeep" value={`${vehicle.foodUpkeepPerDay}/day`} />
                <StatRow icon="🛡️" label="Max Guards" value={`${vehicle.maxGuards}`} />
                <StatRow icon="🪙" label="Cost" value={vehicle.cost === 0 ? 'Free' : `${vehicle.cost.toLocaleString()} Gold`} />
              </div>

              {/* Comparison with current */}
              {!isOwned && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '12px',
                }}>
                  <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '4px' }}>vs. Current:</div>
                  <div style={{ color: '#80d880' }}>
                    +{vehicle.cargoSlots - VEHICLES[currentTier].cargoSlots} cargo slots
                  </div>
                  <div style={{ color: '#80d880' }}>
                    +{vehicle.maxGuards - VEHICLES[currentTier].maxGuards} guard slots
                  </div>
                  <div style={{ color: '#ff9080' }}>
                    +{vehicle.foodUpkeepPerDay - VEHICLES[currentTier].foodUpkeepPerDay} food/day
                  </div>
                </div>
              )}

              {/* Action */}
              {!isOwned && (
                <button
                  className={`btn ${isNext && canAfford ? 'btn-gold' : ''} w-full`}
                  disabled={!isNext || !canAfford}
                  onClick={() => upgradeVehicle(vehicle.tier)}
                  style={{ marginTop: 'auto', justifyContent: 'center' }}
                >
                  {!canAfford
                    ? `Need ${(vehicle.cost - state.player.gold).toLocaleString()} more Gold`
                    : !isNext
                      ? 'Must upgrade sequentially'
                      : `⬆️ Upgrade for ${vehicle.cost.toLocaleString()}g`
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--parchment-darker)' }}>{icon} {label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

