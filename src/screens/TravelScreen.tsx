import { useGame } from '../context/GameContext';
import { TOWNS } from '../data/towns';
import { VEHICLES } from '../data/vehicles';
import { useEffect, useRef, useState } from 'react';

export function TravelScreen() {
  const { state, dayTick } = useGame();
  const travel = state.travelState;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [animFrame, setAnimFrame] = useState(0);

  // Auto-tick days while traveling
  useEffect(() => {
    if (!travel || travel.eventPending || state.pendingEvent) return;

    timerRef.current = setInterval(() => {
      dayTick();
      setAnimFrame(f => f + 1);
    }, 1200); // 1.2 seconds per day

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [travel, travel?.eventPending, state.pendingEvent, dayTick]);

  if (!travel) return null;

  const destination = TOWNS[travel.destination];
  const origin = TOWNS[state.player.currentTownId];
  const vehicle = VEHICLES[state.player.vehicleTier];
  const progress = ((travel.totalDays - travel.daysRemaining) / travel.totalDays) * 100;
  const guardPower = state.player.guards.reduce((s, g) => s + g.power, 0);

  // Wagon animation dots
  const wagonDots = '• '.repeat(Math.max(1, Math.floor(animFrame % 4) + 1));

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a2a1a 0%, #0a0604 100%)',
      padding: '24px',
      gap: '20px',
      textAlign: 'center',
    }}>
      {/* Traveling banner */}
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '2rem' }}>🛤️ On the Road</h1>
        <p style={{ color: 'var(--parchment-darker)', fontStyle: 'italic', fontSize: '14px' }}>
          {origin.name} → {destination.name}
        </p>
      </div>

      {/* Animated wagon scene */}
      <div style={{
        width: '90%',
        maxWidth: '700px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        padding: '20px',
      }}>
        {/* Road animation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>{origin.emoji}</span>
          <div style={{ flex: 1, margin: '0 12px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, var(--gold-dark), var(--panel-border))',
            }} />
            <span style={{
              position: 'absolute',
              left: `${progress}%`,
              transform: 'translateX(-50%)',
              fontSize: '28px',
              transition: 'left 0.8s ease',
              filter: 'drop-shadow(0 0 6px rgba(200,150,42,0.5))',
            }}>
              {vehicle.emoji}
            </span>
          </div>
          <span style={{ fontSize: '28px' }}>{destination.emoji}</span>
        </div>

        {/* Progress bar */}
        <div className="progress-track" style={{ marginBottom: '12px' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--parchment-darker)' }}>
          <span>{Math.round(progress)}% complete</span>
          <span>{travel.daysRemaining} days remaining</span>
        </div>
      </div>

      {/* Status grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '10px',
        width: '90%',
        maxWidth: '500px',
      }}>
        <StatusCard emoji="📅" label="Day" value={`${state.currentDay}`} />
        <StatusCard emoji="🪙" label="Gold" value={`${state.player.gold}`} color="var(--gold-light)" />
        <StatusCard emoji="🍞" label="Food" value={`${state.player.food}`} color={state.player.food < 3 ? '#ff8070' : undefined} />
        <StatusCard emoji="🛡️" label="Guards" value={`${state.player.guards.length}`} />
        <StatusCard emoji="⚔️" label="Power" value={`${guardPower}`} />
        <StatusCard emoji="📦" label="Cargo" value={`${state.player.inventory.reduce((s, i) => s + i.quantity, 0)}`} />
      </div>

      {/* Log messages */}
      <div style={{
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80px',
        overflow: 'auto',
        fontSize: '12px',
        color: 'var(--parchment-darker)',
        fontStyle: 'italic',
      }}>
        {state.messageLog.slice(-4).map((msg, i) => (
          <div key={i} style={{ padding: '2px 0', opacity: 0.5 + (i * 0.15) }}>{msg}</div>
        ))}
      </div>

      {/* Animated dots */}
      <p className="pulse" style={{ color: 'var(--gold-dark)', letterSpacing: '4px' }}>{wagonDots}</p>
    </div>
  );
}

function StatusCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color?: string }) {
  return (
    <div className="panel" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
    }}>
      <span style={{ fontSize: '10px', color: 'var(--parchment-darker)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: '16px', color: color ?? 'var(--parchment)', fontWeight: 600 }}>
        {emoji} {value}
      </span>
    </div>
  );
}

