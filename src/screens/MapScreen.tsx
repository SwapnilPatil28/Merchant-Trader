import { useGame } from '../context/GameContext';
import { TOWNS, TOWN_IDS } from '../data/towns';
import { TOWN_MAP_POSITIONS, getRoute } from '../data/routes';
import { calcPrice } from '../engine/gameEngine';
import { ITEMS } from '../data/items';
import type { TownId } from '../types/game';
import { useState } from 'react';

const SEASON_COLORS: Record<string, string> = {
  Spring: '#2a4a2a',
  Summer: '#4a3a1a',
  Autumn: '#4a2a1a',
  Winter: '#1a2a4a',
};

export function MapScreen() {
  const { state, startTravel, setScreen } = useGame();
  const [hoveredTown, setHoveredTown] = useState<TownId | null>(null);
  const [selectedTown, setSelectedTown] = useState<TownId | null>(null);
  const current = state.player.currentTownId;

  const mapBg = SEASON_COLORS[state.season] ?? '#2a3a2a';

  function handleTownClick(townId: TownId) {
    if (townId === current) return;
    setSelectedTown(townId);
  }

  function handleTravel() {
    if (!selectedTown) return;
    startTravel(selectedTown);
  }

  const route = selectedTown ? getRoute(current, selectedTown) : null;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: `radial-gradient(ellipse at center, ${mapBg} 0%, #0a0604 100%)`,
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: '1.2rem' }}>🗺️ World Map — {state.season}</h2>
        <button className="btn" onClick={() => setScreen('town')}>← Back to Town</button>
      </div>

      {/* Map Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Parchment-style map */}
        <div style={{
          flex: 1,
          position: 'relative',
          margin: '16px',
          border: '3px solid var(--gold-dark)',
          borderRadius: '8px',
          background: `radial-gradient(ellipse, rgba(58,42,20,0.8) 0%, rgba(30,20,10,0.9) 100%), url(/images/ui/map_bg.jpg) center/cover`,
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(200,150,42,0.15)',
          overflow: 'hidden',
        }}>
          {/* Map texture overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200,150,42,0.02) 10px, rgba(200,150,42,0.02) 20px)',
            pointerEvents: 'none',
          }} />

          {/* Draw routes */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {TOWN_IDS.flatMap(fromId =>
              TOWN_IDS.map(toId => {
                if (fromId >= toId) return null;
                const route = getRoute(fromId as TownId, toId as TownId);
                if (!route) return null;
                const fromPos = TOWN_MAP_POSITIONS[fromId as TownId];
                const toPos = TOWN_MAP_POSITIONS[toId as TownId];
                const key = `${fromId}-${toId}`;
                const isActive = (fromId === current || toId === current) &&
                  (fromId === selectedTown || toId === selectedTown);
                return (
                  <line
                    key={key}
                    x1={`${fromPos.x * 100}%`} y1={`${fromPos.y * 100}%`}
                    x2={`${toPos.x * 100}%`}  y2={`${toPos.y * 100}%`}
                    stroke={isActive ? '#c8962a' : '#5a3a1a'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray="8 4"
                    opacity={0.8}
                  />
                );
              })
            ).filter(Boolean)}
          </svg>

          {/* Town Nodes */}
          {TOWN_IDS.map(townId => {
            const town = TOWNS[townId];
            const pos = TOWN_MAP_POSITIONS[townId];
            const isCurrent = townId === current;
            const isSelected = townId === selectedTown;
            const isHovered = townId === hoveredTown;
            const hasRoute = !!getRoute(current, townId as TownId);
            const isReachable = !isCurrent && hasRoute;

            return (
              <div
                key={townId}
                style={{
                  position: 'absolute',
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: isReachable ? 'pointer' : 'default',
                  zIndex: isSelected || isHovered ? 10 : 1,
                }}
                onClick={() => handleTownClick(townId as TownId)}
                onMouseEnter={() => setHoveredTown(townId as TownId)}
                onMouseLeave={() => setHoveredTown(null)}
              >
                {/* Node marker */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <div style={{
                    width: isCurrent ? 52 : isSelected ? 48 : isHovered && isReachable ? 44 : 40,
                    height: isCurrent ? 52 : isSelected ? 48 : isHovered && isReachable ? 44 : 40,
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'radial-gradient(circle, #e8b84a, #8a6418)'
                      : isSelected
                        ? 'radial-gradient(circle, #c8962a, #5a3a08)'
                        : 'radial-gradient(circle, #3a2a12, #1a0e06)',
                    border: `${isCurrent ? 3 : 2}px solid ${isCurrent ? '#f0c850' : isSelected ? '#c8962a' : '#6a4a1a'}`,
                    boxShadow: isCurrent ? '0 0 20px rgba(240,200,80,0.6)' : isSelected ? '0 0 12px rgba(200,150,42,0.5)' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isCurrent ? '24px' : '20px',
                    transition: 'all 0.2s ease',
                    opacity: !isReachable && !isCurrent ? 0.5 : 1,
                  }}>
                    {town.emoji}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: isCurrent ? '#f0c850' : isSelected ? '#e8a030' : 'var(--parchment-darker)',
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    maxWidth: '80px',
                    lineHeight: '1.2',
                  }}>
                    {town.name}
                  </div>
                  {isCurrent && <span style={{ fontSize: '10px', color: '#f0c850' }}>📍 You</span>}
                </div>

                {/* Tooltip */}
                {(isHovered || isSelected) && (
                  <TownTooltip townId={townId as TownId} fromTown={current} />
                )}
              </div>
            );
          })}

          {/* Compass rose */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            fontSize: '28px',
            opacity: 0.4,
          }}>🧭</div>

          {/* Season indicator */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '11px',
            color: 'var(--gold-dark)',
            fontStyle: 'italic',
            opacity: 0.7,
          }}>
            {state.season} · Day {state.currentDay}
          </div>
        </div>

        {/* Info sidebar */}
        {selectedTown && route && (
          <TravelSidebar townId={selectedTown} route={route} onTravel={handleTravel} onCancel={() => setSelectedTown(null)} />
        )}
      </div>
    </div>
  );
}

