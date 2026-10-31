import { useGame } from '../context/GameContext';
import { TOWNS } from '../data/towns';
import { VEHICLES } from '../data/vehicles';
import { SKILLS, getXpForNextLevel } from '../engine/gameEngine';
import type { TownId } from '../types/game';

export function StatsScreen() {
  const { state, setScreen, learnSkill } = useGame();
  const { player } = state;
  const vehicle = VEHICLES[player.vehicleTier];
  const xpProgress = getXpForNextLevel(player.xp);
  const xpPct = Math.round((xpProgress.current / xpProgress.needed) * 100);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #1a0e06, #2a1a0a, #1a1208)',
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
        <h2 style={{ fontSize: '1.3rem' }}>📊 Merchant's Ledger — Statistics & Skills</h2>
        <button className="btn" onClick={() => setScreen('town')}>← Back to Town</button>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'auto',
      }}>
        {/* Stats Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3>📈 Trade Statistics</h3>
          <div className="divider" />
          <StatRow label="Total Days" value={`${state.currentDay}`} />
          <StatRow label="Current Season" value={state.season} />
          <StatRow label="Total Profit" value={`${Math.round(player.totalProfit).toLocaleString()}g`} color={player.totalProfit >= 0 ? '#80d880' : '#ff8070'} />
          <StatRow label="Gold Earned" value={`${player.totalGoldEarned.toLocaleString()}g`} />
          <StatRow label="Gold Spent" value={`${player.totalGoldSpent.toLocaleString()}g`} />
          <StatRow label="Trades Made" value={`${player.totalTradesMade}`} />
          <StatRow label="Cargo Lost" value={`${player.totalCargoLost} units`} />
          <StatRow label="Guards Lost" value={`${player.totalGuardsLost}`} />
          <StatRow label="Events Faced" value={`${player.totalEventsfaced}`} />
          <StatRow label="Contracts Done" value={`${player.totalContractsCompleted}`} />
          <StatRow label="Vehicle" value={`${vehicle.emoji} ${vehicle.name}`} />
          <StatRow label="Towns Visited" value={`${player.townsVisited.length}/${Object.keys(TOWNS).length}`} />

          <div className="divider" />
          <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Towns Discovered
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {(Object.keys(TOWNS) as TownId[]).map(townId => {
              const visited = player.townsVisited.includes(townId);
              return (
                <span
                  key={townId}
                  className={`badge ${visited ? 'badge-green' : ''}`}
                  style={{ opacity: visited ? 1 : 0.3, fontSize: '11px' }}
                >
                  {TOWNS[townId].emoji} {TOWNS[townId].name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Reputation Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3>🤝 Reputation</h3>
          <p style={{ fontSize: '12px', color: 'var(--parchment-darker)' }}>
            Trading profitably at a town builds reputation. High rep = price discounts.
          </p>
          <div className="divider" />

          {(Object.keys(TOWNS) as TownId[]).map(townId => {
            const rep = player.reputation[townId] ?? 0;
            const repColor = rep > 20 ? '#80d880' : rep < -20 ? '#ff8070' : 'var(--parchment-darker)';
            const repLabel = rep >= 50 ? 'Honored' : rep >= 20 ? 'Friendly' : rep <= -50 ? 'Hostile' : rep <= -20 ? 'Unfriendly' : 'Neutral';

            return (
              <div key={townId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ width: '120px' }}>{TOWNS[townId].emoji} {TOWNS[townId].name}</span>
                <div style={{ flex: 1 }}>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div style={{
                      width: `${Math.abs(rep)}%`,
                      height: '100%',
                      background: rep >= 0 ? '#80d880' : '#ff8070',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
                <span style={{ color: repColor, fontSize: '12px', minWidth: '70px', textAlign: 'right' }}>
                  {rep > 0 ? '+' : ''}{rep} ({repLabel})
                </span>
              </div>
            );
          })}

          {/* World Events */}
          <div className="divider" />
          <h3>🌍 World Events</h3>
          {state.activeWorldEvents.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
              The world is at peace. For now.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {state.activeWorldEvents.map(event => {
                const daysLeft = event.endDay - state.currentDay;
                return (
                  <div key={event.id} style={{
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${event.type === 'war' || event.type === 'plague' ? 'var(--red)' : event.type === 'festival' || event.type === 'boom' ? 'var(--green-light)' : 'var(--gold-dark)'}`,
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}>
                    <div style={{ fontWeight: 600 }}>{event.emoji} {event.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>{event.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--parchment-darker)', marginTop: '2px' }}>
                      📍 {event.affectedTowns.map(t => TOWNS[t].name).join(', ')} · ⏰ {daysLeft} days left
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Skills Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3>⭐ Level & Skills</h3>
          <div className="divider" />

          {/* Level & XP */}
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <div style={{ fontSize: '24px', color: 'var(--gold-light)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              Level {player.level}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginTop: '4px' }}>
              XP: {player.xp.toLocaleString()}
            </div>
            <div className="progress-track" style={{ marginTop: '6px' }}>
              <div className="progress-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-darker)', marginTop: '2px' }}>
              {xpProgress.current} / {xpProgress.needed} to next level
            </div>
          </div>

          <div className="divider" />
          <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', marginBottom: '4px' }}>
            Earn XP by buying and selling goods. Each level unlocks new skills.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'auto' }}>
            {SKILLS.map(skill => {
              const learned = player.skills.includes(skill.id);
              const canLearn = player.level >= skill.levelRequired && !learned;
              const locked = player.level < skill.levelRequired;

              return (
                <div key={skill.id} style={{
                  padding: '8px',
                  background: learned ? 'rgba(26,74,26,0.2)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${learned ? 'var(--green-light)' : canLearn ? 'var(--gold)' : 'var(--panel-border)'}`,
                  borderRadius: '4px',
                  opacity: locked ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {skill.emoji} {skill.name}
                      {learned && <span className="badge badge-green" style={{ marginLeft: '6px', fontSize: '10px' }}>✓ Learned</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--parchment-darker)' }}>
                      {skill.description}
                    </div>
                    <div style={{ fontSize: '10px', color: locked ? '#ff9080' : 'var(--gold-dark)' }}>
                      Requires Level {skill.levelRequired}
                    </div>
                  </div>
                  {canLearn && (
                    <button className="btn btn-sm btn-gold" onClick={() => learnSkill(skill.id)}>
                      Learn
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: 'var(--parchment-darker)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? 'var(--parchment)' }}>{value}</span>
    </div>
  );
}

