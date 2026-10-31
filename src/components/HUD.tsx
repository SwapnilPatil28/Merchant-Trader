import { useGame } from '../context/GameContext';
import { VEHICLES } from '../data/vehicles';

const SEASON_EMOJI: Record<string, string> = {
  Spring: '🌸', Summer: '☀️', Autumn: '🍂', Winter: '❄️',
};

export function HUD() {
  const { state } = useGame();
  const { player, currentDay, season, dayOfSeason } = state;
  const vehicle = VEHICLES[player.vehicleTier];
  const guardPower = player.guards.reduce((s, g) => s + g.power, 0);
  const slotsUsed = player.inventory.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(10,6,2,0.92)',
      borderBottom: '1px solid #6a4a1a',
      padding: '6px 16px',
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--gold-light)' }}>
          ⚖️ The Merchant's Ledger
        </span>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <HUDStat emoji="🪙" label="Gold" value={`${player.gold.toLocaleString()}g`} color="var(--gold-light)" />
        <HUDStat emoji="🍞" label="Food" value={`${player.food}`} color={player.food < 5 ? '#ff8070' : 'var(--parchment)'} />
        <HUDStat emoji={vehicle.emoji} label="Vehicle" value={vehicle.name} />
        <HUDStat emoji="📦" label="Cargo" value={`${slotsUsed}/${vehicle.cargoSlots}`} color={slotsUsed >= vehicle.cargoSlots ? '#ff8070' : 'var(--parchment)'} />
        <HUDStat emoji="🛡️" label="Guards" value={`${player.guards.length}/${vehicle.maxGuards}`} />
        {guardPower > 0 && <HUDStat emoji="⚔️" label="Power" value={`${guardPower}`} color="var(--gold-light)" />}
        <HUDStat emoji={SEASON_EMOJI[season]} label="Season" value={season} />
        <HUDStat emoji="📅" label="Day" value={`${currentDay} (${dayOfSeason + 1}/30)`} />
      </div>
    </div>
  );
}

function HUDStat({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px' }}>
      <span style={{ fontSize: '11px', color: 'var(--parchment-darker)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: color ?? 'var(--parchment)', fontWeight: 600 }}>
        {emoji} {value}
      </span>
    </div>
  );
}