function TownTooltip({ townId, fromTown }: { townId: TownId; fromTown: TownId }) {
  const { state } = useGame();
  const town = TOWNS[townId];
  const route = getRoute(fromTown, townId);
  const market = state.markets[townId];

  // Rumors: top 3 most extreme price items
  const rumors = town.rumorItems.map(itemId => {
    const supply = market.supplies[itemId] ?? 0;
    const price = calcPrice(itemId, supply);
    const basePrice = ITEMS[itemId].basePrice;
    const ratio = price / basePrice;
    return { itemId, price, ratio };
  }).sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1)).slice(0, 3);

  return (
    <div style={{
      position: 'absolute',
      left: '110%',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(10,6,2,0.96)',
      border: '1px solid var(--gold-dark)',
      borderRadius: '6px',
      padding: '10px',
      minWidth: '200px',
      zIndex: 20,
      fontSize: '13px',
      pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
    }}>
      <div style={{ color: 'var(--gold-light)', fontWeight: 600, marginBottom: '6px' }}>
        {town.emoji} {town.name}
      </div>
      <div style={{ color: 'var(--parchment-darker)', fontSize: '12px', fontStyle: 'italic', marginBottom: '6px' }}>
        {town.biome}
      </div>
      {route && (
        <div style={{ marginBottom: '8px', color: 'var(--parchment)' }}>
          <div>📅 Distance: <strong>{route.distance} days</strong></div>
          <div>⚠️ Danger: <strong style={{ color: route.dangerRating > 25 ? '#ff8070' : 'var(--parchment)' }}>{route.dangerRating}%</strong></div>
          <div style={{ fontSize: '12px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>{route.terrainDescription}</div>
        </div>
      )}
      {rumors.length > 0 && (
        <>
          <div style={{ color: 'var(--gold)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Rumors
          </div>
          {rumors.map(r => (
            <div key={r.itemId} style={{ fontSize: '12px', color: r.ratio > 1.5 ? '#ff9080' : r.ratio < 0.7 ? '#80d880' : 'var(--parchment)' }}>
              {ITEMS[r.itemId].emoji} {ITEMS[r.itemId].name}: {r.price}g {r.ratio > 1.5 ? '🔥 High demand' : r.ratio < 0.7 ? '💸 Surplus' : ''}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function TravelSidebar({ townId, route, onTravel, onCancel }: {
  townId: TownId;
  route: { distance: number; dangerRating: number; terrainDescription: string };
  onTravel: () => void;
  onCancel: () => void;
}) {
  const { state } = useGame();
  const town = TOWNS[townId];
  const vehicle = state.player;
  const dailyFood = 1 + state.player.guards.length;
  const dailyGold = state.player.guards.reduce((s, g) => s + g.dailyWage, 0);
  const totalFood = dailyFood * route.distance;
  const totalGold = dailyGold * route.distance;
  const hasEnoughFood = state.player.food >= totalFood;

  return (
    <div className="panel" style={{
      width: '240px',
      flexShrink: 0,
      margin: '16px 16px 16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      overflow: 'auto',
    }}>
      <h3>🚀 Travel to</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>{town.emoji}</span>
        <span style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{town.name}</span>
      </div>
      <div className="divider" />

      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <InfoRow icon="📅" label="Journey" value={`${route.distance} days`} />
        <InfoRow icon="⚠️" label="Danger" value={`${route.dangerRating}%`} valueColor={route.dangerRating > 25 ? '#ff8070' : 'var(--parchment)'} />
        <InfoRow icon="🍞" label="Food needed" value={`${totalFood}`} valueColor={hasEnoughFood ? '#80d880' : '#ff8070'} />
        {dailyGold > 0 && <InfoRow icon="🪙" label="Wages" value={`${totalGold}g total`} />}
        <div style={{ fontSize: '11px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>{route.terrainDescription}</div>
      </div>

      {!hasEnoughFood && (
        <div style={{ background: 'rgba(138,42,26,0.2)', border: '1px solid var(--red)', borderRadius: '4px', padding: '8px', fontSize: '12px', color: '#ff9080' }}>
          ⚠️ You need {totalFood} food but only have {vehicle.food}. Guards may desert!
        </div>
      )}

      <button className="btn btn-gold" onClick={onTravel} style={{ marginTop: 'auto' }}>
        🚀 Begin Journey
      </button>
      <button className="btn" onClick={onCancel}>✕ Cancel</button>
    </div>
  );
}

function InfoRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--parchment-darker)' }}>{icon} {label}</span>
      <span style={{ color: valueColor ?? 'var(--parchment)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

